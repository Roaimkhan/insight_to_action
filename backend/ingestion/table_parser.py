"""
ingestion/table_parser.py
-------------------------
Parser for HTML tables using pandas.read_html() and BeautifulSoup/httpx,
extracting tabular data from web URLs or direct HTML snippets.
"""

import asyncio
import pandas as pd
import httpx

def _sync_parse_html(html_content: str) -> dict:
    """Synchronous core table extraction and summary logic inside thread pool."""
    try:
        tables = pd.read_html(html_content)
        if not tables:
            return {"error": "No tables could be extracted from HTML."}
            
        df = tables[0]
        # Standardize column headers as strings
        columns = [str(col) for col in df.columns]
        df.columns = columns
        
        row_count = len(df)
        
        # Identify numeric columns and compute summaries
        numeric_cols = df.select_dtypes(include=["number"])
        summaries = {}
        for col in numeric_cols.columns:
            col_min = numeric_cols[col].min()
            col_max = numeric_cols[col].max()
            col_mean = numeric_cols[col].mean()
            
            summaries[str(col)] = {
                "min": float(col_min) if not pd.isna(col_min) else None,
                "max": float(col_max) if not pd.isna(col_max) else None,
                "mean": float(col_mean) if not pd.isna(col_mean) else None
            }
            
        # Extract and clean first 5 sample rows
        sample_rows = df.head(5).to_dict(orient="records")
        cleaned_samples = []
        for r in sample_rows:
            cleaned_row = {}
            for k, v in r.items():
                k_str = str(k)
                if pd.isna(v):
                    cleaned_row[k_str] = None
                elif isinstance(v, (int, float)):
                    cleaned_row[k_str] = v
                else:
                    cleaned_row[k_str] = str(v)
            cleaned_samples.append(cleaned_row)
            
        # Build raw text flat summary description
        summary_lines = [
            "Source: Extracted HTML Table Document",
            f"Total Row Count: {row_count}",
            f"Columns: {', '.join(columns)}",
            "\nNumeric Statistics Summary:"
        ]
        
        for col, stats in summaries.items():
            mean_val = f"{stats['mean']:.4f}" if stats['mean'] is not None else "None"
            summary_lines.append(f"  - Column '{col}': Min={stats['min']}, Max={stats['max']}, Mean={mean_val}")
            
        summary_lines.append("\nSample Data (First 5 rows):")
        summary_lines.append(df.head(5).to_string(index=False))
        
        raw_text = "\n".join(summary_lines)
        
        return {
            "raw_text": raw_text,
            "structured_data": {
                "column_summaries": summaries,
                "sample_rows": cleaned_samples
            },
            "row_count": row_count,
            "columns": columns,
            "credibility_score": 0.80
        }
    except Exception as e:
        return {"error": f"Failed to extract or parse tabular HTML: {str(e)}"}

async def parse_table(url_or_html: str) -> dict:
    """
    Asynchronously parses HTML tables.
    If the parameter is a web URL, fetches it with httpx before parsing.
    Otherwise, parses the string parameter directly as raw HTML content.
    """
    cleaned_input = url_or_html.strip()
    if cleaned_input.lower().startswith("http"):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(cleaned_input)
                response.raise_for_status()
                html_content = response.text
        except httpx.TimeoutException:
            return {"error": f"HTML table fetch to {cleaned_input} timed out after 15 seconds."}
        except httpx.HTTPStatusError as e:
            return {"error": f"HTTP error {e.response.status_code} occurred fetching HTML table from {cleaned_input}."}
        except Exception as e:
            return {"error": f"Network error fetching HTML table from {cleaned_input}: {str(e)}"}
    else:
        html_content = cleaned_input
        
    return await asyncio.to_thread(_sync_parse_html, html_content)
