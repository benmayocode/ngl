# services/langgraph_runner.py
from langgraph.graph import StateGraph, END
from langchain.chat_models import ChatOpenAI
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import HumanMessage
from typing import TypedDict
from collections import defaultdict
from services.prompt import run_prompt


class FlowState(TypedDict):
    pass  # we use flexible dict


def run_flow(flow_data: dict, user_input: str) -> dict:
    nodes = flow_data["nodes"]
    edges = flow_data["edges"]

    node_map = {}
    intermediate_outputs = {}

    # Build map of each node's upstream inputs
    input_sources = defaultdict(list)
    for edge in edges:
        input_sources[edge["target"]].append(edge["source"])

    for node in nodes:
        node_id = node["id"]
        node_type = node["type"]
        data = node.get("data", {})

        if node_type == "input":
            node_map[node_id] = RunnableLambda(lambda state: {
                node_id: user_input
            })

        elif node_type == "prompt":
            from services.prompt import run_prompt

            instruction = data.get("template", "")
            fallback_input = data.get("testInput", "")
            model_id = data.get("model", "gpt-4")
            parent_ids = input_sources.get(node_id, [])

            def make_prompt_fn(instruction, fallback_input, model_id, node_id, parent_ids):
                def fn(state):
                    input_val = None
                    for pid in parent_ids:
                        if pid in state:
                            input_val = state[pid]
                            break
                    if not input_val:
                        input_val = {
                            "type": "text",
                            "value": fallback_input
                        }

                    if isinstance(input_val, str):
                        input_val = {
                            "type": "text",
                            "value": input_val
                        }

                    print(f"👀 Prompt node input_val: {input_val}")
                    print(f"📥 Parent state keys: {list(state.keys())}")

                    if input_val.get("type") == "list":
                        outputs = []
                        for item in input_val["items"]:
                            single_result = run_prompt(instruction, item, model_id)
                            outputs.append(single_result)
                        result = {
                            "type": "list",
                            "items": outputs,
                            "metadata": {
                                "applied_prompt": instruction,
                                "model": model_id
                            }
                        }
                    else:
                        result = run_prompt(instruction, input_val, model_id)

                    # Simplified preview for frontend display
                    preview = (
                        result["value"]
                        if result.get("type") == "text"
                        else "\n".join(item.get("value", "") for item in result.get("items", []))
                    )
                    intermediate_outputs[node_id] = preview

                    return {node_id: result}
                return fn

            node_map[node_id] = RunnableLambda(make_prompt_fn(
                instruction, fallback_input, model_id, node_id, parent_ids
            ))

        elif node_type == "listing_page_finder":
            from services.listing_finder import find_listings_page

            model_id = data.get("model", "gpt-4")
            parent_ids = input_sources.get(node_id, [])

            def make_listing_page_fn(model_id, node_id, parent_ids):
                def fn(state):
                    input_val = None
                    for pid in parent_ids:
                        if pid in state:
                            input_val = state[pid]
                            break

                    if not input_val or input_val.get("type") != "list":
                        raise ValueError("listing_page_finder node requires a list input")

                    results = []
                    for item in input_val["items"]:
                        if item.get("type") == "text":
                            result = find_listings_page(item["value"], model=model_id)
                            results.append(result)

                    output = {
                        "type": "list",
                        "items": results,
                        "metadata": {
                            "model": model_id,
                            "operation": "find_listing_page"
                        }
                    }

                    intermediate_outputs[node_id] = "\n".join(r["value"] for r in results)
                    return {node_id: output}

                return fn

            node_map[node_id] = RunnableLambda(
                make_listing_page_fn(model_id, node_id, parent_ids)
            )


        elif node_type == "web_search":
            query = data.get("query", "")
            max_results = data.get("maxResults", 5)

            def make_web_search_fn(query, max_results, node_id):
                def fn(state):
                    from services.web_search import run_web_search
                    results = run_web_search(query, max_results)
                    intermediate_outputs[node_id] = "\n".join(results)
                    return {node_id: results}
                return fn

            node_map[node_id] = RunnableLambda(make_web_search_fn(query, max_results, node_id))

        elif node_type == "output":
            parent_ids = input_sources.get(node_id, [])

            def make_output_passthrough_fn(node_id, parent_ids):
                def fn(state):
                    for pid in parent_ids:
                        if pid in state:
                            result = state[pid]
                            intermediate_outputs[node_id] = (
                                result.get("value")
                                if isinstance(result, dict) and result.get("type") == "text"
                                else str(result)
                            )
                            return {node_id: result}
                    # If no parent found
                    return {node_id: None}
                return fn

            node_map[node_id] = RunnableLambda(make_output_passthrough_fn(node_id, parent_ids))

    # Build graph
    builder = StateGraph(dict)
    for node_id, fn in node_map.items():
        builder.add_node(node_id, fn)
    for edge in edges:
        builder.add_edge(edge["source"], edge["target"])

    # Set entry and exit nodes
    entry = next((n["id"] for n in nodes if n["type"] == "input"), None)
    builder.set_entry_point(entry)

    all_sources = {e["source"] for e in edges}
    all_targets = {e["target"] for e in edges}
    terminal_ids = all_sources - all_targets
    for terminal_id in terminal_ids:
        builder.add_edge(terminal_id, END)

    graph = builder.compile()
    result = graph.invoke({})

    output = result.get("output", "")

    # Patch outputs back into nodes
    updated_nodes = []
    for node in nodes:
        updated = node.copy()
        if node["id"] in intermediate_outputs:
            updated["data"]["output"] = intermediate_outputs[node["id"]]
        updated_nodes.append(updated)

    return {
        "nodes": updated_nodes,
        "edges": edges
    }
