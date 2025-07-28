import os
import requests

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

def run_web_search(query: str, max_results: int = 5) -> dict:
    if not SERPER_API_KEY:
        raise ValueError("Missing SERPER_API_KEY environment variable")

    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "q": query,
        "num": max_results,
        "gl": "uk",
        "hl": "en"
    }

    response = requests.post("https://google.serper.dev/search", headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()

    links = []
    for item in data.get("organic", [])[:max_results]:
        link = item.get("link")
        if link:
            links.append({"type": "text", "value": link})

    result = {
        "type": "list",
        "items": links,
        "metadata": {
            "query": query,
            "source": "serper.dev"
        }
    }

    print(f"Web search results for '{query}': {links}")
    return result
