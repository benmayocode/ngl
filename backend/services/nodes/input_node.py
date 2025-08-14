# services/nodes/input_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext

@register_node("input")
def build(ctx: NodeContext):
    node_id = ctx.node["id"]
    return RunnableLambda(lambda state: {node_id: ctx.user_input})
