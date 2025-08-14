# services/nodes/text_urls_to_links_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext

@register_node("text_urls_to_links")
def build(ctx: NodeContext):
    node_id = ctx.node["id"]

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            inp = next((state[pid] for pid in ctx.parent_ids if pid in state), None)
            if not (isinstance(inp, dict) and inp.get("type") == "list"):
                raise ValueError("Expected list envelope")

            items = []
            for it in inp.get("items", []):
                if isinstance(it, dict) and it.get("type") == "link":
                    items.append(it)
                elif isinstance(it, dict) and it.get("type") == "text":
                    items.append({"type": "link", "url": it["value"]})
            out = {"type": "list", "item": {"type": "link"}, "items": items, "meta": {"adapter": "text→link"}}

            ctx.intermediate_outputs[node_id] = out
            await ctx.send_status(node_id, "complete", {"output": out})
            return {node_id: out}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise
    return RunnableLambda(fn)
