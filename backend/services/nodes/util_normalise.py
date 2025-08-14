# services/nodes/util_normalise.py
def ensure_list_of_links(env):
    if isinstance(env, dict) and env.get("type") == "list":
        out_items = []
        for it in env.get("items", []):
            if isinstance(it, dict) and it.get("type") == "link":
                out_items.append(it)
            elif isinstance(it, dict) and it.get("type") == "text":
                out_items.append({"type": "link", "url": it["value"]})
        return {"type": "list", "item": {"type": "link"}, "items": out_items, "meta": env.get("meta", {})}
    raise ValueError("Expected list envelope")
