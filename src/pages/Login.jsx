import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FEATURES = [
  { icon: 'fa-solid fa-shield-halved', text: 'AI-powered auto moderation' },
  { icon: 'fa-solid fa-chart-line',    text: 'Real-time analytics & insights' },
  { icon: 'fa-solid fa-gavel',         text: 'Full case & warning management' },
  { icon: 'fa-solid fa-bell',          text: 'Instant moderation alerts' },
  { icon: 'fa-solid fa-users',         text: 'Member history & infractions' },
  { icon: 'fa-solid fa-terminal',      text: 'Complete command catalog' },
];

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [status, setStatus]     = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [dots, setDots]         = useState('');

  // Animated dots for loading state
  useEffect(() => {
    if (status !== 'loading' && status !== 'success') return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, [status]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token  = params.get('token');
    const error  = params.get('error');

    if (token) {
      setStatus('loading');
      localStorage.setItem('zenith_token', token);
      localStorage.removeItem('zenith_guild_id');
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 800);
      }, 1000);
    } else if (error) {
      setStatus('error');
      setErrorMsg(decodeURIComponent(error).replace(/_/g, ' '));
    }
  }, [location, navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary, #080911)',
      fontFamily: 'Inter, sans-serif', color: '#fff',
      overflow: 'hidden', position: 'relative',
    }}>

      {/* Ambient background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%',  width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(88,101,242,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,102,178,0.10) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '40%',  width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,92,246,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', position: 'relative', zIndex: 1,
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }} className="login-left-panel">

        {/* Logo */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #5865F2, #ff66b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(88,101,242,0.4)',
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff' }}>Z</span>
            </div>
            <span style={{
              fontSize: '1.8rem', fontWeight: '800', letterSpacing: '2px',
              background: 'linear-gradient(135deg, #fff 30%, #ff66b2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>zyntra</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            AI Moderation Platform
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: '800', lineHeight: 1.2, marginBottom: '20px', maxWidth: '480px' }}>
          Your server.<br />
          <span style={{ background: 'linear-gradient(135deg, #ff66b2, #8A5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fully protected.
          </span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '420px', marginBottom: '40px' }}>
          Sign in with Discord to access your personalized moderation dashboard with real-time data, smart automation, and deep analytics.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.85 }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,102,178,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={f.icon} style={{ color: '#ff66b2', fontSize: '0.75rem' }}></i>
              </div>
              <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Back to home */}
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '48px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, width: 'fit-content' }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Back to home
        </button>
      </div>

      {/* Right panel — login card */}
      <div style={{
        width: 'clamp(380px, 40%, 520px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 48px',
        position: 'relative', zIndex: 1, flexShrink: 0,
      }} className="login-right-panel">

        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '40px 36px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }}>

            {/* State: idle → show login button */}
            {!status && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  {/* Discord icon */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(88,101,242,0.2), rgba(88,101,242,0.05))',
                    border: '1px solid rgba(88,101,242,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 32px rgba(88,101,242,0.2)',
                  }}>
                    <i className="fa-brands fa-discord" style={{ fontSize: '2rem', color: '#5865F2' }}></i>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 8px' }}>Welcome back</h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', margin: 0 }}>
                    Sign in with your Discord account to continue.
                  </p>
                </div>

                {/* Login button */}
                <a
                  href="/api/auth/login"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    background: '#5865F2', color: '#fff', textDecoration: 'none',
                    padding: '14px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem',
                    transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(88,101,242,0.35)',
                    border: 'none', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(88,101,242,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(88,101,242,0.35)'; }}
                >
                  <i className="fa-brands fa-discord" style={{ fontSize: '1.1rem' }}></i>
                  Continue with Discord
                </a>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>

                {/* Home button */}
                <button
                  onClick={() => navigate('/')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)', padding: '12px 24px', borderRadius: '12px',
                    fontWeight: '500', fontSize: '0.88rem', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  <i className="fa-solid fa-house" style={{ fontSize: '0.8rem' }}></i>
                  Back to home
                </button>
              </>
            )}

            {/* State: loading */}
            {status === 'loading' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 24px',
                  border: '3px solid rgba(255,102,178,0.15)',
                  borderTopColor: '#ff66b2',
                  animation: 'loginSpin 0.8s linear infinite',
                }} />
                <h3 style={{ fontWeight: '700', margin: '0 0 8px' }}>Authenticating{dots}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', margin: 0 }}>Verifying your Discord account</p>
              </div>
            )}

            {/* State: success */}
            {status === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 24px',
                  background: 'rgba(0,200,81,0.12)', border: '2px solid rgba(0,200,81,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 32px rgba(0,200,81,0.2)',
                }}>
                  <i className="fa-solid fa-check" style={{ color: '#00C851', fontSize: '1.5rem' }}></i>
                </div>
                <h3 style={{ fontWeight: '700', margin: '0 0 8px', color: '#00C851' }}>Authenticated!</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', margin: 0 }}>Redirecting to dashboard{dots}</p>
              </div>
            )}

            {/* State: error */}
            {status === 'error' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 24px',
                  background: 'rgba(255,68,68,0.12)', border: '2px solid rgba(255,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 32px rgba(255,68,68,0.2)',
                }}>
                  <i className="fa-solid fa-xmark" style={{ color: '#ff4444', fontSize: '1.5rem' }}></i>
                </div>
                <h3 style={{ fontWeight: '700', margin: '0 0 8px', color: '#ff4444' }}>Authentication failed</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', margin: '0 0 28px', textTransform: 'capitalize' }}>
                  {errorMsg || 'Something went wrong. Please try again.'}
                </p>
                <a href="/api/auth/login" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#5865F2', color: '#fff', textDecoration: 'none',
                  padding: '12px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '0.9rem',
                  marginBottom: '10px',
                }}>
                  <i className="fa-brands fa-discord"></i> Try again
                </a>
                <button onClick={() => navigate('/')} style={{
                  width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', padding: '11px', borderRadius: '12px',
                  cursor: 'pointer', fontSize: '0.85rem',
                }}>
                  Back to home
                </button>
              </div>
            )}
          </div>

          {/* Legal links */}
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginTop: '20px', lineHeight: 1.6 }}>
            By signing in, you agree to our{' '}
            <span onClick={() => navigate('/tos')} style={{ color: 'rgba(255,255,255,0.45)', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</span>
            {' '}and{' '}
            <span onClick={() => navigate('/privacy')} style={{ color: 'rgba(255,255,255,0.45)', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; max-width: 100% !important; padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}
