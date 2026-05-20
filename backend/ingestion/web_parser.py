"""
ingestion/web_parser.py
-----------------------
Parser for web pages using httpx and BeautifulSoup to extract articles,
calculating word count, extracting publication date, and computing decaying credibility.
"""

import re
from datetime import datetime
import httpx
from bs4 import BeautifulSoup

def parse_iso_date(val: str) -> datetime | None:
    """Parse dates from ISO-like or standard formats found in HTML tags."""
    val = val.strip()
    # Try YYYY-MM-DD format (or prefix of ISO 8601 timestamp)
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", val)
    if match:
        try:
            return datetime.strptime(match.group(0), "%Y-%m-%d")
        except ValueError:
            pass
            
    # Try DD/MM/YYYY format
    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})", val)
    if match:
        try:
            return datetime.strptime(match.group(0), "%d/%m/%Y")
        except ValueError:
            pass
            
    # General regex search for standard text date formats
    # Formats: Month DD, YYYY or Month YYYY
    date_pattern = r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b"
    match = re.search(date_pattern, val, re.IGNORECASE)
    if match:
        try:
            cleaned = f"{match.group(1).capitalize()} {match.group(2)} {match.group(3)}"
            return datetime.strptime(cleaned, "%B %d %Y")
        except ValueError:
            pass
            
    return None

def extract_web_date(soup: BeautifulSoup) -> datetime | None:
    """Extract publication date from common meta tags or <time> tag."""
    # 1. Search meta tags (og:published_time, article:published_time, publishdate)
    for meta in soup.find_all("meta"):
        prop = meta.get("property", "").lower()
        name = meta.get("name", "").lower()
        if prop in ["article:published_time", "og:published_time"] or name in ["pubdate", "publishdate", "published_time"]:
            content = meta.get("content")
            if content:
                dt = parse_iso_date(content)
                if dt:
                    return dt
                    
    # 2. Search for <time> tag
    time_tag = soup.find("time")
    if time_tag:
        dt_attr = time_tag.get("datetime")
        if dt_attr:
            dt = parse_iso_date(dt_attr)
            if dt:
                return dt
        # Fallback to <time> tag text content
        dt = parse_iso_date(time_tag.get_text())
        if dt:
            return dt
            
    return None

async def parse_web(url: str) -> dict:
    """
    Asynchronously fetches a URL and extracts title, cleaned text content,
    publication date, word count, and decaying credibility score.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            # Handle non-2xx status codes
            response.raise_for_status()
            html = response.text
    except httpx.TimeoutException:
        return {"error": f"Request to {url} timed out after 15 seconds."}
    except httpx.HTTPStatusError as e:
        return {"error": f"HTTP error {e.response.status_code} occurred while requesting {url}."}
    except Exception as e:
        return {"error": f"Network or connection error requesting {url}: {str(e)}"}
        
    try:
        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        # Get title
        title = soup.title.string.strip() if soup.title else "Untitled Page"
        
        # Extract main text by joining paragraph contents
        paragraphs = [p.get_text().strip() for p in soup.find_all("p")]
        # Filter out empty paragraphs
        paragraphs = [p for p in paragraphs if p]
        main_text = "\n".join(paragraphs)
        
        # If no paragraph text is found, fallback to body text
        if not main_text and soup.body:
            main_text = soup.body.get_text(separator="\n").strip()
            
        word_count = len(main_text.split())
        
        # Date & Credibility calculation
        detected_dt = extract_web_date(soup)
        detected_date_str = None
        credibility_score = 0.75
        
        if detected_dt:
            detected_date_str = detected_dt.strftime("%Y-%m-%d")
            today = datetime.now().date()
            days_diff = (today - detected_dt.date()).days
            if days_diff > 0:
                # Decay score by 0.05 per day since publication, floor at 0.10
                credibility_score = max(0.10, 0.75 - (0.05 * days_diff))
                
        return {
            "raw_text": main_text,
            "title": title,
            "url": url,
            "published_date": detected_date_str,
            "word_count": word_count,
            "credibility_score": credibility_score
        }
    except Exception as e:
        return {"error": f"HTML parsing error: {str(e)}"}
