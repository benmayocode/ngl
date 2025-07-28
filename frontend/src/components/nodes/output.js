// frontend/src/components/nodes/output.js
export const outputNodeDefinition = {
  type: 'output',
  label: 'Output Node',
  createNode: (id) => ({
    id,
    type: 'output',
    position: { x: 100, y: 300 },
    data: {
      label: 'Output Node',
    },
  }),
};
