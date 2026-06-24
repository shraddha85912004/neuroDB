'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle, Eye, Wrench, UserPlus } from 'lucide-react';

export default function TeamSettings() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/team')
      .then(res => res.json())
      .then(data => {
        if (data.members) setMembers(data.members);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user');

      setSuccess(`User ${email} added as ${role}.`);
      setEmail('');
      setPassword('');
      
      // Re-fetch members
      const membersRes = await fetch('/api/team');
      const membersData = await membersRes.json();
      if (membersData.members) setMembers(membersData.members);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Team Settings</h1>
      <p className="page-subtitle">Manage users in your firm. Add colleagues as Viewers (query only) or Admins (full access).</p>

      {/* Add User Form */}
      <div className="card" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add Team Member</h3>
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div className="error-message">{error}</div>}
          {success && <div style={{ background: 'rgba(80, 250, 123, 0.08)', border: '1px solid rgba(80, 250, 123, 0.2)', color: 'var(--success)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /> {success}</div>}

          <div className="form-group">
            <label className="field-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="colleague@firm.com" />
          </div>

          <div className="form-group">
            <label className="field-label">Temporary Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Set a password for them" />
          </div>

          <div className="form-group">
            <label className="field-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="viewer">Viewer — Can query data</option>
              <option value="admin">Admin — Can manage sources & team</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={adding} style={{ borderRadius: 'var(--radius-sm)' }}>
            {adding ? 'Adding...' : <><UserPlus size={16} /> Add User</>}
          </button>
        </form>
      </div>

      {/* Members List */}
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Team Members ({members.length})</h3>
      <div className="results-section">
        {members.map((u, i) => (
          <div key={i} className="result-card">
            <div className="result-field">
              <span className="field-label">Email</span>
              <span className="field-value">{u.email}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`} style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {u.role === 'admin' ? <Wrench size={12} /> : <Eye size={12} />} {u.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
