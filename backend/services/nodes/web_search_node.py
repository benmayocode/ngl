# services/nodes/web_search_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext
from services.web_search import run_web_search

def _extract_raw_items(results):
    if isinstance(results, dict) and results.get("type") == "list":
        return results.get("items", []) or []
    return results or []

@register_node("web_search")
def build(ctx: NodeContext):
    data = ctx.node.get("data", {})
    node_id = ctx.node["id"]

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            input_env = next((state[pid] for pid in ctx.parent_ids if pid in state), None)

            def _clean(s): return (s or "").strip()

            # 1) gather candidates
            if isinstance(input_env, dict) and input_env.get("type") == "text":
                upstream_q = _clean(input_env.get("value"))
            elif isinstance(input_env, str):
                upstream_q = _clean(input_env)
            else:
                upstream_q = ""

            node_q = _clean(data.get("query"))
            ctx_q  = _clean(getattr(ctx, "user_input", None))

            # 2) choose the first non-empty
            query = next((q for q in (upstream_q, node_q, ctx_q) if q), "")
            max_results = int(data.get("maxResults", 5))
            print(f"[web_search] chosen query: {query!r}", flush=True)

            # 3) early complete if still empty
            if not query:
                out = {"type": "list", "item": {"type": "link"}, "items": [],
                       "meta": {"query": query, "source": "serper.dev"}}
                ctx.intermediate_outputs[node_id] = out
                await ctx.send_status(node_id, "complete", {"output": out})
                return {node_id: out}

            # 4) DO NOT overwrite `query` here again
            results = run_web_search(query, max_results)

            # 5) normalize to list<link>
            items = []
            for r in _extract_raw_items(results):
                if isinstance(r, dict) and r.get("type") == "link" and r.get("url"):
                    items.append(r)
                elif isinstance(r, dict) and r.get("url"):
                    items.append({"type": "link", "url": r["url"], "title": r.get("title")})
                elif isinstance(r, dict) and r.get("type") == "text" and isinstance(r.get("value"), str):
                    items.append({"type": "link", "url": r["value"]})
                elif isinstance(r, str):
                    items.append({"type": "link", "url": r})

            out = {
                "type": "list",
                "item": {"type": "link"},
                "items": items,
                "meta": {"query": query, "source": "serper.dev"},
            }

            ctx.intermediate_outputs[node_id] = out
            await ctx.send_status(node_id, "complete", {"output": out})
            return {node_id: out}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise

    return RunnableLambda(fn)
