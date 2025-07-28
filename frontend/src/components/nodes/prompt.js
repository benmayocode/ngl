export const promptNodeDefinition = {
  type: 'prompt',
  label: 'Prompt Node',
  createNode: (id, setNodes) => ({
    id,
    type: 'prompt',
    position: { x: 100, y: 100 },
    data: {
      label: 'Prompt Node',
      model: 'gpt-3.5',
      template: '',
      testInput: '',
      onChange: (newData) => {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...newData,
                    onChange: node.data.onChange,
                  },
                }
              : node
          )
        );
      },
    },
  }),

  rehydrate: (node, setNodes) => ({
    ...node,
    data: {
      ...node.data,
      onChange: (newData) => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...newData,
                    onChange: n.data.onChange,
                  },
                }
              : n
          )
        );
      },
    },
  }),
};
