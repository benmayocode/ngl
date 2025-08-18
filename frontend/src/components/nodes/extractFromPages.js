export const extractFromPagesNodeDefinition = {
  type: 'extract_from_pages',
  label: 'Extract From Pages',
  createNode: (id, setNodes) => ({
    id,
    type: 'extract_from_pages',
    position: { x: 400, y: 200 },
    data: {
      label: 'Extract From Pages',
      mode: 'links',           // 'links' | 'text' | 'json'
      instruction: '',
      model: 'gpt-4o-mini',
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
