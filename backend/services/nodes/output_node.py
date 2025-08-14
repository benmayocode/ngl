# services/nodes/output_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext

@register_node("output")
def build(ctx: NodeContext):
    node_id = ctx.node["id"]

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            result = next((state[pid] for pid in ctx.parent_ids if pid in state), None)
            output_val = (
                result.get("value") if isinstance(result, dict) and result.get("type") == "text"
                else str(result)
            )
            ctx.intermediate_outputs[node_id] = output_val
            await ctx.send_status(node_id, "complete", {"output": output_val})
            return {node_id: result}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise

    return RunnableLambda(fn)
