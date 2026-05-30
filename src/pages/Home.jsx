import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Auto Moderation',
    desc: 'AI-powered filters that detect spam, raids, and toxic content before they spread.',
    gradient: 'linear-gradient(135deg, #5865F2, #8A5CF6)'
  },
  {
    icon: 'fa-solid fa-gavel',
    title: 'Case Management',
    desc: 'Full moderation history with cases, warnings, and appeals — all in one place.',
    gradient: 'linear-gradient(135deg, #ff66b2, #d4418e)'
  },
  {
    icon: 'fa-solid fa-chart-pie',
    title: 'Live Analytics',
    desc: 'Real-time charts & insights on server activity, member growth, and mod actions.',
    gradient: 'linear-gradient(135deg, #63b3ff, #00A8FC)'
  },
  {
    icon: 'fa-solid fa-terminal',
    title: 'Command Center',
    desc: 'Browse, search, and document every bot command with a powerful catalog UI.',
    gradient: 'linear-gradient(135deg, #10b981, #059669)'
  },
  {
    icon: 'fa-solid fa-user-shield',
    title: 'Account Manager',
    desc: 'View and manage your Discord profile, linked servers, and session info.',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
  },
  {
    icon: 'fa-solid fa-signal',
    title: 'Status Page',
    desc: 'Monitor bot uptime, ping, and service health at a glance.',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
  }
];

const STATS = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Avg Latency' },
  { value: '24/7', label: 'Monitoring' },
  { value: '∞', label: 'Scalability' }
];

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const token = localStorage.getItem('zenith_token');
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        return payload;
      }
    }
    return null;
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClick = () => setProfileMenuOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [profileMenuOpen]);

  const avatarUrl = loggedInUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${loggedInUser.userId}/${loggedInUser.avatar}.png?size=64`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const handleLogout = () => {
    localStorage.removeItem('zenith_token');
    localStorage.removeItem('zenith_guild_id');
    setLoggedInUser(null);
  };

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="home-nav" style={{
        background: scrollY > 50 ? 'rgba(8, 9, 17, 0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent'
      }}>
        <div className="home-nav-inner">
          <div className="home-nav-brand">
            <span className="home-nav-logo">Z</span>
            <span className="brand-text-glow" style={{ fontSize: '1.4rem' }}>zyntra</span>
          </div>
          <div className="home-nav-links">
            <a href="#features">Features</a>
            <a href="#stats">Performance</a>
            {loggedInUser ? (
              <>
                <button className="btn-discord home-nav-cta" onClick={() => navigate('/dashboard')} style={{ border: 'none', cursor: 'pointer' }}>
                  <i className="fa-solid fa-gauge-high"></i> Dashboard
                </button>
                <div className="home-profile-widget" onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(!profileMenuOpen); }}>
                  <img src={avatarUrl} alt="Profile" className="home-profile-avatar" />
                  <div className={`home-profile-dropdown ${profileMenuOpen ? 'active' : ''}`}>
                    <div className="home-profile-dropdown-header">
                      <img src={avatarUrl} alt="" className="home-profile-dropdown-avatar" />
                      <div>
                        <span className="home-profile-dropdown-name">{loggedInUser.global_name || loggedInUser.username}</span>
                        <span className="home-profile-dropdown-tag">@{loggedInUser.username}</span>
                      </div>
                    </div>
                    <div className="home-profile-dropdown-divider" />
                    <button className="home-profile-dropdown-item" onClick={() => navigate('/dashboard')}>
                      <i className="fa-solid fa-gauge-high"></i> Dashboard
                    </button>
                    <button className="home-profile-dropdown-item" onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket"></i> Log Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <a href="/api/auth/login" className="btn-discord home-nav-cta">
                <i className="fa-brands fa-discord"></i> Login
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-glow" />
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <i className="fa-solid fa-bolt"></i>
            <span>AI-Powered Discord Moderation</span>
          </div>
          <h1 className="home-hero-title">
            Protect your server.<br />
            <span className="home-hero-accent">Empower your community.</span>
          </h1>
          <p className="home-hero-subtitle">
            zyntra is the all-in-one moderation platform for Discord — smart automation,
            deep analytics, and a beautiful dashboard built for teams that care.
          </p>
          <div className="home-hero-actions">
            {loggedInUser ? (
              <button className="btn-primary home-hero-btn" onClick={() => navigate('/dashboard')} style={{ border: 'none', cursor: 'pointer' }}>
                <i className="fa-solid fa-gauge-high"></i> Go to Dashboard
              </button>
            ) : (
              <a href="/api/auth/login" className="btn-primary home-hero-btn">
                <i className="fa-brands fa-discord"></i> Get Started with Discord
              </a>
            )}
            <a href="#features" className="btn-secondary home-hero-btn-alt">
              Explore Features <i className="fa-solid fa-arrow-down"></i>
            </a>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-mockup">
            <div className="home-mockup-bar">
              <span className="home-dot red" />
              <span className="home-dot yellow" />
              <span className="home-dot green" />
              <span className="home-mockup-title">zyntra Dashboard</span>
            </div>
            <div className="home-mockup-body">
              <div className="home-mockup-sidebar">
                <div className="home-mockup-nav-item active"><i className="fa-solid fa-chart-pie"></i></div>
                <div className="home-mockup-nav-item"><i className="fa-solid fa-gavel"></i></div>
                <div className="home-mockup-nav-item"><i className="fa-solid fa-shield-halved"></i></div>
                <div className="home-mockup-nav-item"><i className="fa-solid fa-terminal"></i></div>
              </div>
              <div className="home-mockup-content">
                <div className="home-mockup-stat-row">
                  <div className="home-mockup-stat"><span>128</span><small>Servers</small></div>
                  <div className="home-mockup-stat"><span>54K</span><small>Users</small></div>
                  <div className="home-mockup-stat"><span>99.9%</span><small>Uptime</small></div>
                </div>
                <div className="home-mockup-chart">
                  <svg viewBox="0 0 200 60" className="home-chart-svg">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,102,178,0.4)" />
                        <stop offset="100%" stopColor="rgba(255,102,178,0)" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 Q25,45 50,35 T100,20 T150,30 T200,10" fill="none" stroke="#ff66b2" strokeWidth="2" />
                    <path d="M0,50 Q25,45 50,35 T100,20 T150,30 T200,10 L200,60 L0,60 Z" fill="url(#chartGrad)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="home-stats" id="stats">
        <div className="home-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="home-stat-card">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="home-features" id="features">
        <div className="home-features-header">
          <span className="home-section-badge">Features</span>
          <h2>Everything your server needs</h2>
          <p>From AI-powered moderation to live analytics — one platform, zero compromises.</p>
        </div>
        <div className="home-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="home-feature-card glass-panel">
              <div className="home-feature-icon" style={{ background: f.gradient }}>
                <i className={f.icon}></i>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="home-cta-inner glass-panel">
          <h2>Ready to level up your server?</h2>
          <p>Join thousands of communities already using zyntra for safer, smarter moderation.</p>
          {loggedInUser ? (
            <button className="btn-primary home-hero-btn" onClick={() => navigate('/dashboard')} style={{ border: 'none', cursor: 'pointer' }}>
              <i className="fa-solid fa-gauge-high"></i> Open Dashboard
            </button>
          ) : (
            <a href="/api/auth/login" className="btn-primary home-hero-btn">
              <i className="fa-brands fa-discord"></i> Login with Discord
            </a>
          )}
        </div>
      </section>

      {/* Quick Shortcuts */}
      <section style={{ padding: '60px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="home-section-badge">Quick Access</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '14px 0 8px' }}>Everything in one click</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>Jump straight to what you need.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {[
            { icon: 'fa-solid fa-gauge-high',       label: 'Dashboard',        sub: 'Your control center',       path: '/dashboard',            color: '#ff66b2', grad: 'rgba(255,102,178,0.12)' },
            { icon: 'fa-solid fa-chart-line',        label: 'Analytics',        sub: 'Stats & insights',          path: '/dashboard',            color: '#33b5e5', grad: 'rgba(51,181,229,0.12)'  },
            { icon: 'fa-solid fa-gavel',             label: 'Moderation',       sub: 'Cases & warnings',          path: '/dashboard',            color: '#ffbb33', grad: 'rgba(255,187,51,0.12)'  },
            { icon: 'fa-solid fa-shield-halved',     label: 'Auto Moderation',  sub: 'Smart filters',             path: '/dashboard',            color: '#00C851', grad: 'rgba(0,200,81,0.12)'    },
            { icon: 'fa-solid fa-terminal',          label: 'Command Center',   sub: 'Bot commands catalog',      path: '/dashboard',            color: '#aa66cc', grad: 'rgba(170,102,204,0.12)' },
            { icon: 'fa-solid fa-users',             label: 'Members',          sub: 'Member management',         path: '/dashboard',            color: '#10b981', grad: 'rgba(16,185,129,0.12)'  },
            { icon: 'fa-solid fa-book',              label: 'Docs & Guides',    sub: 'Help & documentation',      path: '/dashboard',            color: '#f59e0b', grad: 'rgba(245,158,11,0.12)'  },
            { icon: 'fa-solid fa-file-contract',     label: 'Terms of Service', sub: 'Legal information',         path: '/tos',                  color: '#94a3b8', grad: 'rgba(148,163,184,0.1)'  },
            { icon: 'fa-solid fa-shield-halved',     label: 'Privacy Policy',   sub: 'How we use your data',      path: '/privacy',              color: '#94a3b8', grad: 'rgba(148,163,184,0.1)'  },
            { icon: 'fa-brands fa-discord',          label: 'Login',            sub: 'Sign in with Discord',      path: '/login',                color: '#5865F2', grad: 'rgba(88,101,242,0.12)'  },
          ].map((s, i) => (
            <button
              key={i}
              onClick={() => navigate(s.path)}
              style={{
                background: s.grad, border: `1px solid ${s.color}22`,
                borderRadius: '12px', padding: '18px 20px',
                color: '#fff', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={s.icon} style={{ color: s.color, fontSize: '1rem' }}></i>
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.sub}</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}></i>
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <span className="brand-text-glow" style={{ fontSize: '1.2rem' }}>zyntra</span>
            <p>AI Moderation Platform for Discord</p>
          </div>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>Product</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#features" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Features</a>
                <a href="#stats" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem' }}>Performance</a>
                <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }} onClick={() => navigate(loggedInUser ? '/dashboard' : '/login')}>Dashboard</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>Legal</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }} onClick={() => navigate('/tos')}>Terms of Service</span>
                <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }} onClick={() => navigate('/privacy')}>Privacy Policy</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>Account</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }} onClick={() => navigate('/login')}>Login</span>
                {loggedInUser && <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }} onClick={handleLogout}>Log Out</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="home-footer-bottom">
          <p>&copy; {new Date().getFullYear()} zyntra. All rights reserved. · <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }} onClick={() => navigate('/tos')}>Terms</span> · <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }} onClick={() => navigate('/privacy')}>Privacy</span></p>
        </div>
      </footer>
    </div>
  );
}
