# services/langgraph_runner_streaming.py
from langgraph.graph import StateGraph, END
from collections import defaultdict
from typing import Dict, Any
from services.nodes import load_builtin_nodes
from services.nodes.base import NODE_REGISTRY, NodeContext
from langchain_core.runnables import Runnable, RunnableLambda

def with_logs(node_id: str, r: Runnable) -> Runnable:
    async def _fn(state):
        print(f"[runner] ▶ START {node_id}", flush=True)
        try:
            res = await r.ainvoke(state)   # call the underlying runnable
            print(f"[runner] ✔ DONE  {node_id}", flush=True)
            return res
        except Exception as e:
            print(f"[runner] ✖ ERROR {node_id}: {e}", flush=True)
            raise
    return RunnableLambda(_fn)

async def run_flow_with_updates(flow_data: dict, user_input: str, websocket) -> None:
    load_builtin_nodes()  # ensure all node modules register themselves
    print("[runner] nodes:", len(flow_data.get("nodes", [])),
          "edges:", len(flow_data.get("edges", [])), flush=True)
    print("[runner] registered node types:", sorted(NODE_REGISTRY.keys()), flush=True)

    nodes = flow_data["nodes"]
    edges = flow_data["edges"]
    print("[runner] node types:", [(n["id"], n.get("type")) for n in nodes], flush=True)

    print("[runner] edges:", edges, flush=True)

    # Build adjacency and reverse maps
    from collections import defaultdict, deque
    adj = defaultdict(list)
    rev = defaultdict(list)
    for e in edges:
        adj[e["source"]].append(e["target"])
        rev[e["target"]].append(e["source"])

    print("[runner] parents map:", {k: v for k, v in rev.items()}, flush=True)

    # Pick entry (fallback to a source-only node if no explicit 'input')
    entry = next((n["id"] for n in nodes if n["type"] == "input"), None)
    if entry is None:
        sources = {e["source"] for e in edges}
        targets = {e["target"] for e in edges}
        candidates = list(sources - targets)
        entry = candidates[0] if candidates else (nodes[0]["id"] if nodes else None)
    print("[runner] entry:", entry, flush=True)

    # Reachability from entry
    reachable = set()
    if entry:
        q = deque([entry])
        while q:
            u = q.popleft()
            if u in reachable: 
                continue
            reachable.add(u)
            for v in adj.get(u, []):
                if v not in reachable:
                    q.append(v)
    print("[runner] reachable from entry:", reachable, flush=True)

    input_sources = defaultdict(list)
    for edge in edges:
        input_sources[edge["target"]].append(edge["source"])

    intermediate_outputs: Dict[str, Any] = {}

    async def send_status(node_id: str, status: str, detail: Dict[str, Any] | None = None):
        await websocket.send_json({
            "type": "status",
            "nodeId": node_id,
            "status": status,
            "detail": detail or {}
        })

    # Build node map via registry
    node_map = {}
    for node in nodes:
        node_id = node["id"]
        node_type = node["type"]
        parent_ids = input_sources.get(node_id, [])
        builder = NODE_REGISTRY.get(node_type)
        if not builder:
            # fail fast or provide a no-op that reports error
            raise ValueError(f"No builder registered for node type '{node_type}'")

        ctx = NodeContext(
            node=node,
            parent_ids=parent_ids,
            send_status=send_status,
            user_input=user_input,
            intermediate_outputs=intermediate_outputs,
        )
        node_map[node_id] = builder(ctx)

    # Build & run graph
    builder = StateGraph(dict)
    for node_id, runnable in node_map.items():
        builder.add_node(node_id, with_logs(node_id, runnable))  # <— WRAPPED
    for edge in edges:
        builder.add_edge(edge["source"], edge["target"])

    entry = next((n["id"] for n in nodes if n["type"] == "input"), None)
    builder.set_entry_point(entry)

    all_sources = {e["source"] for e in edges}
    all_targets = {e["target"] for e in edges}

    terminal_ids = all_targets - all_sources   # nodes with no outgoing edges
    for tid in terminal_ids:
        builder.add_edge(tid, END)

    graph = builder.compile()
    await websocket.send_json({"type": "start"})
    _ = await graph.ainvoke({})

    # Attach outputs for UI
    updated_nodes = []
    for node in nodes:
        updated = node.copy()
        if node["id"] in intermediate_outputs:
            updated.setdefault("data", {})
            updated["data"]["output"] = intermediate_outputs[node["id"]]
        updated_nodes.append(updated)

    await websocket.send_json({
        "type": "complete",
        "result": {"nodes": updated_nodes, "edges": edges}
    })
