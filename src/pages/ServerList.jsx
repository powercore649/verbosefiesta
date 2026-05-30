import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Fetches real guild data from:
//   /api/account/guilds      → [{id, name, icon, owner, permissions}]
//   /api/overview/{id}/guild-info → {memberCount, channelCount, boostLevel, roleCount, …}
// Falls back to JWT allowedGuilds if API fails.

function iconUrl(guild) {
  if (guild.icon) return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  return null;
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '#';
}

const PALETTE = ['#ff66b2','#5865F2','#10b981','#f59e0b','#33b5e5','#aa66cc','#ff8800','#ef4444'];
function guildColor(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function fmt(n) {
  if (!n) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ServerList({ onSelectGuild, user }) {
  const navigate = useNavigate();

  const [guilds, setGuilds]         = useState([]);
  const [guildInfos, setGuildInfos] = useState({});   // id → guild-info data
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [hovered, setHovered]       = useState(null);

  const token   = localStorage.getItem('zenith_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchGuilds(); }, []);

  const fetchGuilds = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try real API first
      const res = await fetch('/api/account/guilds', { headers });
      if (res.ok) {
        const data = await res.json();
        setGuilds(Array.isArray(data) ? data : user?.allowedGuilds || []);
      } else {
        // Fallback to JWT
        setGuilds(user?.allowedGuilds || []);
      }
    } catch {
      setGuilds(user?.allowedGuilds || []);
    } finally {
      setLoading(false);
    }
  };

  // Fetch guild-info for each guild (member count, boost, etc.)
  useEffect(() => {
    if (!guilds.length) return;
    guilds.forEach(async g => {
      try {
        const res = await fetch(`/api/overview/${g.id}/guild-info`, { headers });
        if (res.ok) {
          const info = await res.json();
          setGuildInfos(prev => ({ ...prev, [g.id]: info }));
        }
      } catch { /* silently skip */ }
    });
  }, [guilds]);

  const filtered = guilds.filter(g =>
    !search ||
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.id?.includes(search)
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

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,9,17,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#5865F2,#ff66b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: '900', fontSize: '1rem', color: '#fff' }}>Z</span>
            </div>
            <span style={{ fontWeight: '800', fontSize: '1.1rem', background: 'linear-gradient(135deg,#fff 30%,#ff66b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>zyntra</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{user?.global_name || user?.username}</span>
            <img src={avatarUrl} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
            <button onClick={fetchGuilds} title="Refresh" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem' }}>
              <i className="fa-solid fa-rotate-right"></i>
            </button>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: '0.7rem' }}></i> Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
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
            {guilds.length > 0 && (
              <span style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.25)' }}>
                · {guilds.length} server{guilds.length !== 1 ? 's' : ''} available
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        {guilds.length > 3 && (
          <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '32px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}></i>
            <input
              type="text" placeholder="Search servers…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,102,178,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', height: '140px', animation: 'shimmer 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            ))}
            <style>{`@keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
            <i className="fa-solid fa-circle-exclamation" style={{ color: '#ff4444', marginBottom: '8px', display: 'block', fontSize: '1.5rem' }}></i>
            {error} — showing servers from your session.
          </div>
        )}

        {/* Empty search */}
        {!loading && filtered.length === 0 && guilds.length > 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.25)' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.5rem', marginBottom: '16px', display: 'block' }}></i>
            <p>No servers match "<strong>{search}</strong>"</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map(g => {
              const color   = guildColor(g.id);
              const icon    = iconUrl(g);
              const isHov   = hovered === g.id;
              const info    = guildInfos[g.id];

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
                    display: 'flex', flexDirection: 'column', gap: '16px', color: '#fff',
                  }}
                >
                  {/* Icon + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {icon ? (
                      <img src={icon} alt={g.name} style={{ width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0, objectFit: 'cover', border: `2px solid ${color}33` }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0, background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `2px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', color }}>
                        {initials(g.name)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '3px', fontFamily: 'monospace' }}>{g.id}</div>
                    </div>
                  </div>

                  {/* Real stats from guild-info API */}
                  {info && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {info.memberCount && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-users" style={{ color, fontSize: '0.65rem' }}></i>
                          {fmt(info.memberCount)} members
                        </span>
                      )}
                      {info.channelCount && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-hashtag" style={{ color, fontSize: '0.65rem' }}></i>
                          {info.channelCount} channels
                        </span>
                      )}
                      {info.boostLevel > 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#aa66cc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-rocket" style={{ fontSize: '0.65rem' }}></i>
                          Level {info.boostLevel}
                        </span>
                      )}
                      {info.roleCount && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-tag" style={{ color, fontSize: '0.65rem' }}></i>
                          {info.roleCount} roles
                        </span>
                      )}
                    </div>
                  )}

                  {/* Loading info shimmer */}
                  {!info && (
                    <div style={{ height: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.5s ease-in-out infinite', width: '70%' }} />
                  )}

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                  {/* Bottom row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {g.owner && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '8px', background: `${color}18`, color, border: `1px solid ${color}33`, fontWeight: '600' }}>
                          <i className="fa-solid fa-crown" style={{ fontSize: '0.6rem', marginRight: '3px' }}></i>Owner
                        </span>
                      )}
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                        Admin
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', color: isHov ? color : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>
                      Open dashboard
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem', transform: isHov ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }}></i>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} zyntra</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['/', 'Home'], ['/tos', 'Terms'], ['/privacy', 'Privacy']].map(([path, label]) => (
              <button key={path} onClick={() => navigate(path)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.78rem' }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
