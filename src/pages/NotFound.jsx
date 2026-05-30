import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const [count, setCount] = useState(10);

  useEffect(() => {
    const t = setInterval(() => setCount(c => {
      if (c <= 1) { clearInterval(t); navigate('/'); }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary, #080911)', color: '#fff',
      fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px',
    }}>
      {/* Glowing 404 */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <div style={{
          fontSize: 'clamp(80px, 20vw, 160px)', fontWeight: '900',
          background: 'linear-gradient(135deg, #ff66b2, #8A5CF6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1, userSelect: 'none',
          filter: 'drop-shadow(0 0 40px rgba(255,102,178,0.4))',
        }}>404</div>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,102,178,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      </div>

      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '12px' }}>
        Page not found
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', maxWidth: '400px', marginBottom: '36px', lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or has been moved.
        Redirecting to home in <strong style={{ color: '#ff66b2' }}>{count}s</strong>…
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #ff66b2, #d4418e)',
            border: 'none', borderRadius: '10px', padding: '12px 28px',
            color: '#fff', fontWeight: '600', fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <i className="fa-solid fa-house"></i> Go Home
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px', padding: '12px 28px',
            color: '#fff', fontWeight: '600', fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Go Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px', padding: '12px 28px',
            color: '#fff', fontWeight: '600', fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <i className="fa-solid fa-gauge-high"></i> Dashboard
        </button>
      </div>

      {/* Subtle brand */}
      <div style={{ position: 'absolute', bottom: '24px', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
        zyntra · AI Moderation Platform
      </div>
    </div>
  );
}
