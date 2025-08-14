# services/nodes/to_list_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext

@register_node("to_list")
def build(ctx: NodeContext):
    node_id = ctx.node["id"]

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            inp = next((state[pid] for pid in ctx.parent_ids if pid in state), None)
            env = inp if isinstance(inp, dict) else {"type": "text", "value": str(inp)}
            out = {"type": "list", "items": [env], "meta": {"adapter": "wrap"}}
            ctx.intermediate_outputs[node_id] = out
            await ctx.send_status(node_id, "complete", {"output": out})
            return {node_id: out}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise
    return RunnableLambda(fn)
