# services/nodes/web_search_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext
from services.web_search import run_web_search

@register_node("web_search")
def build(ctx: NodeContext):
    data = ctx.node.get("data", {})
    node_id = ctx.node["id"]
    query = data.get("query", "")
    max_results = data.get("maxResults", 5)

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            results = run_web_search(query, max_results)
            ctx.intermediate_outputs[node_id] = results
            await ctx.send_status(node_id, "complete", {"output": results})
            return {node_id: results}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise

    return RunnableLambda(fn)
