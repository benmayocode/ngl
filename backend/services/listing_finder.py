from langchain.chat_models import ChatOpenAI
from langchain_core.messages import HumanMessage
import requests

def find_listings_page(url: str, model: str = "gpt-4") -> dict:
    try:
        response = requests.get(url, timeout=10)
        html = response.text
    except Exception as e:
        return {
            "type": "text",
            "value": f"Failed to fetch {url}: {str(e)}",
            "metadata": {"url": url}
        }

    prompt = (
        f"You are analyzing the homepage HTML of an estate agent.\n"
        f"Your task is to identify the most likely URL path to their listings page.\n"
        f"Look for links containing words like 'property', 'for sale', 'listings', etc.\n"
        f"Return the **full URL** of the listings page if found, or say 'Not found'.\n\n"
        f"URL: {url}\n\n"
        f"HTML:\n{html[:5000]}"  # limit to avoid token overload
    )

    llm = ChatOpenAI(model=model, temperature=0)
    result = llm.invoke([HumanMessage(content=prompt)])

    return {
        "type": "text",
        "value": result.content.strip(),
        "metadata": {
            "source": url,
            "model": model
        }
    }
