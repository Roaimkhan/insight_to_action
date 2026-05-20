"""
ingestion/csv_parser.py
-----------------------
Parser for CSV and JSON files using pandas to extract tabular details,
summary statistics, sample rows, and format a readable raw_text field.
"""

import asyncio
import os
import pandas as pd

def _sync_parse_csv(path: str) -> dict:
    """Synchronous pandas logic run inside a separate thread."""
    try:
        # Detect extension
        _, ext = os.path.splitext(path)
        ext = ext.lower()
        
        if ext == ".json":
            df = pd.read_json(path)
        else:
            df = pd.read_csv(path)
            
        columns = list(df.columns)
        row_count = len(df)
        
        # Extract numeric columns and construct summaries (min, max, mean)
        numeric_cols = df.select_dtypes(include=["number"])
        summaries = {}
        for col in numeric_cols.columns:
            col_min = numeric_cols[col].min()
            col_max = numeric_cols[col].max()
            col_mean = numeric_cols[col].mean()
            
            summaries[col] = {
                "min": float(col_min) if not pd.isna(col_min) else None,
                "max": float(col_max) if not pd.isna(col_max) else None,
                "mean": float(col_mean) if not pd.isna(col_mean) else None
            }
            
        # Get first 5 rows as a list of dictionaries, cleaning up NaNs to None
        sample_rows = df.head(5).to_dict(orient="records")
        cleaned_samples = []
        for r in sample_rows:
            cleaned_row = {}
            for k, v in r.items():
                if pd.isna(v):
                    cleaned_row[k] = None
                elif isinstance(v, (int, float)):
                    cleaned_row[k] = v
                else:
                    cleaned_row[k] = str(v)
            cleaned_samples.append(cleaned_row)
            
        # Build raw text summary description for the LLM
        summary_lines = [
            f"Source File: {os.path.basename(path)}",
            f"Data Format: {'JSON' if ext == '.json' else 'CSV'}",
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
            "credibility_score": 0.85
        }
    except FileNotFoundError:
        return {"error": f"File not found: {path}"}
    except Exception as e:
        return {"error": f"Parsing tabular file {path} failed: {str(e)}"}

async def parse_csv(path: str) -> dict:
    """Asynchronously parses CSV or JSON files."""
    return await asyncio.to_thread(_sync_parse_csv, path)
