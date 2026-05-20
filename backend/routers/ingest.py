"""
routers/ingest.py
-----------------
File-upload endpoint for the e-commerce AI agent platform.

POST /api/ingest/upload
  - Accepts 1-5 files (.pdf / .csv / .json / .html / .txt)
  - Parses each file using the matching ingestion parser
  - Auto-fills remaining slots (up to 5) from the mock SQLite DB
  - Returns session_id + source summaries
  - Client then opens WebSocket /ws/{session_id} and calls
    POST /api/agent/run-upload  { session_id }

GET /api/ingest/session/{session_id}
  - Returns stored session metadata

DELETE /api/ingest/session/{session_id}
  - Cleans up temp files and session memory
"""

import json
import os
import uuid
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/ingest")

# In-memory session store (shared with agent runner via import)
upload_sessions: dict = {}


# ── Parser dispatch ───────────────────────────────────────────────────────────

async def _parse_file(ext: str, temp_path: str) -> dict:
    """
    Route a temp file to the correct parser based on extension.
    Returns the parser result dict (raw_text, credibility_score, …).
    """
    if ext == "pdf":
        from ingestion.pdf_parser import parse_pdf
        return await parse_pdf(temp_path)

    elif ext in ("csv", "json"):
        from ingestion.csv_parser import parse_csv
        return await parse_csv(temp_path)

    elif ext == "html":
        from ingestion.table_parser import parse_table
        return await parse_table(temp_path)

    elif ext == "txt":
        from ingestion.web_parser import parse_web
        # web_parser expects a URL or raw text path; pass the path directly
        return await parse_web(temp_path)

    else:
        # Unknown extension — read raw text
        with open(temp_path, "r", errors="replace") as f:
            raw = f.read()
        return {
            "raw_text": raw,
            "credibility_score": 0.70,
            "freshness": "fresh",
            "word_count": len(raw.split()),
        }


# ── DB auto-fill helpers ──────────────────────────────────────────────────────

def _build_csv_text(rows: list) -> str:
    """Convert a list-of-dicts into a CSV-like string for raw_text."""
    if not rows:
        return ""
    headers = list(rows[0].keys())
    lines = [",".join(str(h) for h in headers)]
    for row in rows:
        lines.append(",".join(str(row.get(h, "")) for h in headers))
    return "\n".join(lines)


def _build_html_table(rows: list, title: str = "") -> str:
    """Convert a list-of-dicts into a minimal HTML table."""
    if not rows:
        return f"<p>{title}: no data available</p>"
    headers = list(rows[0].keys())
    th = "".join(f"<th>{h}</th>" for h in headers)
    body_rows = ""
    for row in rows:
        td = "".join(f"<td>{row.get(h,'')}</td>" for h in headers)
        body_rows += f"<tr>{td}</tr>"
    return (
        f"<h2>{title}</h2>"
        f"<table border='1'><thead><tr>{th}</tr></thead>"
        f"<tbody>{body_rows}</tbody></table>"
    )


AUTO_FILL_SPECS = [
    {
        "filename": "auto_inventory_snapshot.csv",
        "source_type": "csv",
        "label": "Auto: Current Inventory Anomalies",
        "db_func": "get_anomalous_skus",
        "fmt": "csv",
    },
    {
        "filename": "auto_complaint_summary.json",
        "source_type": "json",
        "label": "Auto: Recent Complaint Activity (7-day)",
        "db_func": "get_price_contradictions",   # no-arg global query
        "fmt": "json",
    },
    {
        "filename": "auto_supplier_status.html",
        "source_type": "html",
        "label": "Auto: Overdue Supplier Status",
        "db_func": "get_overdue_suppliers",
        "fmt": "html",
    },
    {
        "filename": "auto_price_comparison.html",
        "source_type": "html",
        "label": "Auto: Price Discrepancies Across Channels",
        "db_func": "get_price_contradictions",
        "fmt": "html",
    },
    {
        "filename": "auto_ghost_stock.csv",
        "source_type": "csv",
        "label": "Auto: Ghost Stock Candidates",
        "db_func": "get_ghost_stock_candidates",
        "fmt": "csv",
    },
]


def generate_db_sources(count: int, session_id: str) -> list[dict]:
    """
    When the user uploads fewer than 5 sources, auto-generate the remainder
    from the mock database so the pipeline always has enough context.

    Priority (index 0 = highest priority):
      0. Current inventory anomalies (CSV)
      1. Recent complaint / price contradiction summary (JSON)
      2. Overdue supplier report (HTML table)
      3. Cross-channel price discrepancies (HTML table)
      4. Ghost stock candidates (CSV)
    """
    import database.queries as q

    generated = []
    specs = AUTO_FILL_SPECS[:count]

    for spec in specs:
        fn = getattr(q, spec["db_func"])
        try:
            data = fn()
        except Exception:
            data = []

        # Render to an appropriate text format
        fmt = spec["fmt"]
        if fmt == "csv":
            content = _build_csv_text(data if isinstance(data, list) else [])
        elif fmt == "html":
            content = _build_html_table(
                data if isinstance(data, list) else [], title=spec["label"]
            )
        else:  # json
            content = json.dumps(data, default=str)

        temp_path = f"/tmp/{session_id}_{spec['filename']}"
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(content)

        generated.append({
            "filename":       spec["filename"],
            "source_type":    spec["source_type"],
            "auto_generated": True,
            "label":          spec["label"],
            "temp_path":      temp_path,
            "word_count":     len(content.split()),
            "detected_category": "pending_classification",
        })

    return generated


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_sources(files: List[UploadFile] = File(...)):
    """
    Accept 1–5 files. Each file is one data source.
    Supported formats: .pdf  .csv  .json  .html  .txt

    Returns: session_ready_payload with session_id and source summaries.
    Client should:
      1. Open WebSocket  ws://<host>/ws/{session_id}
      2. POST /api/agent/run-upload  {"session_id": "..."}
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    if len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 files per upload. Please reduce your selection."
        )

    session_id = str(uuid.uuid4())
    source_summaries: list[dict] = []

    # ── Parse each uploaded file ──────────────────────────────────────
    for file in files:
        filename = file.filename or "unknown"
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

        temp_path = f"/tmp/{session_id}_{filename}"
        content_bytes = await file.read()

        with open(temp_path, "wb") as fh:
            fh.write(content_bytes)

        try:
            result = await _parse_file(ext, temp_path)
        except Exception as e:
            result = {
                "raw_text": f"Parse error for {filename}: {e}",
                "credibility_score": 0.5,
                "freshness": "stale",
                "word_count": 0,
            }

        source_summaries.append({
            "filename":           filename,
            "source_type":        ext,
            "auto_generated":     False,
            "label":              f"Uploaded: {filename}",
            "temp_path":          temp_path,
            "word_count":         result.get("word_count", len(result.get("raw_text", "").split())),
            "credibility_score":  result.get("credibility_score", 0.70),
            "detected_category":  "pending_classification",
        })

    # ── Auto-fill from DB up to 5 total sources ───────────────────────
    db_sources_needed = max(0, 5 - len(source_summaries))
    auto_sources: list[dict] = []

    if db_sources_needed > 0:
        auto_sources = generate_db_sources(db_sources_needed, session_id)
        source_summaries.extend(auto_sources)

    # ── Store session state ───────────────────────────────────────────
    upload_sessions[session_id] = {
        "source_summaries": source_summaries,
        "auto_filled":      len(auto_sources),
        "status":           "ready",
    }

    filled_msg = (
        f" Auto-filled {len(auto_sources)} source(s) from store database."
        if auto_sources else ""
    )

    return {
        "session_id":          session_id,
        "sources_uploaded":    len(files),
        "sources_auto_filled": len(auto_sources),
        "total_sources":       len(source_summaries),
        "ready_to_run":        True,
        "source_summaries":    [
            {k: v for k, v in s.items() if k != "temp_path"}
            for s in source_summaries
        ],
        "message": (
            f"Uploaded {len(files)} source(s).{filled_msg} "
            f"Connect WebSocket then POST /api/agent/run-upload."
        ),
    }


@router.get("/session/{session_id}")
async def get_upload_session(session_id: str):
    """Return stored upload session metadata."""
    if session_id not in upload_sessions:
        raise HTTPException(
            status_code=404,
            detail=f"Upload session {session_id} not found."
        )
    return upload_sessions[session_id]


@router.delete("/session/{session_id}")
async def delete_upload_session(session_id: str):
    """Clean up temp files and remove session from memory."""
    if session_id not in upload_sessions:
        raise HTTPException(
            status_code=404,
            detail=f"Upload session {session_id} not found."
        )
    session = upload_sessions.pop(session_id)
    cleaned = 0
    for src in session.get("source_summaries", []):
        tp = src.get("temp_path")
        if tp and os.path.exists(tp):
            os.remove(tp)
            cleaned += 1
    return {
        "status":        "deleted",
        "session_id":    session_id,
        "files_removed": cleaned,
    }
