export const promptNodeDefinition = {
  type: 'prompt',
  label: 'Prompt Node',
  createNode: (id, setNodes) => ({
    id,
    type: 'prompt',
    position: { x: 100, y: 100 },
    data: {
      label: 'Prompt Node',
      template: '',
      onChange: (newTemplate) => {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    template: newTemplate,
                    onChange: node.data.onChange,
                  },
                }
              : node
          )
        );
      },
    },
  }),
};
