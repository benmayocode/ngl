# backend/services/testing/test_listing_finder.py

from services.listing_finder import find_listings_page

test_urls = [
    "https://www.boardwalkpropertyco.com/",
    "https://www.oceanhome.co.uk/",
    "https://www.cjhole.co.uk/",
    "https://www.richardharding.co.uk/",
    "https://www.bristolpropertycentre.co.uk/",
    "https://www.allenandharris.co.uk/estate-agents/clifton-bristol",
]

def run_tests():
    print("🔍 Testing find_listings_page for known estate agent homepages\n")
    for url in test_urls:
        print(f"🧪 Base URL: {url}")
        result = find_listings_page(url)
        if isinstance(result, dict):
            value = result.get("value")
        else:
            value = result
        print(f"➡️  Result: {value}\n")

if __name__ == "__main__":
    run_tests()
