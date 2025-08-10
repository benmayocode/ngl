// frontend/src/components/FlowModal.tsx
import { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import PromptNode from './nodes/PromptNode';
import OutputNode from './nodes/OutputNode';
import WebSearchNode from './nodes/WebSearchNode';
import ListingPageFinderNode from './nodes/ListingPageFInderNode';
import { rehydrateNodesFromRegistry } from './nodes/registry';
import { useNavigate } from 'react-router-dom';
import type { Node, Edge } from "reactflow";

import type { Flow } from '../types';

const nodeTypes = {
  prompt: PromptNode,
  output: OutputNode,
  web_search: WebSearchNode,
  listing_page_finder: ListingPageFinderNode,
};


export default function FlowModal({ flowId, sessionId, onClose }: { flowId: string; sessionId: string | undefined; onClose: () => void }) {
  const [flowData, setFlowData] = useState<Flow | null>(null);
  const [inputs, setInputs] = useState<Record<string, unknown>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const res = await fetch(`/api/flows/${flowId}`);
        const data = await res.json();
        rehydrateNodesFromRegistry(data.nodes);
        setFlowData(data);

        // Optional: Prepopulate inputs for known start nodes
        const initialInputs: Record<string, unknown> = {};
        data.nodes?.forEach((node: Node) => {
          if (node.type === 'input') {
            initialInputs[node.id] = '';
          }
        });
        setInputs(initialInputs);
      } catch (err) {
        console.error("Failed to load flow:", err);
      }
    };

    fetchFlow();
  }, [flowId]);

  const handleRun = async () => {
    try {
      const res = await fetch(`/api/langgraph/run/${flowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          input: inputs,  // flexible: single input or multiple
        }),
      });

      const data = await res.json();
      console.log("Flow executed:", data);
      onClose();
    } catch (err) {
      console.error("Flow execution failed:", err);
    }
  };


  if (!flowData) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} onClick={onClose}>
      <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{flowData.name}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body" style={{ height: '500px' }}>
            <div style={{ height: '100%' }}>
              <ReactFlow nodes={flowData.nodes} edges={flowData.edges} fitView nodeTypes={nodeTypes}>
                <Background />
                <Controls />
              </ReactFlow>
            </div>

          </div>

          <div className="modal-footer">
            <button
              className="btn btn-outline-secondary me-auto"
              onClick={() => {
                onClose();
                navigate(`/flow?id=${flowId}`);
              }}
            >
              Edit Flow
            </button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRun}>Run Flow</button>
          </div>
        </div>
      </div>
    </div>
  );
}
