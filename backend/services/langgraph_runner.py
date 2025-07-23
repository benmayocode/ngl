# services/langgraph_runner.py
from langgraph.graph import StateGraph, END
from langchain.chat_models import ChatOpenAI
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import HumanMessage
from typing import TypedDict


class FlowState(TypedDict):
    user_input: str
    message: str
    rewritten: str
    output: str


def run_flow(flow_data: dict, user_input: str) -> str:
    nodes = flow_data.get("nodes", [])
    edges = flow_data.get("edges", [])

    node_map = {}

    for node in nodes:
        node_id = node["id"]
        node_type = node["type"]

        if node_type == "input":
            node_map[node_id] = RunnableLambda(lambda state: {"message": user_input})

        elif node_type == "prompt":
            template = node.get("data", {}).get("template", "")
            def make_prompt_fn(template):
                def prompt_node(state):
                    llm = ChatOpenAI(model="gpt-4", temperature=0)
                    msg = template.format(**state)
                    response = llm.invoke([HumanMessage(content=msg)])
                    return {"rewritten": response.content}
                return prompt_node
            node_map[node_id] = RunnableLambda(make_prompt_fn(template))

        elif node_type == "output":
            node_map[node_id] = RunnableLambda(lambda state: {"output": state.get("rewritten")})

    builder = StateGraph(FlowState)

    for node_id, fn in node_map.items():
        builder.add_node(node_id, fn)

    for edge in edges:
        builder.add_edge(edge["source"], edge["target"])

    entry_node = next((n["id"] for n in nodes if n["type"] == "input"), None)
    end_node = next((n["id"] for n in nodes if n["type"] == "output"), None)

    if not entry_node or not end_node:
        raise ValueError("Graph must contain 'input' and 'output' nodes")

    builder.set_entry_point(entry_node)
    builder.add_edge(end_node, END)

    graph = builder.compile()
    result = graph.invoke({ "user_input": user_input })

    return result.get("output", "(no output)")
