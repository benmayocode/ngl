import { useState, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import JSON5 from 'json5';

// Light build + explicit json registration (keeps highlighting reliable)
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsonLang from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
SyntaxHighlighter.registerLanguage('json', jsonLang);

// --- helpers ---
function looksJsonLike(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

function parseLenientJsonString(s) {
  // 1) Try strict JSON
  try { return { value: JSON.parse(s), lang: 'json' }; } catch { }

  // 2) Try JSON5 (handles single quotes, trailing commas, etc.)
  try { return { value: JSON5.parse(s), lang: 'json' }; } catch { }

  // 3) Fallback: normalize common Python-ish tokens to JSON and retry
  try {
    const normalized = s
      .replace(/\bNone\b/g, 'null')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      // crude quote normalizer: only safe if your strings don't contain apostrophes
      .replace(/'/g, '"');
    return { value: JSON.parse(normalized), lang: 'json' };
  } catch { }

  // Give up → plain text
  return { value: s, lang: 'text' };
}


function safePretty(out) {
  // 1) Already object/array
  if (out && typeof out === 'object') {
    return { text: JSON.stringify(out, null, 2), lang: 'json' };
  }

  // 2) String cases
  if (typeof out === 'string') {
    let t = out.trim();

    // normalize smart quotes → straight quotes (common from copy/paste)
    t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

    // If it's quoted JSON (JSON-escaped JSON), unescape once
    // e.g. "\"{\\\"a\\\":1}\"" → "{\"a\":1}" → parse again
    try {
      if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        const unquoted = JSON.parse(t); // removes the outer quotes/escapes
        if (looksJsonLike(unquoted)) {
          try {
            const parsedTwice = JSON.parse(unquoted);
            return { text: JSON.stringify(parsedTwice, null, 2), lang: 'json' };
          } catch {
            // if second parse fails, pretty-print the unquoted string as text
            return { text: unquoted, lang: 'text' };
          }
        }
        // not JSON after unquoting -> show unquoted as text
        return { text: unquoted, lang: 'text' };
      }
    } catch {
      // not a valid JSON string literal; continue
    }

    // Raw JSON string (not double-encoded)
    if (looksJsonLike(t)) {
      try {
        const parsed = JSON.parse(t);
        return { text: JSON.stringify(parsed, null, 2), lang: 'json' };
      } catch {
        // fall through
      }
    }

    // Fallback: plain text
    return { text: out, lang: 'text' };
  }

  // 3) Everything else
  return { text: String(out ?? ''), lang: 'text' };
}


export default function OutputNode({ data, isConnectable }) {
  const [copied, setCopied] = useState(false);

  const { textValue, language } = useMemo(() => {
    const out = data?.output;

    if (out == null) return { textValue: '', language: 'text' };

    if (typeof out === 'object') {
      return { textValue: JSON.stringify(out, null, 2), language: 'json' };
    }

    if (typeof out === 'string') {
      const { value, lang } = parseLenientJsonString(out.trim());
      const pretty = typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);
      return { textValue: pretty, language: lang };
    }

    return { textValue: String(out), language: 'text' };
  }, [data?.output]);

  const handleCopy = () => {
    if (!textValue) return;
    navigator.clipboard.writeText(textValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  console.log('rendered textValue:', JSON.stringify(textValue).slice(0, 200));
  console.log('line count:', (textValue.match(/\n/g) || []).length);


  return (
    <div style={{ width: 420, background: 'transparent', padding: 0 }}>
      <div
        style={{
          background: '#2b2f36',
          color: '#fff',
          border: '1px solid #3a3f45',
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #3a3f45',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            fontSize: 12,
            letterSpacing: 0.2,
          }}
        >
          <strong style={{ color: '#fff', opacity: 0.9 }}>
            {data?.label || 'Output'}
          </strong>
          <button
            onClick={handleCopy}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #4a5158',
              background: copied ? '#2f855a' : '#3a4047',
              color: '#fff',
              cursor: textValue ? 'pointer' : 'not-allowed',
              opacity: textValue ? 1 : 0.5,
              transition: 'background .15s ease',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Body */}
        <div
          className="nowheel nodrag"
          onWheel={(e) => e.stopPropagation()}
          onWheelCapture={(e) => e.stopPropagation()}          // extra-safe for FF
          onMouseDown={(e) => e.stopPropagation()}             // avoid node-drag when selecting
          onTouchStart={(e) => e.stopPropagation()}            // mobile scroll
          style={{
            maxHeight: 260,
            overflowY: 'auto',
            overflowX: 'auto',
            overscrollBehavior: 'contain',                      // prevent scroll chaining
          }}
        >
          {textValue ? (
            <SyntaxHighlighter
              language={language}              // 'json' when pretty-printed
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '10px 12px',
                background: '#2b2f36',
                color: '#fff',
                fontSize: 12,
                lineHeight: 1.5,
                borderRadius: 0,
              }}
              wrapLongLines={false}
              showLineNumbers={false}
            >
              {textValue}
            </SyntaxHighlighter>
          ) : (
            <div
              style={{
                padding: '10px 12px',
                color: '#c9ccd1',
                fontStyle: 'italic',
                fontSize: 12,
              }}
            >
              No output yet
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}
