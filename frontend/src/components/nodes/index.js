// frontend/src/components/nodes/index.js
import { promptNodeDefinition } from './prompt';
import { inputNodeDefinition } from './input';
import { outputNodeDefinition } from './output';
import { listingPageFinderNodeDefinition } from './listingPageFinder';
import { webSearchNodeDefinition } from './webSearch';

export const NODE_DEFINITIONS = [
  inputNodeDefinition,
  promptNodeDefinition,
  listingPageFinderNodeDefinition,
  outputNodeDefinition,
  webSearchNodeDefinition,
];
