import React, { useState, useEffect } from 'react';

// Strategy: /api/overview/{guild}/members does not exist on this backend.
// We build the list from real data:
//   - /api/moderation/{guild}/cases  → targetId, targetTag, moderatorTag
//   - /api/moderation/{guild}/warnings → userId
//   - /api/overview/{guild}/guild-info → memberCount, name
// Each unique user who was targeted or moderated is displayed.

function avatarUrl(userId) {
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
  if (d < 30) return `${d}j ago`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

const ACTION_COLORS = {
  BAN:    '#ff4444', WARN: '#ffbb33', MUTE: '#ff66b2',
  KICK:   '#ff8800', UNBAN: '#00C851', UNMUTE: '#33b5e5',
  PURGE:  '#aa66cc', MASSBAN: '#cc0000',
};

const PER_PAGE = 15;

export default function MembersManager({ selectedGuild, user }) {
  const [members, setMembers]       = useState([]);
  const [guildInfo, setGuildInfo]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | targets | moderators
  const [sortBy, setSortBy]         = useState('infractions');
  const [selected, setSelected]     = useState(null);
  const [page, setPage]             = useState(1);

  useEffect(() => {
    if (selectedGuild) fetchAll();
  }, [selectedGuild]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setMembers([]);

    try {
      const token   = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [cRes, wRes, gRes] = await Promise.allSettled([
        fetch(`/api/moderation/${selectedGuild}/cases`,    { headers }),
        fetch(`/api/moderation/${selectedGuild}/warnings`, { headers }),
        fetch(`/api/overview/${selectedGuild}/guild-info`, { headers }),
      ]);

      const cases    = cRes.status === 'fulfilled' && cRes.value.ok    ? await cRes.value.json()    : [];
      const warnings = wRes.status === 'fulfilled' && wRes.value.ok    ? await wRes.value.json()    : [];
      const gInfo    = gRes.status === 'fulfilled' && gRes.value.ok    ? await gRes.value.json()    : null;

      if (gInfo) setGuildInfo(gInfo);

      if (!cases.length && !warnings.length) {
        setError('No moderation data available for this server.');
        setLoading(false);
        return;
      }

      // Build member map from real cases + warnings
      const map = {}; // userId → member object

      cases.forEach(c => {
        // Target user
        if (c.targetId) {
          if (!map[c.targetId]) {
            map[c.targetId] = {
              id:          c.targetId,
              tag:         c.targetTag || c.targetId,
              username:    c.targetTag?.split('#')[0] || c.targetTag || c.targetId,
              role:        'target',
              cases:       [],
              warnings:    [],
              lastSeen:    c.timestamp,
            };
          }
          map[c.targetId].cases.push(c);
          if (!map[c.targetId].lastSeen || c.timestamp > map[c.targetId].lastSeen)
            map[c.targetId].lastSeen = c.timestamp;
        }

        // Moderator
        if (c.moderatorId && c.moderatorId !== c.targetId) {
          if (!map[c.moderatorId]) {
            map[c.moderatorId] = {
              id:          c.moderatorId,
              tag:         c.moderatorTag || c.moderatorId,
              username:    c.moderatorTag?.split('#')[0] || c.moderatorTag || c.moderatorId,
              role:        'moderator',
              cases:       [],
              warnings:    [],
              modActions:  [],
              lastSeen:    c.timestamp,
            };
          }
          if (!map[c.moderatorId].modActions) map[c.moderatorId].modActions = [];
          map[c.moderatorId].modActions.push(c);
          map[c.moderatorId].role = 'moderator';
        }
      });

      warnings.forEach(w => {
        if (w.userId) {
          if (!map[w.userId]) {
            map[w.userId] = {
              id:       w.userId,
              tag:      w.userId,
              username: w.userId,
              role:     'target',
              cases:    [],
              warnings: [],
              lastSeen: w.timestamp,
            };
          }
          map[w.userId].warnings.push(w);
          if (!map[w.userId].lastSeen || w.timestamp > map[w.userId].lastSeen)
            map[w.userId].lastSeen = w.timestamp;
        }
        if (w.moderatorId && w.moderatorId !== w.userId) {
          if (!map[w.moderatorId]) {
            map[w.moderatorId] = {
              id:         w.moderatorId,
              tag:        w.moderatorId,
              username:   w.moderatorId,
              role:       'moderator',
              cases:      [],
              warnings:   [],
              modActions: [],
              lastSeen:   w.timestamp,
            };
          }
          if (!map[w.moderatorId].modActions) map[w.moderatorId].modActions = [];
          map[w.moderatorId].modActions.push(w);
          map[w.moderatorId].role = 'moderator';
        }
      });

      setMembers(Object.values(map));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Derived
  const filtered = members
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.username.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q) || m.id.includes(q);
      const matchType   = typeFilter === 'all' || m.role === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      const aInf = a.cases.length + a.warnings.length;
      const bInf = b.cases.length + b.warnings.length;
      if (sortBy === 'infractions')   return bInf - aInf;
      if (sortBy === 'modactions')    return (b.modActions?.length || 0) - (a.modActions?.length || 0);
      if (sortBy === 'name')          return a.username.localeCompare(b.username);
      if (sortBy === 'recent')        return new Date(b.lastSeen) - new Date(a.lastSeen);
      return 0;
    });

  const pages     = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total:      members.length,
    targets:    members.filter(m => m.role === 'target').length,
    moderators: members.filter(m => m.role === 'moderator').length,
    totalInf:   members.reduce((s, m) => s + m.cases.length + m.warnings.length, 0),
  };

  // Guild info from JWT
  const jwtGuild = user?.allowedGuilds?.find(g => g.id === selectedGuild);

  return (
    <div className="ov-container animate-fade-in">
      {/* Header */}
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text">
            <i className="fa-solid fa-users"></i> Members Manager
            {(guildInfo?.name || jwtGuild?.name) && (
              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '10px', verticalAlign: 'middle' }}>
                {guildInfo?.name || jwtGuild?.name}
              </span>
            )}
          </h2>
          <p className="subtitle">
            {guildInfo?.memberCount
              ? `${guildInfo.memberCount.toLocaleString()} members on server · `
              : ''}
            Data sourced from real moderation cases and warnings.
          </p>
        </div>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={fetchAll}>
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {/* Source notice */}
      <div className="glass-panel" style={{ marginBottom: '16px', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '3px solid #ffbb33', background: 'rgba(255,187,51,0.05)' }}>
        <i className="fa-solid fa-circle-info" style={{ color: '#ffbb33', flexShrink: 0 }}></i>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Displayed users are those found in the moderation history (cases + warnings).
          {guildInfo?.memberCount && <strong style={{ color: '#fff' }}> Actual server size: {guildInfo.memberCount.toLocaleString()} members.</strong>}
        </span>
      </div>

      {/* KPIs */}
      <div className="ov-stats-grid" style={{ marginBottom: '16px' }}>
        {[
          { icon: 'fa-solid fa-users',       label: 'Tracked users', value: stats.total,      color: '#33b5e5', bg: 'rgba(51,181,229,0.12)' },
          { icon: 'fa-solid fa-user-xmark',  label: 'Targeted',               value: stats.targets,    color: '#ff4444', bg: 'rgba(255,68,68,0.12)' },
          { icon: 'fa-solid fa-user-shield', label: 'Moderators',          value: stats.moderators, color: '#00C851', bg: 'rgba(0,200,81,0.12)' },
          { icon: 'fa-solid fa-gavel',       label: 'Total infractions',    value: stats.totalInf,   color: '#ff66b2', bg: 'rgba(255,102,178,0.12)' },
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
            type="text" placeholder="Search by name, tag or ID…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px 8px 32px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}>
          <option value="all">All ({members.length})</option>
          <option value="target">Targeted ({stats.targets})</option>
          <option value="moderator">Moderators ({stats.moderators})</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}>
          <option value="infractions">Infractions ↓</option>
          <option value="modactions">Mod actions ↓</option>
          <option value="recent">Recent activity</option>
          <option value="name">Name A → Z</option>
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && <div className="loader">Loading data…</div>}

      {!loading && error && (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderLeft: '3px solid #ff4444' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', color: '#ff4444', marginBottom: '12px', display: 'block' }}></i>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
          <button className="btn-secondary" onClick={fetchAll}><i className="fa-solid fa-rotate-right"></i> Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Table */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Utilisateur</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Cases</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Warnings</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions mod</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Last activity</th>
                    <th style={{ padding: '12px 8px', width: '36px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <i className="fa-solid fa-users-slash" style={{ fontSize: '2rem', opacity: 0.2, display: 'block', marginBottom: '10px' }}></i>
                      No results
                    </td></tr>
                  ) : paginated.map(m => {
                    const infCount = m.cases.length + m.warnings.length;
                    const isSelected = selected?.id === m.id;
                    return (
                      <React.Fragment key={m.id}>
                        <tr
                          data-testid="member-row"
                          onClick={() => setSelected(isSelected ? null : m)}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isSelected ? 'rgba(255,102,178,0.06)' : 'transparent',
                            cursor: 'pointer', transition: 'background 0.15s',
                          }}
                        >
                          {/* User */}
                          <td style={{ padding: '11px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={avatarUrl(m.id)} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: '500' }}>{m.username}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{m.id}</div>
                              </div>
                            </div>
                          </td>
                          {/* Role */}
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{
                              fontSize: '0.72rem', padding: '3px 10px', borderRadius: '10px', fontWeight: '600',
                              background: m.role === 'moderator' ? 'rgba(0,200,81,0.12)' : 'rgba(255,68,68,0.12)',
                              color:      m.role === 'moderator' ? '#00C851'              : '#ff4444',
                            }}>
                              {m.role === 'moderator' ? '🛡 Moderator' : '⚠ Targeted'}
                            </span>
                          </td>
                          {/* Cases */}
                          <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                            {m.cases.length > 0
                              ? <span style={{ background: 'rgba(255,102,178,0.12)', color: '#ff66b2', padding: '2px 10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.8rem' }}>{m.cases.length}</span>
                              : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                          </td>
                          {/* Warnings */}
                          <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                            {m.warnings.length > 0
                              ? <span style={{ background: 'rgba(255,187,51,0.12)', color: '#ffbb33', padding: '2px 10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.8rem' }}>{m.warnings.length}</span>
                              : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                          </td>
                          {/* Mod actions */}
                          <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                            {m.modActions?.length > 0
                              ? <span style={{ background: 'rgba(0,200,81,0.12)', color: '#00C851', padding: '2px 10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.8rem' }}>{m.modActions.length}</span>
                              : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                          </td>
                          {/* Last seen */}
                          <td style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {relTime(m.lastSeen)}
                          </td>
                          <td style={{ padding: '11px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <i className={`fa-solid fa-chevron-${isSelected ? 'up' : 'down'}`} style={{ fontSize: '0.7rem' }}></i>
                          </td>
                        </tr>

                        {/* Detail row */}
                        {isSelected && (
                          <tr>
                            <td colSpan={7} style={{ padding: '0', background: 'rgba(255,102,178,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>

                                  {/* Recent cases */}
                                  {m.cases.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                        Cases ({m.cases.length})
                                      </div>
                                      {m.cases.slice(0, 5).map(c => (
                                        <div key={c.caseId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>
                                          <span style={{ color: ACTION_COLORS[c.action] || '#94a3b8', fontWeight: '600', minWidth: '55px', fontSize: '0.75rem' }}>{c.action}</span>
                                          <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.reason || '—'}</span>
                                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', flexShrink: 0 }}>{relTime(c.timestamp)}</span>
                                        </div>
                                      ))}
                                      {m.cases.length > 5 && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>+{m.cases.length - 5} more…</div>}
                                    </div>
                                  )}

                                  {/* Recent warnings */}
                                  {m.warnings.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                        Warnings ({m.warnings.length})
                                      </div>
                                      {m.warnings.slice(0, 5).map(w => (
                                        <div key={w._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>
                                          <span style={{ color: '#ffbb33', fontWeight: '600', minWidth: '55px', fontSize: '0.75rem' }}>WARN</span>
                                          <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.reason || '—'}</span>
                                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', flexShrink: 0 }}>{relTime(w.timestamp)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Mod actions */}
                                  {m.modActions?.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                        Actions performed ({m.modActions.length})
                                      </div>
                                      {m.modActions.slice(0, 5).map((a, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>
                                          <span style={{ color: ACTION_COLORS[a.action] || '#94a3b8', fontWeight: '600', minWidth: '55px', fontSize: '0.75rem' }}>{a.action}</span>
                                          <span style={{ flex: 1, color: '#ccc', fontSize: '0.75rem' }}>{a.targetTag || a.userId || '—'}</span>
                                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', flexShrink: 0 }}>{relTime(a.timestamp)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
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
                .map((p, i) => p === '…'
                  ? <span key={`e${i}`} style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>…</span>
                  : <button key={p} className={p === page ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem', padding: '5px 12px', minWidth: '36px' }} onClick={() => setPage(p)}>{p}</button>
                )}
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                Page {page}/{pages} · {filtered.length} users
              </span>
            </div>
          )}
        </>
      )}

      <style>{`@media(max-width:768px){table td:nth-child(3),table td:nth-child(5),table th:nth-child(3),table th:nth-child(5){display:none}}`}</style>
    </div>
  );
}
