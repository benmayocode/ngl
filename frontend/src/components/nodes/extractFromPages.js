export const extractFromPagesNodeDefinition = {
  type: 'extract_from_pages',
  label: 'Extract From Pages',
  createNode: (id) => ({
    id,
    type: 'extract_from_pages',
    position: { x: 400, y: 200 },
    data: {
      label: 'Extract From Pages',
      mode: 'links',           // 'links' | 'text' | 'json'
      instruction: '',
      model: 'gpt-4o-mini',
    },
  }),
};
