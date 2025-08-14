# services/web_search.py
import os, logging, requests
from typing import List, Dict, Any

SERPER_URL = os.getenv("SERPER_URL", "https://google.serper.dev/search")
SERPER_KEY = os.getenv("SERPER_API_KEY")  # set this in your env

def run_web_search(query: str, max_results: int = 5, gl: str = "gb", hl: str = "en") -> List[Dict[str, Any]]:
    """
    Returns a list of {url, title?} dicts (simple, backend-normalizable).
    """
    q = (query or "").strip()
    if not q:
        print("Web search called with empty query")
        return []

    print(f"Web search: {q} (max={max_results})")

    if not SERPER_KEY:
        raise RuntimeError("SERPER_API_KEY not set")

    headers = {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json",
    }
    body = {"q": q, "gl": gl, "hl": hl}  # keep to Serper's expected fields

    try:
        resp = requests.post(SERPER_URL, headers=headers, json=body, timeout=20)
        # If invalid JSON or wrong body, Serper returns 400 here
        resp.raise_for_status()
    except requests.HTTPError as e:
        # Surface the response text so it shows up in your websocket status
        msg = f"Serper {resp.status_code}: {resp.text[:500]}"
        logging.error("Serper request failed: %s", msg)
        raise RuntimeError(msg) from e

    data = resp.json()

    # Extract links from common sections; prefer 'organic'
    items: List[Dict[str, Any]] = []
    for r in data.get("organic", []):
        url = r.get("link") or r.get("url")
        if url:
            items.append({"url": url, "title": r.get("title")})

    # fallback buckets (optional)
    if not items:
        for r in data.get("topStories", []):
            url = r.get("link") or r.get("url")
            if url:
                items.append({"url": url, "title": r.get("title")})

    # Trim locally; Serper doesn't use your max_results param
    if max_results and max_results > 0:
        items = items[:max_results]
    return items
