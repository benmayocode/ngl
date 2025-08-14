# services/nodes/extract_from_pages_node.py
from typing import Any, Dict, List
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from langchain_core.runnables import RunnableLambda

from .base import register_node, NodeContext
from services.prompt import run_prompt  # you already use this


@register_node("extract_from_pages")
def build(ctx: NodeContext):
    node_id = ctx.node["id"]
    data = ctx.node.get("data", {})

    instruction = (data.get("instruction") or "").strip()
    mode = (data.get("mode") or "links").strip()   # 'links' | 'text' | 'json'
    model_id = data.get("model", "gpt-4o-mini")

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            inp = next((state[pid] for pid in ctx.parent_ids if pid in state), None)
            if not (isinstance(inp, dict) and inp.get("type") == "list"):
                raise ValueError("extract_from_pages expects list<page> envelope")

            pages: List[Dict[str, Any]] = [
                it for it in inp.get("items", [])
                if isinstance(it, dict) and it.get("type") == "page"
            ]

            if mode == "links":
                links: List[Dict[str, Any]] = []
                for p in pages:
                    base = p.get("url") or ""
                    html = p.get("html") or ""
                    try:
                        soup = BeautifulSoup(html, "html.parser")
                        for a in soup.find_all("a", href=True):
                            u = urljoin(base, a["href"])
                            title = a.get_text(strip=True) or None
                            links.append({"type": "link", "url": u, "title": title})
                    except Exception:
                        pass

                out = {"type": "list", "item": {"type": "link"}, "items": links, "meta": {"mode": "links"}}
                ctx.intermediate_outputs[node_id] = out
                await ctx.send_status(node_id, "complete", {"output": out})
                return {node_id: out}

            # Bundle page texts for LLM modes
            bundle = "\n\n---\n\n".join(
                f"URL: {p.get('url')}\nTITLE: {p.get('title')}\nCONTENT:\n{(p.get('text') or '')[:8000]}"
                for p in pages
            )

            if mode == "text":
                prompt = instruction or "Summarize the key information in a concise way."
                result = run_prompt(prompt, {"type": "text", "value": bundle}, model_id)
                out = {"type": "text", "value": result if isinstance(result, str) else str(result),
                       "meta": {"mode": "text", "model": model_id}}
                ctx.intermediate_outputs[node_id] = out
                await ctx.send_status(node_id, "complete", {"output": out})
                return {node_id: out}

            if mode == "json":
                prompt = instruction or "Extract a structured JSON list of key facts."
                result = run_prompt(prompt, {"type": "text", "value": bundle}, model_id)
                out = {"type": "json", "value": result, "meta": {"mode": "json", "model": model_id}}
                ctx.intermediate_outputs[node_id] = out
                await ctx.send_status(node_id, "complete", {"output": out})
                return {node_id: out}

            raise ValueError(f"Unknown mode: {mode}")

        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise

    return RunnableLambda(fn)
