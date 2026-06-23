'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [firmName, setFirmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push('/login');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>Register Your Firm</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create an admin account for your organization</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label className="field-label">Firm Name</label>
              <input type="text" className="form-input" value={firmName} onChange={(e) => setFirmName(e.target.value)} required placeholder="Acme Corp" />
            </div>

            <div className="form-group">
              <label className="field-label">Admin Email</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@firm.com" />
            </div>

            <div className="form-group">
              <label className="field-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
