// frontend/src/components/SidebarFlow.jsx

import { NODE_DEFINITIONS } from './nodes';

export default function SidebarFlow({ setNodes }) {
  const addNode = (def) => {
    const id = `node_${Date.now()}`;
    const newNode = def.createNode(id, setNodes);
    setNodes((prev) => [...prev, newNode]);
  };

  return (
    <div>
      <h6>Flow Builder</h6>
      {NODE_DEFINITIONS.map((def) => (
        <button
          key={def.type}
          className="btn btn-outline-primary w-100 mb-2"
          onClick={() => addNode(def)}
        >
          + {def.label}
        </button>
      ))}
    </div>
  );
}
