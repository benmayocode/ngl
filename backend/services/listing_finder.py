from langchain.chat_models import ChatOpenAI
from langchain_core.messages import HumanMessage
import requests
from bs4 import BeautifulSoup
import re

def validate_listing_page(url: str) -> bool:
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
    except Exception as e:
        print(f"⚠️  Failed to fetch for validation: {e}")
        return False

    text = soup.get_text().lower()
    has_prices = len(re.findall(r"£\d{2,}", text)) >= 3

    # Count repeating blocks with images and price text
    listing_blocks = soup.find_all(lambda tag:
        tag.name == "div" and "£" in tag.get_text() and tag.find("img")
    )
    return has_prices and len(listing_blocks) >= 2

def extract_first_url(text: str) -> str | None:
    matches = re.findall(r"https?://[^\s\"'>]+", text)
    return matches[0] if matches else None

def find_listings_page(url: str, model: str = "gpt-3.5-turbo") -> dict:
    try:
        response = requests.get(url, timeout=10)
        html = response.text
    except Exception as e:
        return {
            "type": "text",
            "value": f"Failed to fetch {url}: {str(e)}",
            "metadata": {"url": url}
        }

    # Extract <a> tags
    soup = BeautifulSoup(html, "html.parser")
    anchors = soup.find_all("a", href=True)

    links = []
    for a in anchors:
        text = a.get_text(strip=True)
        href = a["href"]
        if href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        full_link = requests.compat.urljoin(url, href)
        links.append(f"{text} -> {full_link}")

    # Limit to first 30 links
    links_sample = links[:30]

    prompt = (
        f"You are given a list of links from an estate agent's homepage. "
        f"Your job is to pick the most likely **listings page**, where properties for sale or rent are shown.\n"
        f"Examples of good links contain words like 'for sale', 'properties', 'listings', 'our homes', 'buy', etc.\n"
        f"Return ONLY the full URL of the best match, or say 'Not found' if there are no relevant links.\n\n"
        f"Links:\n" +
        "\n".join(links_sample)
    )

    llm = ChatOpenAI(model=model, temperature=0)
    result = llm.invoke([HumanMessage(content=prompt)])
    clean_result = result.content.strip()
    listing_url = extract_first_url(clean_result)

    return {
        "type": "text",
        "value": listing_url,
        "metadata": {
            "source": url,
            "model": model,
            "links_checked": len(links_sample)
        }
    }
