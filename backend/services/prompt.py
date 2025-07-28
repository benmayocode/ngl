from langchain.chat_models import ChatOpenAI
from langchain_core.messages import HumanMessage


def run_prompt(
    instruction: str,
    input_val,
    model_id: str = "gpt-4"
) -> dict:
    llm = ChatOpenAI(model=model_id, temperature=0)
    instruction = instruction.strip()

    def invoke_llm(text: str) -> dict:
        prompt = f"{instruction} {text.strip()}"
        response = llm.invoke([HumanMessage(content=prompt)])
        return {
            "type": "text",
            "value": response.content,
            "metadata": {
                "model": model_id,
                "prompt": instruction,
                "input": text
            }
        }

    # Case 1: plain string
    if isinstance(input_val, str):
        return invoke_llm(input_val)

    # Case 2: single text block
    if isinstance(input_val, dict) and input_val.get("type") == "text":
        return invoke_llm(input_val.get("value", ""))

    # Case 3: list of items
    if isinstance(input_val, dict) and input_val.get("type") == "list":
        results = []
        for item in input_val.get("items", []):
            if item.get("type") == "text":
                results.append(invoke_llm(item["value"]))
            else:
                # You could skip or add a fallback here
                results.append({
                    "type": "text",
                    "value": f"Unsupported input type: {item.get('type')}",
                    "metadata": {"error": True}
                })

        return {
            "type": "list",
            "items": results,
            "metadata": {
                "model": model_id,
                "prompt": instruction,
                "input_count": len(results)
            }
        }

    # Fallback
    return {
        "type": "text",
        "value": "Unsupported input format for prompt node.",
        "metadata": {"error": True}
    }
