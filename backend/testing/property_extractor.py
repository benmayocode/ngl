from services.property_extractor import extract_property_urls

test_urls = [
    "https://www.richardharding.co.uk/property-for-sale/",
    "https://www.boardwalkpropertyco.com/buy",
    # add more from your listing finder output
]

def run_tests():
    print("🏠 Testing property listing extraction\n")
    for url in test_urls:
        print(f"🔍 From listings page: {url}")
        result = extract_property_urls(url)
        for item in result.get("items", []):
            print(f" - {item['value']}")
        print()

if __name__ == "__main__":
    run_tests()
