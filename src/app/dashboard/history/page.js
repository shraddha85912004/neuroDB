'use client';

import { useState, useEffect } from 'react';

export default function QueryHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.history) setHistory(data.history);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(h => 
    h.naturalLanguageQuery?.toLowerCase().includes(search.toLowerCase()) ||
    h.sourceName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <h1 className="page-title">Query History</h1>
        <p className="page-subtitle">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Query History</h1>
      <p className="page-subtitle">Browse and re-run your past queries.</p>

      <input
        type="text"
        className="table-search"
        placeholder="Search queries..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📜</div>
          <p style={{ color: 'var(--text-secondary)' }}>No queries found. Start asking questions!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {filtered.map((item, i) => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>"{item.naturalLanguageQuery}"</div>
                {item.explanation && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {item.explanation}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-info">{item.sourceType || 'db'}</span>
                  <span className="badge badge-success">{item.resultCount} results</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.sourceName} · {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="query-display" style={{ maxWidth: '300px', fontSize: '0.75rem', padding: '0.5rem 0.8rem' }}>
                {item.generatedQuery?.sql || JSON.stringify(item.generatedQuery?.filter || {}).slice(0, 100)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
