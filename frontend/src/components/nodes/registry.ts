// components/nodes/registry.js
import { promptNodeDefinition } from './prompt';
import { outputNodeDefinition } from './output';
import { TypeHint, tText, tList, tLink, tAny, tStruct, tUnion } from '../../types';

export interface PortDef { type: TypeHint; label?: string }
export interface NodeDef {
  type: string;
  label: string;
  inputs: Record<string, PortDef>;
  outputs: Record<string, PortDef>;
}

export const NODE_DEFS: Record<string, NodeDef> = {
  input: {
    type: 'input',
    label: 'Input',
    inputs: {},
    outputs: { out: { type: tText(), label: 'text' } },
  },
  web_search: {
    type: 'web_search',
    label: 'Web Search',
    inputs: { in: { type: tText(), label: 'query' } },
    outputs: { out: { type: tList(tLink()), label: 'links' } },
  },
  listing_page_finder: {
    type: 'listing_page_finder',
    label: 'Listing Page Finder',
    // accept list<link> or list<text> (you can formalize with union later)
    inputs: { in: { type: tList(tLink()), label: 'links' } },
    outputs: { out: { type: tList(tStruct('listing_page')), label: 'listing_page[]' } },
  },
  text_urls_to_links: {
    type: 'text_urls_to_links',
    label: 'Text→Links',
    inputs: { in: { type: tList(tText()), label: 'list<text>' } },
    outputs: { out: { type: tList(tLink()), label: 'list<link>' } },
  },
  to_list: {
    type: 'to_list',
    label: 'To List',
    inputs: { in: { type: tAny(), label: 'any' } },
    outputs: { out: { type: tList(tAny()), label: 'list<any>' } },
  },
  fetch_pages: {
    type: 'fetch_pages',
    label: 'Fetch Pages',
    inputs:  { in:  { type: tList(tLink()),              label: 'list<link>' } },
    outputs: { out: { type: tList(tStruct('page')),       label: 'list<page>' } },
  },
  extract_from_pages: {
    type: 'extract_from_pages',
    label: 'Extract From Pages',
    inputs:  { in:  { type: tList(tStruct('page')),       label: 'list<page>' } },
    // output varies by mode; declare as union to keep the type system happy
    outputs: { out: { type: tUnion(tList(tLink()), tText(), { kind:'json' } as any), label: 'links | text | json' } },
  },
  output: {
    type: 'output',
    label: 'Output',
    inputs: { in: { type: tAny(), label: 'any' } },
    outputs: { out: { type: tAny(), label: 'any' } },
  },
  // adapters (we’ll add in Step 4)
};


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

export function injectOnChangeHandlers(nodes, setNodes) {
  return nodes.map((node) => {
    const onChange = (newData) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? {
              ...n,
              data: { ...newData, onChange }, // re-attach onChange
            }
            : n
        )
      );
    };

    return {
      ...node,
      data: {
        ...node.data,
        onChange,
      },
    };
  });
}
