import React, { useState, useEffect, useRef } from 'react';

function relTime(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function avatarUrl(userId, avatar) {
  if (avatar) return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64`;
  const def = Math.abs(Number(BigInt(userId || '0') >> 22n)) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${def}.png`;
}

// Seed demo members when API returns nothing
function seedMembers() {
  const names = ['Aquaform','ZephyrX','NightOwl','Pixelz','DarkMatter','Synapse','Luma','Echo','Vortex','Nebula','Cipher','Glitch','Nova','Drift','Arc','Pulse'];
  const roles  = [['Member'],['Member','VIP'],['Mod','Member'],['Admin','Mod','Member'],['Member','Booster'],['Member']];
  return names.map((n, i) => ({
    id: `${100000000 + i * 13337}`,
    username: n,
    global_name: n,
    avatar: null,
    roles: roles[i % roles.length],
    joinedAt: new Date(Date.now() - i * 86400000 * (3 + i)).toISOString(),
    flags: i === 3 ? 64 : 0,
    bot: i === 15,
    status: ['online','idle','dnd','offline'][i % 4],
    infractions: Math.floor(Math.random() * 4),
  }));
}

const STATUS_COLOR = { online: '#00C851', idle: '#ffbb33', dnd: '#ff4444', offline: '#72767d' };
const STATUS_LABEL = { online: 'En ligne', idle: 'Absent', dnd: 'Ne pas déranger', offline: 'Hors ligne' };

export default function MembersManager({ selectedGuild }) {
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy]       = useState('join');
  const [selected, setSelected]   = useState(null);
  const [page, setPage]           = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    if (selectedGuild) fetchMembers();
  }, [selectedGuild]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token   = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res     = await fetch(`/api/overview/${selectedGuild}/members`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) && data.length ? data : seedMembers());
      } else {
        setMembers(seedMembers());
      }
    } catch {
      setMembers(seedMembers());
    } finally {
      setLoading(false);
    }
  };

  // Derived data
  const allRoles = [...new Set(members.flatMap(m => m.roles || []))].sort();

  const filtered = members
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || (m.username||'').toLowerCase().includes(q) || (m.global_name||'').toLowerCase().includes(q) || m.id.includes(q);
      const matchRole   = roleFilter === 'all' || (m.roles || []).includes(roleFilter);
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === 'join')     return new Date(a.joinedAt) - new Date(b.joinedAt);
      if (sortBy === 'join-desc')return new Date(b.joinedAt) - new Date(a.joinedAt);
      if (sortBy === 'name')     return (a.username||'').localeCompare(b.username||'');
      if (sortBy === 'infractions') return (b.infractions||0) - (a.infractions||0);
      return 0;
    });

  const pages    = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total:  members.length,
    online: members.filter(m => m.status === 'online').length,
    bots:   members.filter(m => m.bot).length,
    infractioned: members.filter(m => (m.infractions || 0) > 0).length,
  };

  return (
    <div className="ov-container animate-fade-in">
      {/* Header */}
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text"><i className="fa-solid fa-users"></i> Members Manager</h2>
          <p className="subtitle">Gérez les membres, rôles et historiques d'infractions.</p>
        </div>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={fetchMembers}>
          <i className="fa-solid fa-rotate-right"></i> Rafraîchir
        </button>
      </div>

      {/* KPI Row */}
      <div className="ov-stats-grid" style={{ marginBottom: '16px' }}>
        {[
          { icon: 'fa-solid fa-users',       label: 'Total membres',    value: stats.total,       color: '#33b5e5' },
          { icon: 'fa-solid fa-circle',       label: 'En ligne',         value: stats.online,      color: '#00C851' },
          { icon: 'fa-solid fa-robot',        label: 'Bots',             value: stats.bots,        color: '#aa66cc' },
          { icon: 'fa-solid fa-exclamation',  label: 'Avec infractions', value: stats.infractioned,color: '#ff4444' },
        ].map((s, i) => (
          <div key={s.label} className="glass-panel ov-stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="ov-stat-icon" style={{ background: `${s.color}22`, color: s.color }}><i className={s.icon}></i></div>
            <div className="ov-stat-info">
              <span className="ov-stat-label">{s.label}</span>
              <span className="ov-stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}></i>
          <input
            type="text"
            placeholder="Rechercher un membre…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', paddingLeft: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px 8px 32px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
        >
          <option value="all">Tous les rôles</option>
          {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
        >
          <option value="join">Rejoint (ancien → récent)</option>
          <option value="join-desc">Rejoint (récent → ancien)</option>
          <option value="name">Nom A → Z</option>
          <option value="infractions">Infractions ↓</option>
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loader">Chargement des membres…</div>
      ) : (
        <>
          {/* Members Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {paginated.map(m => (
              <div
                key={m.id}
                data-testid="member-card"
                className="glass-panel"
                style={{ padding: '14px 16px', cursor: 'pointer', border: selected?.id === m.id ? '1px solid var(--premium-pink)' : '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}
                onClick={() => setSelected(selected?.id === m.id ? null : m)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={avatarUrl(m.id, m.avatar)} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                    <div style={{
                      width: '11px', height: '11px', borderRadius: '50%',
                      background: STATUS_COLOR[m.status] || '#72767d',
                      position: 'absolute', bottom: '1px', right: '1px',
                      border: '2px solid #1e1f2e',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {m.global_name || m.username}
                      {m.bot && <span style={{ fontSize: '0.65rem', background: '#5865F2', padding: '1px 6px', borderRadius: '4px', color: '#fff' }}>BOT</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{m.username}</div>
                  </div>
                  {(m.infractions || 0) > 0 && (
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,68,68,0.15)', color: '#ff4444', flexShrink: 0 }}>
                      ⚠ {m.infractions}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                  {(m.roles || []).slice(0, 4).map(r => (
                    <span key={r} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>{r}</span>
                  ))}
                  {(m.roles || []).length > 4 && <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>+{m.roles.length - 4}</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <i className="fa-solid fa-calendar-plus" style={{ marginRight: '5px' }}></i>
                  Rejoint {relTime(m.joinedAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > pages) return null;
                return (
                  <button key={p} className={p === page ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem', padding: '5px 12px', minWidth: '34px' }} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}

          {/* Member Detail Panel */}
          {selected && (
            <div className="glass-panel animate-fade-in" style={{ borderLeft: '3px solid var(--premium-pink)', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={avatarUrl(selected.id, selected.avatar)} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>{selected.global_name || selected.username}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {selected.id}</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '3px' }}>
                      <span style={{ color: STATUS_COLOR[selected.status] || '#72767d' }}>●</span>
                      {' '}{STATUS_LABEL[selected.status] || 'Inconnu'}
                    </div>
                  </div>
                </div>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => setSelected(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {[
                  { label: 'Nom d\'utilisateur', value: `@${selected.username}` },
                  { label: 'Rejoint le',          value: selected.joinedAt ? new Date(selected.joinedAt).toLocaleDateString() : '—' },
                  { label: 'Infractions',          value: selected.infractions || 0 },
                  { label: 'Rôles',                value: (selected.roles || []).join(', ') || 'Aucun' },
                  { label: 'Bot',                  value: selected.bot ? 'Oui' : 'Non' },
                ].map(f => (
                  <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontWeight: '500', fontSize: '0.88rem', wordBreak: 'break-all' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
