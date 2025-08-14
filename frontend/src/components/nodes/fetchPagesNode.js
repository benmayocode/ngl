// frontend/src/components/nodes/fetchPagesNode.js

export const fetchPagesNodeDefinition = {
  type: 'fetch_pages',
  label: 'Fetch Pages',
  createNode: (id) => ({
    id,
    type: 'fetch_pages',
    position: { x: 200, y: 200 },
    data: {
      label: 'Fetch Pages',
      concurrency: 6,          // default
    },
  }),
};
