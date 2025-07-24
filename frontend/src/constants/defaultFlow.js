// frontend/src/constants/defaultFlow.js

export const defaultNodes = [
  {
    id: 'input',
    type: 'input',
    position: { x: 50, y: 50 },
    data: { label: 'Input Node' },
  },
  {
    id: 'rewrite',
    type: 'prompt',
    position: { x: 250, y: 50 },
    data: {
      label: 'Prompt Node: Rewrite',
      template: 'Rewrite this professionally:\n\n{message}',
    },
  },
  {
    id: 'output',
    type: 'output',
    position: { x: 500, y: 50 },
    data: { label: 'Output Node' },
  },
];

export const defaultEdges = [
  { id: 'e1', source: 'input', target: 'rewrite' },
  { id: 'e2', source: 'rewrite', target: 'output' },
];
