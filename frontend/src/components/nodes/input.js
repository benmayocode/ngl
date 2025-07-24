export const inputNodeDefinition = {
  type: 'input',
  label: 'Input Node',
  createNode: (id) => ({
    id,
    type: 'input',
    position: { x: 100, y: 100 },
    data: {
      label: 'Input Node',
    },
  }),
};
