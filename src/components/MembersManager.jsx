import React, { useState, useEffect } from 'react';

// Real API endpoints used:
// /api/overview/${guild}/members  → members[]{id, username, global_name, avatar, roles[], joinedAt, bot, flags}
// /api/overview/${guild}/guild-info → {name, memberCount, channelCount, icon}
// /api/moderation/${guild}/cases  → for infraction count per user
// /api/moderation/${guild}/warnings → for warning count per user

function avatarUrl(userId, avatar) {
  if (avatar) return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64`;
  try {
    const def = Number(BigInt(userId || '0') >> 22n) % 6;
    return `https://cdn.discordapp.com/embed/avatars/${Math.abs(def)}.png`;
  } catch { return 'https://cdn.discordapp.com/embed/avatars/0.png'; }
}

function relTime(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 30)   return `${d}j ago`;
  return new Date(iso).toLocaleDateString();
}

const ROLE_COLORS = ['#ff66b2','#33b5e5','#00C851','#ffbb33','#aa66cc','#ff8800','#10b981'];
function roleColor(role) {
  let h = 0;
  for (let i = 0; i < role.length; i++) h = role.charCodeAt(i) + ((h << 5) - h);
  return ROLE_COLORS[Math.abs(h) % ROLE_COLORS.length];
}

const PER_PAGE = 15;

export default function MembersManager({ selectedGuild }) {
  const [members, setMembers]       = useState([]);
  const [guildInfo, setGuildInfo]   = useState(null);
  const [infractions, setInfractions] = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy]         = useState('join-desc');
  const [selected, setSelected]     = useState(null);
  const [page, setPage]             = useState(1);

  useEffect(() => {
    if (selectedGuild) fetchAll();
  }, [selectedGuild]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const token   = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [mRes, gRes, cRes, wRes] = await Promise.allSettled([
        fetch(`/api/overview/${selectedGuild}/members`,    { headers }),
        fetch(`/api/overview/${selectedGuild}/guild-info`, { headers }),
        fetch(`/api/moderation/${selectedGuild}/cases`,    { headers }),
        fetch(`/api/moderation/${selectedGuild}/warnings`, { headers }),
      ]);

      // Members
      if (mRes.status === 'fulfilled' && mRes.value.ok) {
        setMembers(await mRes.value.json());
      } else {
        setError('Endpoint /api/overview/' + selectedGuild + '/members non disponible.');
        setMembers([]);
      }

      // Guild info
      if (gRes.status === 'fulfilled' && gRes.value.ok) setGuildInfo(await gRes.value.json());

      // Build infraction map from cases + warnings
      const infMap = {};
      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const cases = await cRes.value.json();
        cases.forEach(c => {
          if (c.targetId) infMap[c.targetId] = (infMap[c.targetId] || 0) + 1;
        });
      }
      if (wRes.status === 'fulfilled' && wRes.value.ok) {
        const warns = await wRes.value.json();
        warns.forEach(w => {
          if (w.userId) infMap[w.userId] = (infMap[w.userId] || 0) + 1;
        });
      }
      setInfractions(infMap);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Derived
  const enriched = members.map(m => ({
    ...m,
    infractions: infractions[m.id] || 0,
  }));

  const allRoles = [...new Set(enriched.flatMap(m => m.roles || []))].sort();

  const filtered = enriched
    .filter(m => {
      const q = search.toLowerCase();
      return (
        (!q || (m.username||'').toLowerCase().includes(q) || (m.global_name||'').toLowerCase().includes(q) || (m.id||'').includes(q)) &&
        (roleFilter === 'all' || (m.roles||[]).includes(roleFilter))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'join')          return new Date(a.joinedAt) - new Date(b.joinedAt);
      if (sortBy === 'join-desc')     return new Date(b.joinedAt) - new Date(a.joinedAt);
      if (sortBy === 'name')          return (a.username||'').localeCompare(b.username||'');
      if (sortBy === 'infractions')   return b.infractions - a.infractions;
      return 0;
    });

  const pages     = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total:        enriched.length,
    bots:         enriched.filter(m => m.bot).length,
    infractioned: enriched.filter(m => m.infractions > 0).length,
    uniqueRoles:  allRoles.length,
  };

  return (
    <div className="ov-container animate-fade-in">
      {/* Header */}
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text">
            <i className="fa-solid fa-users"></i> Members Manager
            {guildInfo?.name && <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '10px', verticalAlign: 'middle' }}>{guildInfo.name}</span>}
          </h2>
          <p className="subtitle">
            {guildInfo?.memberCount
              ? `${guildInfo.memberCount.toLocaleString()} membres enregistrés sur ce serveur.`
              : 'Gérez les membres et consultez leurs infractions.'}
          </p>
        </div>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={fetchAll}>
          <i className="fa-solid fa-rotate-right"></i> Rafraîchir
        </button>
      </div>

      {/* KPI */}
      <div className="ov-stats-grid" style={{ marginBottom: '16px' }}>
        {[
          { icon: 'fa-solid fa-users',        label: 'Membres chargés',   value: stats.total,        color: '#33b5e5', bg: 'rgba(51,181,229,0.12)' },
          { icon: 'fa-solid fa-robot',         label: 'Bots',              value: stats.bots,         color: '#aa66cc', bg: 'rgba(170,102,204,0.12)' },
          { icon: 'fa-solid fa-exclamation',   label: 'Avec infractions',  value: stats.infractioned, color: '#ff4444', bg: 'rgba(255,68,68,0.12)' },
          { icon: 'fa-solid fa-tag',           label: 'Rôles distincts',   value: stats.uniqueRoles,  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
        ].map((s, i) => (
          <div key={s.label} className="glass-panel ov-stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="ov-stat-icon" style={{ background: s.bg, color: s.color }}><i className={s.icon}></i></div>
            <div className="ov-stat-info">
              <span className="ov-stat-label">{s.label}</span>
              <span className="ov-stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}></i>
          <input
            type="text" placeholder="Rechercher un membre (nom, ID)…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px 8px 32px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}>
          <option value="all">Tous les rôles</option>
          {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}>
          <option value="join-desc">Rejoins récemment</option>
          <option value="join">Rejoins anciennement</option>
          <option value="name">Nom A → Z</option>
          <option value="infractions">Infractions ↓</option>
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* States */}
      {loading && <div className="loader">Chargement des membres…</div>}

      {!loading && error && (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderLeft: '3px solid #ffbb33' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', color: '#ffbb33', marginBottom: '12px', display: 'block' }}></i>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
          <button className="btn-secondary" onClick={fetchAll}><i className="fa-solid fa-rotate-right"></i> Réessayer</button>
        </div>
      )}

      {!loading && !error && enriched.length === 0 && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <i className="fa-solid fa-users-slash" style={{ fontSize: '2.5rem', opacity: 0.2, display: 'block', marginBottom: '12px' }}></i>
          <p>Aucun membre trouvé pour ce serveur.</p>
        </div>
      )}

      {!loading && !error && enriched.length > 0 && (
        <>
          {/* Members table */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: '40%' }}>Membre</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Rôles</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Rejoint</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Infractions</th>
                    <th style={{ padding: '12px 8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(m => (
                    <tr
                      key={m.id}
                      data-testid="member-row"
                      onClick={() => setSelected(selected?.id === m.id ? null : m)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: selected?.id === m.id ? 'rgba(255,102,178,0.06)' : 'transparent',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                    >
                      {/* Avatar + name */}
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={avatarUrl(m.id, m.avatar)} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {m.global_name || m.username}
                              {m.bot && <span style={{ fontSize: '0.6rem', background: '#5865F2', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>BOT</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>@{m.username}</div>
                          </div>
                        </div>
                      </td>
                      {/* Roles */}
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(m.roles || []).slice(0, 3).map(r => (
                            <span key={r} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '10px', background: `${roleColor(r)}18`, color: roleColor(r), border: `1px solid ${roleColor(r)}40` }}>
                              {r}
                            </span>
                          ))}
                          {(m.roles || []).length > 3 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>+{m.roles.length - 3}</span>
                          )}
                          {(!m.roles || m.roles.length === 0) && (
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Aucun</span>
                          )}
                        </div>
                      </td>
                      {/* Joined */}
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {relTime(m.joinedAt)}
                      </td>
                      {/* Infractions */}
                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                        {m.infractions > 0 ? (
                          <span style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444', padding: '3px 10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.8rem' }}>
                            ⚠ {m.infractions}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      {/* Expand */}
                      <td style={{ padding: '11px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <i className={`fa-solid fa-chevron-${selected?.id === m.id ? 'up' : 'down'}`} style={{ fontSize: '0.7rem' }}></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>…</span>
                  ) : (
                    <button key={p} className={p === page ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem', padding: '5px 12px', minWidth: '36px' }} onClick={() => setPage(p)}>{p}</button>
                  )
                )}
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                Page {page}/{pages} — {filtered.length} membres
              </span>
            </div>
          )}

          {/* Detail panel */}
          {selected && (
            <div className="glass-panel animate-fade-in" style={{ borderLeft: '3px solid var(--premium-pink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={avatarUrl(selected.id, selected.avatar)} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--premium-pink)' }} />
                  <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selected.global_name || selected.username}
                      {selected.bot && <span style={{ fontSize: '0.65rem', background: '#5865F2', color: '#fff', padding: '2px 7px', borderRadius: '4px' }}>BOT</span>}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>@{selected.username}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>{selected.id}</div>
                  </div>
                </div>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => setSelected(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Nom d\'affichage', value: selected.global_name || selected.username },
                  { label: 'Username',          value: `@${selected.username}` },
                  { label: 'Discord ID',        value: selected.id },
                  { label: 'Rejoint le',        value: selected.joinedAt ? new Date(selected.joinedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                  { label: 'Infractions',       value: selected.infractions || 0, highlight: selected.infractions > 0 },
                  { label: 'Bot',               value: selected.bot ? 'Oui' : 'Non' },
                ].map(f => (
                  <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: f.highlight ? '#ff4444' : '#fff', wordBreak: 'break-all' }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {selected.roles?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rôles ({selected.roles.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selected.roles.map(r => (
                      <span key={r} style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '12px', background: `${roleColor(r)}18`, color: roleColor(r), border: `1px solid ${roleColor(r)}40`, fontWeight: '500' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`@media(max-width:768px){table td:nth-child(2),table th:nth-child(2){display:none}}`}</style>
    </div>
  );
}
