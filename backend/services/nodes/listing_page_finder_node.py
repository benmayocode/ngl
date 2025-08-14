# services/nodes/listing_page_finder_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext
from services.listing_finder import find_listings_page

@register_node("listing_page_finder")
def build(ctx: NodeContext):
    data = ctx.node.get("data", {})
    node_id = ctx.node["id"]
    model = data.get("model", "gpt-4")

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            input_val = next((state[pid] for pid in ctx.parent_ids if pid in state), None)
            if not input_val or input_val.get("type") != "list":
                raise ValueError("listing_page_finder node requires a list input")

            results = []
            for item in input_val["items"]:
                if item.get("type") == "text":
                    results.append(find_listings_page(item["value"], model=model))

            output = {"type": "list", "items": results,
                      "metadata": {"model": model, "operation": "find_listing_page"}}

            ctx.intermediate_outputs[node_id] = output
            await ctx.send_status(node_id, "complete", {"output": output})
            return {node_id: output}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise

    return RunnableLambda(fn)
