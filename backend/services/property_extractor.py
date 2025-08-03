import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract_property_urls(listing_url: str, max_results=20) -> dict:
    try:
        res = requests.get(listing_url, timeout=10)
        res.raise_for_status()
    except Exception as e:
        return {
            "type": "error",
            "value": f"Failed to fetch {listing_url}: {str(e)}"
        }

    soup = BeautifulSoup(res.text, "html.parser")
    links = soup.find_all("a", href=True)

    # Filter links that look like property listings
    candidates = []
    for link in links:
        href = link["href"]
        if any(kw in href.lower() for kw in ["property", "for-sale", "details", "listing"]):
            full_url = urljoin(listing_url, href)
            candidates.append(full_url)

    # Deduplicate & trim
    unique_links = sorted(set(candidates))[:max_results]

    return {
        "type": "list",
        "items": [{"type": "text", "value": url} for url in unique_links],
        "metadata": {
            "source": listing_url,
            "total_found": len(unique_links)
        }
    }
