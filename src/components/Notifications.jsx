import React, { useState, useEffect, useCallback } from 'react';

const NOTIF_KEY    = 'zenith_notifications';
const SETTINGS_KEY = 'zenith_notif_settings';

const DEFAULT_SETTINGS = {
  ban: true, warn: true, mute: true, kick: true,
  unban: false, unmute: false, purge: false,
};

const TYPE_META = {
  ban:    { label: 'Ban',    icon: 'fa-solid fa-ban',                    color: '#ff4444' },
  warn:   { label: 'Warn',   icon: 'fa-solid fa-triangle-exclamation',   color: '#ffbb33' },
  mute:   { label: 'Mute',   icon: 'fa-solid fa-microphone-slash',       color: '#ff66b2' },
  kick:   { label: 'Kick',   icon: 'fa-solid fa-person-walking-arrow-right', color: '#ff8800' },
  unban:  { label: 'Unban',  icon: 'fa-solid fa-door-open',              color: '#00C851' },
  unmute: { label: 'Unmute', icon: 'fa-solid fa-microphone',             color: '#33b5e5' },
  purge:  { label: 'Purge',  icon: 'fa-solid fa-trash-can',              color: '#aa66cc' },
};

function relTime(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function seedNotifications(guildId) {
  const types = ['ban','warn','mute','kick','warn','warn','ban','unmute'];
  const users = ['Aquaform','Zephyr','NightOwl','Pixelz','DarkMatter','Synapse','Luma','Echo'];
  const mods  = ['Admin#0001','Moderator#1234','Guard#5678'];
  return types.map((t, i) => ({
    id: `seed-${i}`,
    type: t,
    guildId,
    user: users[i % users.length],
    userId: `${100000000 + i * 13337}`,
    moderator: mods[i % mods.length],
    reason: ['Spam', 'Toxicity', 'NSFW content', 'Raid', 'Rule violation', 'Advertising'][i % 6],
    timestamp: new Date(Date.now() - i * 1000 * 60 * (5 + i * 7)).toISOString(),
    read: i > 2,
  }));
}

export default function Notifications({ selectedGuild }) {
  const [notifs, setNotifs]       = useState([]);
  const [settings, setSettings]   = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  });
  const [filter, setFilter]       = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load/seed notifications
  useEffect(() => {
    if (!selectedGuild) return;
    try {
      const saved = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
      const forGuild = saved.filter(n => n.guildId === selectedGuild);
      if (forGuild.length === 0) {
        const seeded = seedNotifications(selectedGuild);
        const merged = [...seeded, ...saved].slice(0, 100);
        localStorage.setItem(NOTIF_KEY, JSON.stringify(merged));
        setNotifs(seeded);
      } else {
        setNotifs(forGuild);
      }
    } catch { setNotifs(seedNotifications(selectedGuild)); }
  }, [selectedGuild]);

  const saveSettings = (next) => {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const markRead = (id) => {
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifs(updated);
    persistNotifs(updated);
  };

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updated);
    persistNotifs(updated);
  };

  const deleteNotif = (id) => {
    const updated = notifs.filter(n => n.id !== id);
    setNotifs(updated);
    persistNotifs(updated);
  };

  const clearAll = () => {
    setNotifs([]);
    persistNotifs([]);
  };

  const persistNotifs = (list) => {
    try {
      const saved = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
      const others = saved.filter(n => n.guildId !== selectedGuild);
      localStorage.setItem(NOTIF_KEY, JSON.stringify([...list, ...others].slice(0, 200)));
    } catch { /* ignore */ }
  };

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read')   return n.read;
    if (filter !== 'all')    return n.type === filter;
    return true;
  }).filter(n => settings[n.type] !== false);

  const unreadCount = notifs.filter(n => !n.read && settings[n.type] !== false).length;

  return (
    <div className="ov-container animate-fade-in">
      {/* Header */}
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text">
            <i className="fa-solid fa-bell"></i> Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: '10px', fontSize: '0.65rem', padding: '3px 10px',
                borderRadius: '12px', background: 'var(--premium-pink)',
                color: '#fff', fontWeight: '700', verticalAlign: 'middle',
              }}>{unreadCount}</span>
            )}
          </h2>
          <p className="subtitle">Alertes de modération en temps réel pour ce serveur.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={markAllRead}>
            <i className="fa-solid fa-check-double"></i> Tout lire
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setSettingsOpen(s => !s)}>
            <i className="fa-solid fa-sliders"></i> Filtres
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.8rem', color: '#ff4444' }} onClick={clearAll}>
            <i className="fa-solid fa-trash"></i> Vider
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ov-stats-grid" style={{ marginBottom: '16px' }}>
        {Object.entries(TYPE_META).map(([k, m], i) => (
          <div key={k} className="glass-panel ov-stat-card" style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer', outline: filter === k ? `1.5px solid ${m.color}` : 'none' }} onClick={() => setFilter(filter === k ? 'all' : k)}>
            <div className="ov-stat-icon" style={{ background: `${m.color}22`, color: m.color }}>
              <i className={m.icon}></i>
            </div>
            <div className="ov-stat-info">
              <span className="ov-stat-label">{m.label}</span>
              <span className="ov-stat-value">{notifs.filter(n => n.type === k).length}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '16px', borderLeft: '3px solid var(--premium-pink)' }}>
          <h3 style={{ marginBottom: '14px' }}><i className="fa-solid fa-sliders" style={{ color: 'var(--premium-pink)' }}></i> Préférences de notification</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                <input type="checkbox" checked={settings[k]} onChange={e => saveSettings({ ...settings, [k]: e.target.checked })} />
                <i className={m.icon} style={{ color: m.color, width: '14px' }}></i>
                <span style={{ fontSize: '0.85rem' }}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {['all','unread','read'].map(f => (
          <button
            key={f}
            className={filter === f ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '5px 14px', textTransform: 'capitalize' }}
            onClick={() => setFilter(f)}
          >{f === 'all' ? `Tous (${notifs.length})` : f === 'unread' ? `Non lus (${unreadCount})` : 'Lus'}</button>
        ))}
      </div>

      {/* Notification List */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <i className="fa-solid fa-bell-slash" style={{ fontSize: '2.5rem', opacity: 0.25, marginBottom: '12px', display: 'block' }}></i>
            <p>Aucune notification {filter !== 'all' ? `dans la catégorie "${filter}"` : ''}.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filtered.map((n, idx) => {
              const meta = TYPE_META[n.type] || TYPE_META.warn;
              return (
                <div
                  key={n.id}
                  data-testid="notif-entry"
                  onClick={() => markRead(n.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    padding: '14px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: n.read ? 'transparent' : 'rgba(255,102,178,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: 'var(--premium-pink)',
                      position: 'absolute', top: '18px', left: '6px',
                      flexShrink: 0,
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={meta.icon} style={{ color: meta.color, fontSize: '0.9rem' }}></i>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontWeight: n.read ? '400' : '600', fontSize: '0.9rem' }}>
                        <span style={{ color: meta.color }}>{meta.label}</span>
                        {' — '}
                        <span style={{ color: '#fff' }}>{n.user}</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{relTime(n.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Par <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{n.moderator}</strong>
                      {n.reason && <> · {n.reason}</>}
                    </div>
                  </div>

                  {/* Delete btn */}
                  <button
                    onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', fontSize: '0.8rem', opacity: 0.5, flexShrink: 0 }}
                    title="Supprimer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
