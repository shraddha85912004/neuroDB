'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export default function DataSources() {
  const { data: session } = useSession();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connect'); // 'connect' | 'upload'
  
  // Connect form
  const [name, setName] = useState('');
  const [type, setType] = useState('mongodb');
  const [uri, setUri] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload form
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const fileRef = useRef(null);

  useEffect(() => { fetchSources(); }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/datasources');
      const data = await res.json();
      if (res.ok) setSources(data.dataSources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, uri })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');

      setSuccess(`✅ Connected! Found ${data.tablesFound} tables/collections.`);
      setName('');
      setUri('');
      fetchSources();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file || !uploadName) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', uploadName);

    try {
      const res = await fetch('/api/datasources/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccess(`✅ Uploaded! ${data.rowCount} rows, ${data.columns?.length} columns detected.`);
      setUploadName('');
      if (fileRef.current) fileRef.current.value = '';
      fetchSources();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this data source?')) return;
    try {
      const res = await fetch(`/api/datasources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSources(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="page-title">Data Sources</h1>
        <p className="page-subtitle">Loading...</p>
      </div>
    );
  }

  const isAdmin = session?.user?.role === 'admin';

  return (
    <div>
      <h1 className="page-title">Data Sources</h1>
      <p className="page-subtitle">Manage your firm's database connections and uploaded files.</p>

      {isAdmin && (
        <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
          {/* Tabs */}
          <div className="btn-group" style={{ marginBottom: '1.5rem' }}>
            <button className={`btn-toggle ${activeTab === 'connect' ? 'active' : ''}`} onClick={() => setActiveTab('connect')}>
              🔗 Connect Database
            </button>
            <button className={`btn-toggle ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
              📁 Upload File
            </button>
          </div>

          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(80, 250, 123, 0.08)', border: '1px solid rgba(80, 250, 123, 0.2)', color: 'var(--success)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

          {activeTab === 'connect' ? (
            <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="field-label">Connection Name</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Production MongoDB" />
              </div>

              <div className="form-group">
                <label className="field-label">Database Type</label>
                <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                  <option value="mongodb">MongoDB</option>
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">Connection URI</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={uri} 
                  onChange={e => setUri(e.target.value)} 
                  required 
                  placeholder={
                    type === 'mongodb' ? 'mongodb://localhost:27017/mydb' : 
                    type === 'mysql' ? 'mysql://user:pass@localhost:3306/mydb' :
                    'postgresql://user:pass@localhost:5432/mydb'
                  }
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  💡 Tip: Use a read-only database user for maximum security.
                </span>
              </div>

              <button type="submit" className="btn-primary" disabled={adding} style={{ borderRadius: 'var(--radius-sm)' }}>
                {adding ? 'Analyzing Schema...' : '🔗 Connect & Analyze Schema'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="field-label">Dataset Name</label>
                <input type="text" className="form-input" value={uploadName} onChange={e => setUploadName(e.target.value)} required placeholder="e.g. Q4 Sales Report" />
              </div>

              <div className="form-group">
                <label className="field-label">File (CSV or Excel)</label>
                <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls" className="form-input" required style={{ padding: '0.5rem' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Supported: .csv, .xlsx, .xls
                </span>
              </div>

              <button type="submit" className="btn-primary" disabled={uploading} style={{ borderRadius: 'var(--radius-sm)' }}>
                {uploading ? 'Uploading & Parsing...' : '📁 Upload & Analyze'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Connected Sources List */}
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Connected Sources ({sources.length})</h3>
      {sources.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No data sources yet.
        </div>
      ) : (
        <div className="results-section">
          {sources.map((src) => (
            <div key={src._id} className="result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="result-field">
                  <span className="field-label">Name</span>
                  <span className="field-value">{src.name}</span>
                </div>
                {isAdmin && (
                  <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleDelete(src._id)}>
                    Delete
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{src.type}</span>
                <span className="badge badge-success">Connected</span>
              </div>
              {src.schemaCache && (
                <div className="result-field">
                  <span className="field-label">Tables / Collections</span>
                  <span className="field-value" style={{ fontSize: '0.85rem' }}>
                    {Object.keys(src.schemaCache).join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
