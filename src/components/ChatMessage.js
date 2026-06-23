'use client';

export default function ChatMessage({
  role,
  content,
  query,
  explanation,
  chartSuggestion,
  data,
  timestamp,
}) {
  const isUser = role === 'user';
  const time = timestamp ? formatTime(timestamp) : null;

  return (
    <div
      style={{
        ...styles.row,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.assistantBubble),
        }}
      >
        {/* Main content */}
        <p style={styles.content}>{content}</p>

        {/* Result count summary */}
        {!isUser && data && data.length > 0 && (
          <div style={styles.summary}>
            📋 Found <strong>{data.length}</strong> result
            {data.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Explanation */}
        {!isUser && explanation && (
          <div style={styles.explanation}>
            <span style={styles.explanationLabel}>Explanation</span>
            <p style={styles.explanationText}>{explanation}</p>
          </div>
        )}

        {/* Generated query */}
        {!isUser && query && (
          <div style={styles.queryBlock}>
            <span style={styles.queryLabel}>Generated Query</span>
            <pre style={styles.queryCode}>
              <code>
                {typeof query === 'string' ? query : JSON.stringify(query, null, 2)}
              </code>
            </pre>
          </div>
        )}

        {/* Chart suggestion hint */}
        {!isUser && chartSuggestion && chartSuggestion.type && (
          <div style={styles.chartHint}>
            📊 Chart suggestion:{' '}
            <strong style={{ textTransform: 'capitalize' }}>
              {chartSuggestion.type}
            </strong>{' '}
            chart
            {chartSuggestion.xAxis && (
              <>
                {' — '}
                <span style={{ color: 'var(--accent-color)' }}>
                  {chartSuggestion.xAxis}
                </span>
                {chartSuggestion.yAxis && (
                  <>
                    {' vs '}
                    <span style={{ color: 'var(--accent-color)' }}>
                      {Array.isArray(chartSuggestion.yAxis)
                        ? chartSuggestion.yAxis.join(', ')
                        : chartSuggestion.yAxis}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Timestamp */}
        {time && (
          <span
            style={{
              ...styles.time,
              ...(isUser ? styles.timeUser : styles.timeAssistant),
            }}
          >
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Styles ──────────────────────────────────────────────────

const styles = {
  row: {
    display: 'flex',
    marginBottom: '1rem',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: '16px',
    padding: '0.85rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    lineHeight: 1.55,
    wordBreak: 'break-word',
  },
  userBubble: {
    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: 'var(--panel-bg)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderBottomLeftRadius: '4px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  content: {
    margin: 0,
    fontSize: '0.95rem',
  },
  summary: {
    fontSize: '0.85rem',
    color: 'var(--accent-color)',
    padding: '0.35rem 0.6rem',
    background: 'rgba(88, 166, 255, 0.08)',
    borderRadius: '8px',
    width: 'fit-content',
  },
  explanation: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
  },
  explanationLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
    display: 'block',
  },
  explanationText: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  queryBlock: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    overflow: 'hidden',
  },
  queryLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '0.35rem',
    display: 'block',
  },
  queryCode: {
    margin: 0,
    fontFamily: "'Fira Code', 'Cascadia Code', 'Menlo', monospace",
    fontSize: '0.8rem',
    color: 'var(--accent-color)',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
  chartHint: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    padding: '0.3rem 0',
  },
  time: {
    fontSize: '0.7rem',
    marginTop: '0.15rem',
    alignSelf: 'flex-end',
  },
  timeUser: {
    color: 'rgba(255,255,255,0.65)',
  },
  timeAssistant: {
    color: 'var(--text-secondary)',
  },
};
