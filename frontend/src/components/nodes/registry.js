// components/nodes/registry.js
import { promptNodeDefinition } from './prompt';
import { outputNodeDefinition } from './output';

export const nodeRegistry = {
  prompt: promptNodeDefinition,
  output: outputNodeDefinition,
  // input: inputNodeDefinition, etc.
};

export function rehydrateNodesFromRegistry(nodes, setNodes) {
  return nodes.map((node) => {
    const def = nodeRegistry[node.type];
    if (def?.rehydrate) {
      return def.rehydrate(node, setNodes);
    }
    return node;
  });
}
