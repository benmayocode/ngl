# services/langgraph_runner_streaming.py
from langgraph.graph import StateGraph, END
from collections import defaultdict
from typing import Dict, Any
from services.nodes import load_builtin_nodes
from services.nodes.base import NODE_REGISTRY, NodeContext

async def run_flow_with_updates(flow_data: dict, user_input: str, websocket) -> None:
    load_builtin_nodes()  # ensure all node modules register themselves

    nodes = flow_data["nodes"]
    edges = flow_data["edges"]

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
        builder.add_node(node_id, runnable)
    for edge in edges:
        builder.add_edge(edge["source"], edge["target"])

    entry = next((n["id"] for n in nodes if n["type"] == "input"), None)
    builder.set_entry_point(entry)

    all_sources = {e["source"] for e in edges}
    all_targets = {e["target"] for e in edges}
    for terminal_id in all_sources - all_targets:
        builder.add_edge(terminal_id, END)

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
