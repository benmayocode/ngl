import { useState } from 'react';
import { Handle, Position } from 'reactflow';

export default function OutputNode({ data, isConnectable }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data.output) return;
    const text = typeof data.output === 'string'
      ? data.output
      : JSON.stringify(data.output, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderOutput = () => {
    if (!data.output) {
      return <span style={{ color: '#aaa' }}><em>No output yet</em></span>;
    }

    if (Array.isArray(data.output)) {
      return (
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {data.output.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }

    if (typeof data.output === 'object') {
      return (
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            background: '#f6f8fa',
            padding: '0.5rem',
            borderRadius: 4,
            fontSize: '0.8rem',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(data.output, null, 2)}
        </pre>
      );
    }

    return <span>{String(data.output)}</span>;
  };

  return (
    <div
      style={{
        width: 400,
        padding: 0,
        background: 'transparent',
      }}
    >
      <div
        style={{
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid #ccc',
          background: '#f9f9f9',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          minHeight: 100,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong>{data.label || 'Output'}</strong>
          <button
            onClick={handleCopy}
            style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ marginTop: 6 }}>{renderOutput()}</div>
      </div>

      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
