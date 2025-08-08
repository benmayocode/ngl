# services/langgraph_runner_streaming.py
from langgraph.graph import StateGraph, END
from langchain_core.runnables import RunnableLambda
from collections import defaultdict
from services.prompt import run_prompt
from typing import Dict, Any


async def run_flow_with_updates(flow_data: dict, user_input: str, websocket) -> None:
    nodes = flow_data["nodes"]
    edges = flow_data["edges"]

    input_sources = defaultdict(list)
    for edge in edges:
        input_sources[edge["target"]].append(edge["source"])

    intermediate_outputs = {}
    node_map = {}

    async def send_status(node_id: str, status: str, detail: Dict[str, Any] = None):
        await websocket.send_json({
            "type": "status",
            "nodeId": node_id,
            "status": status,  # "running", "complete", "error"
            "detail": detail or {}
        })

    for node in nodes:
        node_id = node["id"]
        node_type = node["type"]
        data = node.get("data", {})
        parent_ids = input_sources.get(node_id, [])

        if node_type == "input":
            node_map[node_id] = RunnableLambda(lambda state: {node_id: user_input})

        elif node_type == "prompt":
            instruction = data.get("template", "")
            fallback_input = data.get("testInput", "")
            model_id = data.get("model", "gpt-4")

            def make_fn():
                async def fn(state):
                    await send_status(node_id, "running")
                    try:
                        input_val = next((state[pid] for pid in parent_ids if pid in state), None)
                        if not input_val:
                            input_val = {"type": "text", "value": fallback_input}
                        if isinstance(input_val, str):
                            input_val = {"type": "text", "value": input_val}

                        if input_val.get("type") == "list":
                            outputs = [run_prompt(instruction, item, model_id) for item in input_val["items"]]
                            result = {
                                "type": "list",
                                "items": outputs,
                                "metadata": {"applied_prompt": instruction, "model": model_id}
                            }
                        else:
                            result = run_prompt(instruction, input_val, model_id)

                        intermediate_outputs[node_id] = result
                        await send_status(node_id, "complete", {"output": result})
                        return {node_id: result}
                    except Exception as e:
                        await send_status(node_id, "error", {"message": str(e)})
                        raise e
                return fn

            node_map[node_id] = RunnableLambda(make_fn())

        elif node_type == "listing_page_finder":
            from services.listing_finder import find_listings_page

            def make_fn():
                async def fn(state):
                    await send_status(node_id, "running")
                    try:
                        input_val = next((state[pid] for pid in parent_ids if pid in state), None)
                        if not input_val or input_val.get("type") != "list":
                            raise ValueError("listing_page_finder node requires a list input")

                        results = []
                        for item in input_val["items"]:
                            if item.get("type") == "text":
                                results.append(find_listings_page(item["value"], model=data.get("model", "gpt-4")))

                        output = {
                            "type": "list",
                            "items": results,
                            "metadata": {"model": data.get("model", "gpt-4"), "operation": "find_listing_page"}
                        }

                        intermediate_outputs[node_id] = output
                        await send_status(node_id, "complete", {"output": output})
                        return {node_id: output}
                    except Exception as e:
                        await send_status(node_id, "error", {"message": str(e)})
                        raise e
                return fn

            node_map[node_id] = RunnableLambda(make_fn())

        elif node_type == "web_search":
            query = data.get("query", "")
            max_results = data.get("maxResults", 5)

            def make_fn():
                async def fn(state):
                    await send_status(node_id, "running")
                    try:
                        from services.web_search import run_web_search
                        results = run_web_search(query, max_results)
                        intermediate_outputs[node_id] = results
                        await send_status(node_id, "complete", {"output": results})
                        return {node_id: results}
                    except Exception as e:
                        await send_status(node_id, "error", {"message": str(e)})
                        raise e
                return fn

            node_map[node_id] = RunnableLambda(make_fn())

        elif node_type == "output":
            def make_fn():
                async def fn(state):
                    await send_status(node_id, "running")
                    try:
                        result = next((state[pid] for pid in parent_ids if pid in state), None)
                        output_val = (
                            result.get("value") if isinstance(result, dict) and result.get("type") == "text"
                            else str(result)
                        )
                        intermediate_outputs[node_id] = output_val
                        await send_status(node_id, "complete", {"output": output_val})
                        return {node_id: result}
                    except Exception as e:
                        await send_status(node_id, "error", {"message": str(e)})
                        raise e
                return fn

            node_map[node_id] = RunnableLambda(make_fn())

    # Build and run graph
    builder = StateGraph(dict)
    for node_id, fn in node_map.items():
        builder.add_node(node_id, fn)
    for edge in edges:
        builder.add_edge(edge["source"], edge["target"])

    entry = next((n["id"] for n in nodes if n["type"] == "input"), None)
    builder.set_entry_point(entry)

    all_sources = {e["source"] for e in edges}
    all_targets = {e["target"] for e in edges}
    for terminal_id in all_sources - all_targets:
        builder.add_edge(terminal_id, END)

    graph = builder.compile()
    await websocket.send_json({ "type": "start" })
    result = await graph.ainvoke({})

    updated_nodes = []
    for node in nodes:
        updated = node.copy()
        if node["id"] in intermediate_outputs:
            updated["data"]["output"] = intermediate_outputs[node["id"]]
        updated_nodes.append(updated)

    await websocket.send_json({
        "type": "complete",
        "result": {
            "nodes": updated_nodes,
            "edges": edges
        }
    })
