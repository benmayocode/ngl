// frontend/src/components/nodes/listingPageFinder.js
export const listingPageFinderNodeDefinition =
{
  type: 'listing_page_finder',
  label: 'Find Listing Page',
  createNode: (id, setNodes) => ({
    id,
    type: 'listing_page_finder',
    position: { x: 200, y: 200 },
    data: {
      label: 'Find Listing Page',
      baseUrl: '',
      model: 'gpt-4',
      output: '',
      onChange: (newData) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...newData, onChange: n.data.onChange } } : n
          )
        );
      },
    },
  }),
}
