import React, { useState, useEffect, useCallback } from 'react';

// Builds notifications from REAL API data:
// /api/moderation/${guild}/cases  → cases[]{caseId, action, targetTag, targetId, moderatorTag, reason, timestamp}
// /api/moderation/${guild}/warnings → warnings[]{_id, userId, reason, moderatorId, timestamp}
// Stores read state in localStorage to persist between sessions

const READ_KEY    = 'zenith_notif_read';
const SETTINGS_KEY = 'zenith_notif_settings';

const DEFAULT_SETTINGS = {
  BAN: true, WARN: true, MUTE: true, KICK: true,
  UNBAN: false, UNMUTE: false, PURGE: false, MASSBAN: true,
};

const TYPE_META = {
  BAN:     { label: 'Ban',     icon: 'fa-solid fa-ban',                      color: '#ff4444' },
  WARN:    { label: 'Warn',    icon: 'fa-solid fa-triangle-exclamation',     color: '#ffbb33' },
  MUTE:    { label: 'Mute',    icon: 'fa-solid fa-microphone-slash',         color: '#ff66b2' },
  KICK:    { label: 'Kick',    icon: 'fa-solid fa-person-walking-arrow-right',color: '#ff8800' },
  UNBAN:   { label: 'Unban',   icon: 'fa-solid fa-door-open',                color: '#00C851' },
  UNMUTE:  { label: 'Unmute',  icon: 'fa-solid fa-microphone',               color: '#33b5e5' },
  PURGE:   { label: 'Purge',   icon: 'fa-solid fa-trash-can',                color: '#aa66cc' },
  MASSBAN: { label: 'Mass Ban',icon: 'fa-solid fa-hammer',                   color: '#cc0000' },
};

function relTime(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function loadReadSet(guildId) {
  try {
    const all = JSON.parse(localStorage.getItem(READ_KEY) || '{}');
    return new Set(all[guildId] || []);
  } catch { return new Set(); }
}

function saveReadSet(guildId, set) {
  try {
    const all = JSON.parse(localStorage.getItem(READ_KEY) || '{}');
    all[guildId] = [...set];
    localStorage.setItem(READ_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export default function Notifications({ selectedGuild }) {
  const [cases, setCases]         = useState([]);
  const [warnings, setWarnings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [readIds, setReadIds]     = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());
  const [settings, setSettings]   = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  });
  const [filter, setFilter]       = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (selectedGuild) {
      setReadIds(loadReadSet(selectedGuild));
      setDismissed(new Set());
      fetchData();
    }
  }, [selectedGuild]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token   = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [cRes, wRes] = await Promise.all([
        fetch(`/api/moderation/${selectedGuild}/cases`, { headers }),
        fetch(`/api/moderation/${selectedGuild}/warnings`, { headers }),
      ]);
      if (cRes.ok) setCases(await cRes.json());
      if (wRes.ok) setWarnings(await wRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Build unified notification list from real data
  const allNotifs = [
    ...cases.map(c => ({
      id:        `case-${c.caseId}`,
      type:      c.action,
      user:      c.targetTag,
      userId:    c.targetId,
      moderator: c.moderatorTag,
      reason:    c.reason,
      timestamp: c.timestamp,
      source:    'case',
      caseId:    c.caseId,
    })),
    ...warnings.map(w => ({
      id:        `warn-${w._id}`,
      type:      'WARN',
      user:      w.userId,
      userId:    w.userId,
      moderator: w.moderatorId || '—',
      reason:    w.reason,
      timestamp: w.timestamp,
      source:    'warning',
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply settings filter (hidden types)
  const visibleNotifs = allNotifs.filter(n => settings[n.type] !== false && !dismissed.has(n.id));

  const filtered = visibleNotifs.filter(n => {
    if (filter === 'unread') return !readIds.has(n.id);
    if (filter === 'read')   return readIds.has(n.id);
    if (filter !== 'all')    return n.type === filter;
    return true;
  });

  const unreadCount = visibleNotifs.filter(n => !readIds.has(n.id)).length;

  const markRead = (id) => {
    const next = new Set([...readIds, id]);
    setReadIds(next);
    saveReadSet(selectedGuild, next);
  };

  const markAllRead = () => {
    const next = new Set(visibleNotifs.map(n => n.id));
    setReadIds(next);
    saveReadSet(selectedGuild, next);
  };

  const dismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const dismissAll = () => {
    setDismissed(new Set(visibleNotifs.map(n => n.id)));
  };

  const saveSettings = (next) => {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  // Counts per type from real data
  const typeCounts = {};
  allNotifs.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });

  return (
    <div className="ov-container animate-fade-in">
      {/* Header */}
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text">
            <i className="fa-solid fa-bell"></i> Notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: '10px', fontSize: '0.65rem', padding: '3px 10px', borderRadius: '12px', background: 'var(--premium-pink)', color: '#fff', fontWeight: '700', verticalAlign: 'middle' }}>
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="subtitle">
            Real moderation alerts — {allNotifs.length} entry{allNotifs.length !== 1 ? 'ies' : 'y'} loaded.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={fetchData}>
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={markAllRead}>
            <i className="fa-solid fa-check-double"></i> Mark all read
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setSettingsOpen(s => !s)}>
            <i className="fa-solid fa-sliders"></i> Filters
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.8rem', color: '#ff4444' }} onClick={dismissAll}>
            <i className="fa-solid fa-eye-slash"></i> Hide all
          </button>
        </div>
      </div>

      {/* KPI cards (real counts) */}
      <div className="ov-stats-grid" style={{ marginBottom: '16px' }}>
        {Object.entries(TYPE_META).map(([k, m], i) => (
          <div
            key={k}
            className="glass-panel ov-stat-card"
            style={{ animationDelay: `${i * 0.04}s`, cursor: 'pointer', outline: filter === k ? `1.5px solid ${m.color}` : 'none', transition: 'outline 0.15s' }}
            onClick={() => setFilter(filter === k ? 'all' : k)}
          >
            <div className="ov-stat-icon" style={{ background: `${m.color}18`, color: m.color }}>
              <i className={m.icon}></i>
            </div>
            <div className="ov-stat-info">
              <span className="ov-stat-label">{m.label}</span>
              <span className="ov-stat-value">{typeCounts[k] || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '16px', borderLeft: '3px solid var(--premium-pink)' }}>
          <h3 style={{ marginBottom: '14px' }}><i className="fa-solid fa-sliders" style={{ color: 'var(--premium-pink)' }}></i> Show types</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                <input type="checkbox" checked={settings[k] !== false} onChange={e => saveSettings({ ...settings, [k]: e.target.checked })} />
                <i className={m.icon} style={{ color: m.color, width: '14px' }}></i>
                <span style={{ fontSize: '0.85rem' }}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {['all', 'unread', 'read'].map(f => (
          <button
            key={f}
            className={filter === f ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '5px 14px' }}
            onClick={() => setFilter(f)}
          >
            {f === 'all'    ? `Tous (${visibleNotifs.length})`
             : f === 'unread' ? `Unread (${unreadCount})`
             : 'Read'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="loader">Loading notifications…</div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', color: '#ff4444', marginBottom: '12px', display: 'block' }}></i>
          <p>Error: {error}</p>
          <button className="btn-secondary" style={{ marginTop: '12px' }} onClick={fetchData}>Retry</button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <i className="fa-solid fa-bell-slash" style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '12px', display: 'block' }}></i>
              <p>No notifications in this category.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '680px', overflowY: 'auto' }}>
              {filtered.map(n => {
                const meta    = TYPE_META[n.type] || { label: n.type, icon: 'fa-solid fa-shield', color: '#64748b' };
                const isRead  = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    data-testid="notif-entry"
                    onClick={() => markRead(n.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      padding: '14px 18px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isRead ? 'transparent' : 'rgba(255,102,178,0.04)',
                      cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
                    }}
                  >
                    {!isRead && (
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--premium-pink)', position: 'absolute', top: '18px', left: '6px' }} />
                    )}
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={meta.icon} style={{ color: meta.color, fontSize: '0.9rem' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontWeight: isRead ? '400' : '600', fontSize: '0.9rem' }}>
                          <span style={{ color: meta.color }}>{meta.label}</span>
                          {' — '}
                          <span style={{ color: '#fff' }}>{n.user}</span>
                          {n.caseId && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>#{n.caseId}</span>}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{relTime(n.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Par <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{n.moderator}</strong>
                        {n.reason && <> · <span style={{ fontStyle: 'italic' }}>{n.reason}</span></>}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); dismiss(n.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', fontSize: '0.8rem', opacity: 0.5, flexShrink: 0 }} title="Masquer">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
