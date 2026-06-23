import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-hero">
      <div style={{ marginBottom: '1rem' }}>
        <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '0.3rem 1rem' }}>
          ✨ Multi-Database AI Query Engine
        </span>
      </div>

      <h1 className="title" style={{ fontSize: '3.5rem', maxWidth: '700px' }}>
        Query Any Database Using Plain English
      </h1>
      <p className="subtitle" style={{ fontSize: '1.2rem', maxWidth: '550px', margin: '1rem auto 0' }}>
        Connect MongoDB, MySQL, PostgreSQL, or upload CSV/Excel files. Ask questions in natural language, get instant results with charts and explanations.
      </p>

      <div className="landing-cta">
        <Link href="/login" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textDecoration: 'none' }}>
          Login →
        </Link>
        <Link href="/register" className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textDecoration: 'none' }}>
          Register Firm
        </Link>
      </div>

      <div className="features-grid">
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🗄️</div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Multi-Database</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            MongoDB, MySQL, PostgreSQL, CSV, and Excel support out of the box.
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🧠</div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>AI-Powered</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Gemini AI translates your questions into optimized database queries automatically.
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🔐</div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Enterprise Secure</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Multi-tenant isolation, RBAC, audit logs, and query safety validation.
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>📊</div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Auto Visualization</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            AI suggests the best chart type. Switch between table and chart views instantly.
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>💬</div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Chat Mode</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Refine queries in a multi-turn conversation. Context is preserved between turns.
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>✏️</div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Edit & Re-run</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Inspect the generated query, edit it manually, and re-run. Full control.
          </p>
        </div>
      </div>
    </div>
  );
}
