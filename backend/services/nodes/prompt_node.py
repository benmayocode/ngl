# services/nodes/prompt_node.py
from langchain_core.runnables import RunnableLambda
from .base import register_node, NodeContext
from services.prompt import run_prompt

@register_node("prompt")
def build(ctx: NodeContext):
    data = ctx.node.get("data", {})
    node_id = ctx.node["id"]
    instruction = data.get("template", "")
    fallback_input = data.get("testInput", "")
    model_id = data.get("model", "gpt-4")

    async def fn(state):
        await ctx.send_status(node_id, "running")
        try:
            input_val = next((state[pid] for pid in ctx.parent_ids if pid in state), None)
            if not input_val:
                input_val = {"type": "text", "value": fallback_input}
            if isinstance(input_val, str):
                input_val = {"type": "text", "value": input_val}

            if input_val.get("type") == "list":
                outputs = [run_prompt(instruction, item, model_id) for item in input_val["items"]]
                result = {"type": "list", "items": outputs,
                          "metadata": {"applied_prompt": instruction, "model": model_id}}
            else:
                result = run_prompt(instruction, input_val, model_id)

            ctx.intermediate_outputs[node_id] = result
            await ctx.send_status(node_id, "complete", {"output": result})
            return {node_id: result}
        except Exception as e:
            await ctx.send_status(node_id, "error", {"message": str(e)})
            raise

    return RunnableLambda(fn)
