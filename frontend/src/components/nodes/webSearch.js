// frontend/src/components/nodes/webSearch.js
export const webSearchNodeDefinition = {
  type: 'web_search',
  label: 'Web Search',
  createNode: (id, setNodes) => ({
    id,
    type: 'web_search',
    position: { x: 100, y: 100 },
    data: {
      label: 'Web Search',
      query: '',
      maxResults: 5,
      onChange: (newData) => {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: { ...newData, onChange: node.data.onChange },
                }
              : node
          )
        );
      },
    },
  }),
};
