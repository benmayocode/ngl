// frontend/src/components/nodes/index.js
import { promptNodeDefinition } from './prompt';
import { inputNodeDefinition } from './input';
import { outputNodeDefinition } from './output';
import { listingPageFinderNodeDefinition } from './listingPageFinder';
import { webSearchNodeDefinition } from './webSearch';

import { fetchPagesNodeDefinition } from './fetchPages';
import { extractFromPagesNodeDefinition } from './extractFromPages';

export const NODE_DEFINITIONS = [
  inputNodeDefinition,
  webSearchNodeDefinition,
  fetchPagesNodeDefinition,
  extractFromPagesNodeDefinition,
  listingPageFinderNodeDefinition,
  promptNodeDefinition,
  outputNodeDefinition,
];
