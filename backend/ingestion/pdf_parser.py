"""
ingestion/pdf_parser.py
-----------------------
Parser for PDF reports using pdfplumber to extract text page-by-page,
calculating word count, extracting publication date, and computing credibility.
"""

import asyncio
import re
from datetime import datetime
import pdfplumber

# Regex patterns for detected dates
# Formats supported: YYYY-MM-DD, DD/MM/YYYY, Month YYYY (e.g. "January 2026")
DATE_PATTERNS = [
    (r"\b(\d{4})-(\d{2})-(\d{2})\b", "%Y-%m-%d"),
    (r"\b(\d{2})/(\d{2})/(\d{4})\b", "%d/%m/%Y"),
    (r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b", "%B %Y")
]

def extract_date_from_text(text: str) -> datetime | None:
    """Scan text for date patterns and return parsed datetime if valid."""
    for pattern, date_format in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(0)
            try:
                # Normalize spaces (e.g., in "May  2026")
                cleaned_date_str = re.sub(r'\s+', ' ', date_str).strip()
                # Title-case for Month name parsing compatibility
                if " " in cleaned_date_str:
                    parts = cleaned_date_str.split(" ")
                    cleaned_date_str = f"{parts[0].capitalize()} {parts[1]}"
                return datetime.strptime(cleaned_date_str, date_format)
            except ValueError:
                continue
    return None

def _sync_parse_pdf(path: str) -> dict:
    """Synchronous core extraction to be executed in a separate thread."""
    try:
        with pdfplumber.open(path) as pdf:
            raw_text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    raw_text += page_text + "\n"
            return {
                "raw_text": raw_text,
                "page_count": len(pdf.pages)
            }
    except FileNotFoundError:
        return {"error": f"File not found: {path}"}
    except Exception as e:
        return {"error": f"PDF parsing failed or file corrupted: {str(e)}"}

async def parse_pdf(path: str) -> dict:
    """
    Asynchronously parses a PDF document.
    Extracts text page by page, calculates stats, identifies publication date,
    and returns parsed details with credibility score.
    """
    res = await asyncio.to_thread(_sync_parse_pdf, path)
    if "error" in res:
        return res
    
    raw_text = res["raw_text"]
    page_count = res["page_count"]
    word_count = len(raw_text.split())
    
    # Date extraction & credibility evaluation
    detected_dt = extract_date_from_text(raw_text)
    detected_date_str = None
    credibility_score = 0.70
    
    if detected_dt:
        detected_date_str = detected_dt.strftime("%Y-%m-%d")
        # Check if detected date is within 30 days of today
        today = datetime.now()
        days_diff = abs((today - detected_dt).days)
        if days_diff <= 30:
            credibility_score = 0.80
            
    return {
        "raw_text": raw_text,
        "page_count": page_count,
        "detected_date": detected_date_str,
        "word_count": word_count,
        "credibility_score": credibility_score
    }
