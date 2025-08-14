# services/nodes/fetch_pages_node.py
import asyncio, time
from typing import Any, Dict, List
from urllib.parse import urlsplit, urlunsplit

import httpx
from bs4 import BeautifulSoup
from langchain_core.runnables import RunnableLambda

from .base import register_node, NodeContext


def _canon_url(u: str) -> str:
    try:
        p = urlsplit(u)
        return urlunsplit((p.scheme, p.netloc, p.path, p.query, ""))  # strip fragment
    except Exception:
        return u


async def _fetch_one(client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
    t0 = time.perf_counter()
    try:
        r = await client.get(
            url,
            timeout=20,
            follow_redirects=True,
            headers={"User-Agent": "FlowBot/0.1 (+https://example.com)"},
        )
        ct = r.headers.get("content-type", "")
        raw = r.content or b""
        MAX_BYTES = 1_500_000  # ~1.5MB cap
        body = raw[:MAX_BYTES]
        truncated = len(raw) > MAX_BYTES
        html = body.decode(r.encoding or "utf-8", errors="replace")

        # canonical link
        canonical_url = None
        try:
            soup = BeautifulSoup(html, "html.parser")
            link = soup.find("link", rel=lambda v: v and "canonical" in v)
            if link and link.get("href"):
                canonical_url = link["href"]
            title = soup.title.string.strip() if soup.title and soup.title.string else None
            text = soup.get_text(separator="\n", strip=True)
        except Exception:
            title, text = None, ""

        # js-heavy heuristic
        lower_html = html.lower()
        scripts = lower_html.count("<script")
        maybe_js_heavy = (
            (len(text) < 400) and
            (("__next" in lower_html) or ("__nuxt" in lower_html) or ("data-reactroot" in lower_html) or (scripts > 20))
        )

        ok = (200 <= r.status_code < 300) and ("text/html" in ct) and (len(text) >= 200)

        return {
            "type": "page",
            "url": str(r.url),
            "title": title,
            "html": html,
            "text": text,
            "meta": {
                "status": r.status_code,
                "elapsed_ms": int((time.perf_counter() - t0) * 1000),
                "content_type": ct,
                "bytes": len(body),
                "truncated": truncated,
                "canonical_url": canonical_url,
                "flags": (["maybe_js_heavy"] if maybe_js_heavy else []),
                "ok": ok,
                "source": "fetch_pages",
            },
        }

    except Exception as e:
        return {
            "type": "page",
            "url": url,
            "title": None,
            "html": "",
            "text": "",
            "meta": {
                "status": None,
                "error": str(e),
                "elapsed_ms": int((time.perf_counter() - t0) * 1000),
                "source": "fetch_pages",
            },
        }


@register_node("fetch_pages")
def build(ctx: NodeContext):
    node_id = ctx.node["id"]
    data = ctx.node.get("data", {})
    concurrency = int(data.get("concurrency", 6))

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            inp = next((state[pid] for pid in ctx.parent_ids if pid in state), None)
            if not (isinstance(inp, dict) and inp.get("type") == "list"):
                raise ValueError("fetch_pages expects list<link> envelope")

            urls: List[str] = []
            for it in inp.get("items", []):
                if isinstance(it, dict) and it.get("type") == "link" and it.get("url"):
                    urls.append(_canon_url(it["url"]))

            sem = asyncio.Semaphore(concurrency)

            async with httpx.AsyncClient() as client:
                async def bounded(u: str):
                    async with sem:
                        return await _fetch_one(client, u)

                pages = await asyncio.gather(*(bounded(u) for u in urls))

            out = {
                "type": "list",
                "item": {"type": "page"},
                "items": pages,
                "meta": {"count": len(pages)},
            }
            ctx.intermediate_outputs[node_id] = out
            await ctx.send_status(node_id, "complete", {"output": out})
            return {node_id: out}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise

    return RunnableLambda(fn)
