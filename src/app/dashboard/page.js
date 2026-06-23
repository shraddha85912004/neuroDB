'use client';

import { useState, useEffect, useRef } from 'react';
import DataTable from '@/components/DataTable';
import ResultChart from '@/components/ResultChart';

export default function DashboardQuery() {
  // Data sources
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const chatEndRef = useRef(null);

  // View mode for results
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'

  // Editable query
  const [editableQuery, setEditableQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSourceType, setLastSourceType] = useState('');

  useEffect(() => {
    fetch('/api/datasources')
      .then(res => res.json())
      .then(data => {
        if (data.dataSources) {
          setSources(data.dataSources);
          if (data.dataSources.length > 0) setSelectedSourceId(data.dataSources[0]._id);
        }
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildChatHistory = () => {
    return messages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && m.generatedQuery))
      .map(m => m.role === 'user' 
        ? { user: m.content } 
        : { user: '', query: m.generatedQuery }
      )
      .filter(h => h.user);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSourceId) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setLoadingStep(1);

    try {
      setLoadingStep(2);
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          sourceId: selectedSourceId,
          chatHistory: buildChatHistory()
        })
      });

      setLoadingStep(3);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Query failed');

      setLoadingStep(4);

      const selectedSource = sources.find(s => s._id === selectedSourceId);
      setLastSourceType(selectedSource?.type || '');

      const assistantMsg = {
        role: 'assistant',
        content: data.explanation || 'Query executed successfully.',
        data: data.data,
        generatedQuery: data.generatedQuery,
        explanation: data.explanation,
        chartSuggestion: data.chartSuggestion,
        resultCount: data.data?.length || 0,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Set editable query
      if (data.generatedQuery?.sql) {
        setEditableQuery(data.generatedQuery.sql);
      } else {
        setEditableQuery(JSON.stringify(data.generatedQuery, null, 2));
      }

      // Auto-set view mode based on chart suggestion
      if (data.chartSuggestion && data.chartSuggestion.type !== 'table' && data.data?.length > 0) {
        setViewMode('chart');
      } else {
        setViewMode('table');
      }

      // Save to history
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSourceId,
          sourceName: selectedSource?.name,
          sourceType: selectedSource?.type,
          naturalLanguageQuery: input,
          generatedQuery: data.generatedQuery,
          explanation: data.explanation,
          resultCount: data.data?.length || 0,
          tags: []
        })
      }).catch(() => {}); // Fire and forget

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleRunEdited = async () => {
    if (!editableQuery.trim() || !selectedSourceId) return;
    setLoading(true);

    try {
      const selectedSource = sources.find(s => s._id === selectedSourceId);
      const dbType = selectedSource?.type || 'mongodb';

      const res = await fetch('/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawQuery: editableQuery,
          sourceId: selectedSourceId,
          dbType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      const assistantMsg = {
        role: 'assistant',
        content: `✏️ Edited query executed. Found ${data.data?.length || 0} results.`,
        data: data.data,
        resultCount: data.data?.length || 0,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsEditing(false);
      setViewMode('table');
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.data);

  const loadingSteps = [
    { step: 1, icon: '🧠', text: 'Understanding your question...' },
    { step: 2, icon: '⚡', text: 'Generating query...' },
    { step: 3, icon: '🔍', text: 'Executing against database...' },
    { step: 4, icon: '✅', text: 'Processing results...' },
  ];

  return (
    <div>
      <h1 className="page-title">AI Query Explorer</h1>
      <p className="page-subtitle">Ask questions about your data in plain English. Multi-turn conversations supported.</p>

      {/* Source Selector */}
      {sources.length > 0 ? (
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <select
            className="form-select"
            value={selectedSourceId}
            onChange={e => { setSelectedSourceId(e.target.value); setMessages([]); }}
            style={{ width: '100%' }}
          >
            {sources.map(s => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.type})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="error-message" style={{ maxWidth: '500px', marginBottom: '1.5rem' }}>
          No Data Sources connected. Go to <strong>Data Sources</strong> tab to add one.
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <p>Start by asking a question about your data.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Try: "Show me all users" or "What's the average order value?"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              <div>{msg.content}</div>

              {msg.role === 'assistant' && msg.resultCount > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="badge badge-success">📋 {msg.resultCount} results</span>
                </div>
              )}

              {msg.role === 'assistant' && msg.explanation && !msg.isError && (
                <div className="explanation-block" style={{ marginTop: '0.8rem' }}>
                  <div className="field-label" style={{ marginBottom: '0.3rem' }}>Explanation</div>
                  {msg.explanation}
                </div>
              )}

              {msg.role === 'assistant' && msg.generatedQuery && (
                <div className="query-display" style={{ marginTop: '0.8rem', fontSize: '0.8rem' }}>
                  <div className="field-label" style={{ marginBottom: '0.3rem' }}>Generated Query</div>
                  {msg.generatedQuery.sql || JSON.stringify(msg.generatedQuery.filter || msg.generatedQuery, null, 2)}
                </div>
              )}

              <div className="chat-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {/* Loading Steps */}
          {loading && (
            <div className="chat-bubble assistant">
              <div className="loading-steps">
                {loadingSteps.map(s => (
                  <div key={s.step} className={`loading-step ${loadingStep >= s.step ? (loadingStep > s.step ? 'done' : 'active') : ''}`}>
                    <span className="step-icon">{loadingStep > s.step ? '✅' : s.icon}</span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="chat-input-area">
          <form onSubmit={handleSend} className="search-bar-container">
            <input
              type="text"
              className="search-input"
              placeholder={sources.length > 0 ? "Ask a question about your data..." : "Connect a data source first..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || sources.length === 0}
            />
            <button type="submit" className="search-button" disabled={loading || !input.trim() || sources.length === 0}>
              {loading ? <div className="loading-spinner" /> : '→'}
            </button>
          </form>
        </div>
      </div>

      {/* Results Area */}
      {lastAssistantMsg && lastAssistantMsg.data && lastAssistantMsg.data.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          {/* View Toggle + Edit Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="btn-group">
              <button className={`btn-toggle ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>📋 Table</button>
              <button className={`btn-toggle ${viewMode === 'chart' ? 'active' : ''}`} onClick={() => setViewMode('chart')}>📊 Chart</button>
            </div>
            <button className="btn-secondary" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? '✕ Close Editor' : '✏️ Edit Query'}
            </button>
          </div>

          {/* Editable Query Panel */}
          {isEditing && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="field-label" style={{ marginBottom: '0.5rem' }}>Edit & Re-run Query</div>
              <div className="query-display">
                <textarea
                  value={editableQuery}
                  onChange={(e) => setEditableQuery(e.target.value)}
                  rows={5}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button className="btn-primary" onClick={handleRunEdited} disabled={loading} style={{ borderRadius: 'var(--radius-sm)' }}>
                  {loading ? 'Running...' : '▶ Run Edited Query'}
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          {viewMode === 'table' ? (
            <DataTable data={lastAssistantMsg.data} />
          ) : (
            <div className="chart-wrapper">
              <ResultChart data={lastAssistantMsg.data} chartSuggestion={lastAssistantMsg.chartSuggestion} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
