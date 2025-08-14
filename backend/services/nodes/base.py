# services/nodes/base.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Callable, Dict, Awaitable, Protocol

from langchain_core.runnables import Runnable

NodeBuilder = Callable[['NodeContext'], Runnable]

NODE_REGISTRY: Dict[str, NodeBuilder] = {}

def register_node(node_type: str):
    def deco(fn: NodeBuilder):
        NODE_REGISTRY[node_type] = fn
        return fn
    return deco

class StatusSender(Protocol):
    def __call__(self, node_id: str, status: str, detail: Dict[str, Any] | None = None) -> Awaitable[None]: ...

@dataclass
class NodeContext:
    node: Dict[str, Any]
    parent_ids: list[str]
    send_status: StatusSender
    user_input: str
    intermediate_outputs: Dict[str, Any]
