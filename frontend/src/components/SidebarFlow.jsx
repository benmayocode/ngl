import React from 'react';
import { useLocation } from 'react-router-dom';

export default function SidebarFlow({ setNodes }) {
  const location = useLocation();

  const addPromptNode = () => {
    const id = `node_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'prompt',
        position: { x: 100 + nds.length * 50, y: 200 },
        data: {
          label: `Prompt Node ${id}`,
          template: '',
          onChange: (newTemplate) => {
            setNodes((prev) =>
              prev.map((node) =>
                node.id === id
                  ? { ...node, data: { ...node.data, template: newTemplate, onChange: node.data.onChange } }
                  : node
              )
            );
          }
        }
      }
    ]);
  };

  return (
    <div>
      <h6>Flow Builder</h6>
      <button className="btn btn-outline-primary w-100" onClick={addPromptNode}>
        + Prompt Node
      </button>
    </div>
  );
}
