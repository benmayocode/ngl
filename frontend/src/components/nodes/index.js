import { promptNodeDefinition } from './prompt';
import { inputNodeDefinition } from './input';
import { outputNodeDefinition } from './output';
import { webSearchNodeDefinition } from './webSearch';

export const NODE_DEFINITIONS = [
  inputNodeDefinition,
  promptNodeDefinition,
  outputNodeDefinition,
  webSearchNodeDefinition,
];
