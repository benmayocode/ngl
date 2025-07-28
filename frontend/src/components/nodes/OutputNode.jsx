import { Handle, Position } from 'reactflow';

export default function OutputNode({ data, isConnectable }) {
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
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(data.output, null, 2)}
        </pre>
      );
    }

    return <span>{data.output}</span>;
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
        <strong style={{ display: 'block', marginBottom: 4 }}>
          {data.label || 'Output'}
        </strong>
        {renderOutput()}
      </div>

      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
