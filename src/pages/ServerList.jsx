import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function iconUrl(guild) {
  if (guild.icon) return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  return null;
}

function initials(name) {
  return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '#';
}

// Deterministic color per guild id
const PALETTE = ['#ff66b2','#5865F2','#10b981','#f59e0b','#33b5e5','#aa66cc','#ff8800','#ef4444'];
function guildColor(id) {
  let h = 0;
  for (let i = 0; i < (id || '').length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export default function ServerList({ onSelectGuild, user }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState(null);

  const guilds = user?.allowedGuilds || [];
  const filtered = guilds.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search)
  );

  const handleLogout = () => {
    localStorage.removeItem('zenith_token');
    localStorage.removeItem('zenith_guild_id');
    navigate('/login');
  };

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png?size=64`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary, #080911)',
      color: '#fff', fontFamily: 'Inter, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,102,178,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(88,101,242,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Top nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,9,17,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#5865F2,#ff66b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: '900', fontSize: '1rem', color: '#fff' }}>Z</span>
            </div>
            <span style={{ fontWeight: '800', fontSize: '1.1rem', background: 'linear-gradient(135deg,#fff 30%,#ff66b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              zyntra
            </span>
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              {user?.global_name || user?.username}
            </span>
            <img src={avatarUrl} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: '0.7rem' }}></i> Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 32px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,102,178,0.08)', border: '1px solid rgba(255,102,178,0.2)', borderRadius: '20px', padding: '5px 14px', marginBottom: '20px' }}>
            <i className="fa-solid fa-server" style={{ color: '#ff66b2', fontSize: '0.75rem' }}></i>
            <span style={{ fontSize: '0.78rem', color: '#ff66b2', fontWeight: '600' }}>Server Selection</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', margin: '0 0 12px', lineHeight: 1.15 }}>
            Welcome back,{' '}
            <span style={{ background: 'linear-gradient(135deg,#ff66b2,#8A5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.global_name || user?.username || 'Admin'}
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', margin: 0 }}>
            Select a server to open its moderation dashboard.
            {guilds.length > 0 && <span style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.25)' }}>· {guilds.length} server{guilds.length !== 1 ? 's' : ''} available</span>}
          </p>
        </div>

        {/* Search */}
        {guilds.length > 3 && (
          <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '32px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}></i>
            <input
              type="text"
              placeholder="Search servers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px 11px 40px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', color: '#fff', fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,102,178,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.25)' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.5rem', marginBottom: '16px', display: 'block' }}></i>
            <p style={{ fontSize: '1rem' }}>No servers match "{search}"</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map(g => {
              const color  = guildColor(g.id);
              const icon   = iconUrl(g);
              const isHov  = hovered === g.id;

              return (
                <button
                  key={g.id}
                  onClick={() => onSelectGuild(g.id)}
                  onMouseEnter={() => setHovered(g.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isHov ? color + '55' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s',
                    transform: isHov ? 'translateY(-3px)' : 'none',
                    boxShadow: isHov ? `0 12px 32px ${color}18` : 'none',
                    display: 'flex', flexDirection: 'column', gap: '16px',
                    color: '#fff',
                  }}
                >
                  {/* Top row: icon + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {icon ? (
                      <img
                        src={icon} alt={g.name}
                        style={{ width: '54px', height: '54px', borderRadius: '14px', flexShrink: 0, objectFit: 'cover', border: `2px solid ${color}33` }}
                      />
                    ) : (
                      <div style={{
                        width: '54px', height: '54px', borderRadius: '14px', flexShrink: 0,
                        background: `linear-gradient(135deg, ${color}33, ${color}11)`,
                        border: `2px solid ${color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '800', fontSize: '1.1rem', color,
                      }}>
                        {initials(g.name)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '3px', fontFamily: 'monospace' }}>{g.id}</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                  {/* Bottom row: CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {g.owner && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '8px', background: `${color}18`, color, border: `1px solid ${color}33`, fontWeight: '600' }}>
                          Owner
                        </span>
                      )}
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                        Admin
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '0.8rem', fontWeight: '600',
                      color: isHov ? color : 'rgba(255,255,255,0.35)',
                      transition: 'color 0.2s',
                    }}>
                      Open dashboard
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem', transform: isHov ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }}></i>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer links */}
        <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} zyntra
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['/', 'Home'], ['/tos', 'Terms'], ['/privacy', 'Privacy']].map(([path, label]) => (
              <button key={path} onClick={() => navigate(path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.78rem' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
