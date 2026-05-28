import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePreferences } from '../hooks/usePreferences.jsx';

const HISTORY_KEY = 'zenith_settings_history';
const SESSION_HISTORY_KEY = 'zenith_session_history';

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function detectOS(ua = '') {
  if (/Windows/.test(ua)) return { label: 'Windows', icon: 'fa-brands fa-windows' };
  if (/Mac OS/.test(ua)) return { label: 'macOS', icon: 'fa-brands fa-apple' };
  if (/Android/.test(ua)) return { label: 'Android', icon: 'fa-brands fa-android' };
  if (/iPhone|iPad/.test(ua)) return { label: 'iOS', icon: 'fa-brands fa-apple' };
  if (/Linux/.test(ua)) return { label: 'Linux', icon: 'fa-brands fa-linux' };
  return { label: 'Unknown', icon: 'fa-solid fa-desktop' };
}

function formatMemberCount(n) {
  if (!n) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k members`;
  return `${n} members`;
}

export default function AccountManager({ user }) {
  const { prefs, setPreference, resetPrefs, playNotificationSound, customizedCount, PREF_LABELS } = usePreferences();

  const [discordUser, setDiscordUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // History tab state
  const [liveProfile, setLiveProfile] = useState(null);
  const [liveGuilds, setLiveGuilds] = useState([]);
  const [liveStatus, setLiveStatus] = useState('idle'); // idle | live | error
  const [lastSync, setLastSync] = useState(null);
  const [prefHistory, setPrefHistory] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const livePollingRef = useRef(null);

  // ── Initial load ──
  useEffect(() => { fetchAccountData(); }, []);

  // ── Record current session on mount ──
  useEffect(() => {
    const token = localStorage.getItem('zenith_token');
    if (!token) return;
    const payload = parseJwt(token);
    if (!payload) return;

    try {
      const existing = JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY) || '[]');
      const jti = payload.jti || payload.exp;
      if (!existing.some(s => s.jti === jti)) {
        const entry = {
          userId: payload.userId || payload.sub,
          username: payload.username,
          global_name: payload.global_name,
          avatar: payload.avatar,
          guildsCount: (payload.allowedGuilds || []).length,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          loginAt: new Date().toISOString(),
          exp: payload.exp,
          iat: payload.iat,
          jti,
        };
        const updated = [entry, ...existing].slice(0, 50);
        localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(updated));
      }
    } catch { /* ignore */ }
  }, []);

  // ── Live polling when History tab is active ──
  useEffect(() => {
    if (activeTab === 'history') {
      loadLocalHistories();
      startLivePolling();
    } else {
      stopLivePolling();
    }
    return () => stopLivePolling();
  }, [activeTab]);

  const loadLocalHistories = () => {
    try {
      setPrefHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
      setSessionHistory(JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY) || '[]'));
    } catch { /* ignore */ }
  };

  const startLivePolling = useCallback(() => {
    fetchLiveData();
    livePollingRef.current = setInterval(fetchLiveData, 10000);
  }, []);

  const stopLivePolling = () => {
    if (livePollingRef.current) {
      clearInterval(livePollingRef.current);
      livePollingRef.current = null;
    }
  };

  const fetchLiveData = async () => {
    try {
      const token = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [pr, gr] = await Promise.allSettled([
        fetch('/api/account/profile', { headers }),
        fetch('/api/account/guilds', { headers }),
      ]);
      if (pr.status === 'fulfilled' && pr.value.ok) setLiveProfile(await pr.value.json());
      if (gr.status === 'fulfilled' && gr.value.ok) setLiveGuilds(await gr.value.json());
      setLiveStatus('live');
      setLastSync(new Date());
    } catch {
      setLiveStatus('error');
    }
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, guildsRes] = await Promise.allSettled([
        fetch('/api/account/profile', { headers }),
        fetch('/api/account/guilds', { headers }),
      ]);
      if (profileRes.status === 'fulfilled' && profileRes.value.ok)
        setDiscordUser(await profileRes.value.json());
      if (guildsRes.status === 'fulfilled' && guildsRes.value.ok)
        setGuilds(await guildsRes.value.json());
    } catch (err) {
      setError('Failed to fetch account data');
      console.error('[AccountManager]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_token');
    localStorage.removeItem('zenith_guild_id');
    window.location.href = '/login';
  };

  const avatarUrl = discordUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
    : user?.avatar
      ? `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png?size=256`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const bannerColor = discordUser?.banner_color || '#5865F2';

  const displayUser = discordUser || {
    username: user?.username || 'Unknown',
    id: user?.userId || '—',
    global_name: user?.global_name || user?.username || 'Unknown',
  };

  const createdAt = displayUser.id && displayUser.id !== '—'
    ? new Date(Number(BigInt(displayUser.id) >> 22n) + 1420070400000)
    : null;

  const sessionExpiry = user?.exp ? new Date(user.exp * 1000) : null;

  const tabs = [
    { id: 'profile',     label: 'Profile',     icon: 'fa-solid fa-user' },
    { id: 'servers',     label: 'Servers',      icon: 'fa-solid fa-server' },
    { id: 'session',     label: 'Session',      icon: 'fa-solid fa-key' },
    { id: 'preferences', label: 'Preferences',  icon: 'fa-solid fa-sliders' },
    { id: 'history',     label: 'History',      icon: 'fa-solid fa-clock-rotate-left' },
  ];

  const currentToken = localStorage.getItem('zenith_token');
  const currentPayload = parseJwt(currentToken);

  return (
    <div className="account-manager animate-fade-in">
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text"><i className="fa-solid fa-user-gear"></i> User Settings</h2>
          <p className="subtitle">Manage your Discord profile, linked servers, session, and preferences.</p>
        </div>
        <button className="btn-secondary settings-refresh-btn" onClick={fetchAccountData}>
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      <div className="settings-tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-testid={`settings-tab-${tab.id}`}
            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading && <div className="loader">Loading account data...</div>}
      {error && !loading && (
        <div className="glass-panel settings-error-banner">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
          <button className="btn-secondary" onClick={fetchAccountData}>Retry</button>
        </div>
      )}

      {/* ── Profile Tab ── */}
      {!loading && activeTab === 'profile' && (
        <div className="settings-section animate-fade-in">
          <div className="glass-panel settings-profile-card">
            <div className="settings-profile-banner" style={{ background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}88)` }}>
              <div className="settings-profile-banner-overlay" />
            </div>
            <div className="settings-profile-body">
              <div className="settings-profile-avatar-wrapper">
                <img className="settings-profile-avatar" src={avatarUrl} alt="Avatar" />
                <div className="settings-profile-status-dot" />
              </div>
              <div className="settings-profile-main-info">
                <h2 className="settings-profile-display-name">{displayUser.global_name || displayUser.username}</h2>
                <p className="settings-profile-username">@{displayUser.username}</p>
                {displayUser.discriminator && displayUser.discriminator !== '0' && (
                  <p className="settings-profile-discriminator">#{displayUser.discriminator}</p>
                )}
              </div>
            </div>
          </div>

          <div className="settings-details-grid">
            <div className="glass-panel settings-detail-card">
              <div className="settings-detail-icon"><i className="fa-solid fa-id-badge"></i></div>
              <div className="settings-detail-content">
                <span className="settings-detail-label">User ID</span>
                <span className="settings-detail-value">{displayUser.id}</span>
              </div>
            </div>
            {createdAt && (
              <div className="glass-panel settings-detail-card">
                <div className="settings-detail-icon"><i className="fa-solid fa-calendar"></i></div>
                <div className="settings-detail-content">
                  <span className="settings-detail-label">Account Created</span>
                  <span className="settings-detail-value">{createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            )}
            {discordUser?.locale && (
              <div className="glass-panel settings-detail-card">
                <div className="settings-detail-icon"><i className="fa-solid fa-globe"></i></div>
                <div className="settings-detail-content">
                  <span className="settings-detail-label">Locale</span>
                  <span className="settings-detail-value">{discordUser.locale}</span>
                </div>
              </div>
            )}
            {discordUser?.mfa_enabled !== undefined && (
              <div className="glass-panel settings-detail-card">
                <div className="settings-detail-icon"><i className="fa-solid fa-shield-halved"></i></div>
                <div className="settings-detail-content">
                  <span className="settings-detail-label">Two-Factor Authentication</span>
                  <span className="settings-detail-value">
                    {discordUser.mfa_enabled
                      ? <span style={{ color: 'var(--success)' }}><i className="fa-solid fa-check-circle"></i> Enabled</span>
                      : <span style={{ color: 'var(--danger)' }}><i className="fa-solid fa-xmark-circle"></i> Disabled</span>}
                  </span>
                </div>
              </div>
            )}
            {discordUser?.premium_type !== undefined && (
              <div className="glass-panel settings-detail-card">
                <div className="settings-detail-icon" style={{ color: '#f47fff', background: 'rgba(244,127,255,0.1)' }}>
                  <i className="fa-solid fa-gem"></i>
                </div>
                <div className="settings-detail-content">
                  <span className="settings-detail-label">Nitro Subscription</span>
                  <span className="settings-detail-value">
                    {['None','Nitro Classic','Nitro','Nitro Basic'][discordUser.premium_type] || 'None'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {discordUser?.flags !== undefined && (
            <div className="glass-panel settings-badges-card">
              <h3><i className="fa-solid fa-award"></i> Discord Badges</h3>
              <div className="settings-badge-list">
                {renderBadges(discordUser.public_flags || discordUser.flags)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Servers Tab ── */}
      {!loading && activeTab === 'servers' && (
        <div className="settings-section animate-fade-in">
          <div className="settings-section-intro glass-panel">
            <i className="fa-solid fa-server" style={{ fontSize: '1.2rem', color: 'var(--premium-pink)' }}></i>
            <div>
              <h3>Linked Servers</h3>
              <p>Servers you have access to through your Discord account.</p>
            </div>
          </div>
          {(guilds.length > 0 ? guilds : user?.allowedGuilds || []).length > 0 ? (
            <div className="settings-servers-grid">
              {(guilds.length > 0 ? guilds : user?.allowedGuilds || []).map(g => (
                <div key={g.id} className="glass-panel settings-server-card">
                  <div className="settings-server-icon-wrap">
                    {g.icon ? (
                      <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`} alt={g.name} className="settings-server-icon" />
                    ) : (
                      <div className="settings-server-placeholder">{g.name?.charAt(0) || '#'}</div>
                    )}
                  </div>
                  <div className="settings-server-info">
                    <h4>{g.name}</h4>
                    <span className="settings-server-id">{g.id}</span>
                    <div className="settings-server-badges">
                      {g.owner && <span className="badge">Owner</span>}
                      {g.permissions && (
                        <span className="badge" style={{ background: 'rgba(99,179,255,0.15)', color: '#63b3ff' }}>
                          {(BigInt(g.permissions) & 0x8n) !== 0n ? 'Admin' : 'Member'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel settings-empty-state">
              <i className="fa-solid fa-server" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
              <p>No servers available. Server data is loaded from the API when available.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Session Tab ── */}
      {!loading && activeTab === 'session' && (
        <div className="settings-section animate-fade-in">
          <div className="glass-panel settings-session-card">
            <div className="settings-session-header">
              <h3><i className="fa-solid fa-shield-halved"></i> Session Information</h3>
              <div className="settings-session-status">
                <span className="settings-status-dot active"></span>
                Active
              </div>
            </div>
            <div className="settings-session-grid">
              {sessionExpiry && (
                <div className="settings-session-item">
                  <i className="fa-solid fa-clock"></i>
                  <div>
                    <span className="settings-detail-label">Session Expires</span>
                    <span className="settings-detail-value">{sessionExpiry.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <div className="settings-session-item">
                <i className="fa-solid fa-server"></i>
                <div>
                  <span className="settings-detail-label">Allowed Servers</span>
                  <span className="settings-detail-value">{user?.allowedGuilds?.length || 0}</span>
                </div>
              </div>
              <div className="settings-session-item">
                <i className="fa-brands fa-discord"></i>
                <div>
                  <span className="settings-detail-label">Authentication Method</span>
                  <span className="settings-detail-value">Discord OAuth2</span>
                </div>
              </div>
            </div>
            <div className="settings-session-actions">
              <button className="btn-primary" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket"></i> Log Out
              </button>
              <button className="btn-secondary" onClick={fetchAccountData}>
                <i className="fa-solid fa-rotate-right"></i> Refresh Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {!loading && activeTab === 'preferences' && (
        <div className="settings-section animate-fade-in">
          {customizedCount > 0 && (
            <div className="glass-panel prefs-banner" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 20px', marginBottom: '16px',
              borderLeft: '3px solid var(--premium-pink)',
              background: 'rgba(255,100,180,0.07)',
            }}>
              <i className="fa-solid fa-circle-info" style={{ color: 'var(--premium-pink)' }}></i>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#fff' }}>{customizedCount} preference{customizedCount > 1 ? 's' : ''} customized</strong> — saved locally
              </span>
            </div>
          )}

          <div className="glass-panel settings-prefs-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3><i className="fa-solid fa-sliders"></i> User Preferences</h3>
                <p className="subtitle">Customize your dashboard experience.</p>
              </div>
              <button
                data-testid="pref-reset-btn"
                className="btn-secondary"
                onClick={resetPrefs}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <i className="fa-solid fa-arrow-rotate-left"></i> Reset
              </button>
            </div>

            <div className="settings-pref-group">
              {/* Compact Mode */}
              <div className="settings-pref-item">
                <div className="settings-pref-info">
                  <h4>Compact Mode</h4>
                  <p>Use a more compact layout with smaller spacing.</p>
                </div>
                <label className="settings-toggle" data-testid="pref-compact-mode">
                  <input
                    type="checkbox"
                    checked={prefs.compactMode}
                    onChange={e => setPreference('compactMode', e.target.checked)}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>

              {/* Notification Sounds */}
              <div className="settings-pref-item">
                <div className="settings-pref-info">
                  <h4>Notification Sounds</h4>
                  <p>Play a sound when receiving new moderation alerts.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {prefs.notificationSounds && (
                    <button
                      data-testid="pref-notification-sounds-test"
                      className="btn-secondary"
                      onClick={playNotificationSound}
                      style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                    >
                      <i className="fa-solid fa-volume-high"></i> Test
                    </button>
                  )}
                  <label className="settings-toggle" data-testid="pref-notification-sounds">
                    <input
                      type="checkbox"
                      checked={prefs.notificationSounds}
                      onChange={e => setPreference('notificationSounds', e.target.checked)}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Auto-Refresh */}
              <div className="settings-pref-item">
                <div className="settings-pref-info">
                  <h4>Auto-Refresh Dashboard</h4>
                  <p>Automatically refresh analytics data every 30 seconds.</p>
                </div>
                <label className="settings-toggle" data-testid="pref-auto-refresh">
                  <input
                    type="checkbox"
                    checked={prefs.autoRefresh}
                    onChange={e => setPreference('autoRefresh', e.target.checked)}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>

              {/* Show Member Count */}
              <div className="settings-pref-item">
                <div className="settings-pref-info">
                  <h4>Show Server Member Count</h4>
                  <p>Display member count alongside server names.</p>
                </div>
                <label className="settings-toggle" data-testid="pref-show-member-count">
                  <input
                    type="checkbox"
                    checked={prefs.showMemberCount}
                    onChange={e => setPreference('showMemberCount', e.target.checked)}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── History Tab ── */}
      {!loading && activeTab === 'history' && (
        <div className="settings-section animate-fade-in" data-testid="settings-tab-history">
          {/* Live Discord Data */}
          <div className="glass-panel" style={{
            marginBottom: '20px',
            borderLeft: '3px solid var(--premium-pink)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                <i className="fa-solid fa-satellite-dish" style={{ color: 'var(--premium-pink)' }}></i> Live Discord Data
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: liveStatus === 'live' ? '#00C851' : liveStatus === 'error' ? '#ff4444' : '#888',
                  display: 'inline-block',
                  boxShadow: liveStatus === 'live' ? '0 0 6px #00C851' : 'none',
                  animation: liveStatus === 'live' ? 'pulse 1.5s infinite' : 'none',
                }} />
                {liveStatus === 'live' ? 'Live' : liveStatus === 'error' ? 'Error' : 'Idle'}
                {lastSync && (
                  <span style={{ marginLeft: '6px' }}>
                    · Last sync {lastSync.toLocaleTimeString()} · polling every 10s
                  </span>
                )}
              </div>
            </div>

            {liveProfile ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}>
                {[
                  { label: 'Username', value: liveProfile.username, icon: 'fa-solid fa-at' },
                  { label: 'Discord ID', value: liveProfile.id, icon: 'fa-solid fa-id-badge' },
                  { label: 'Display Name', value: liveProfile.global_name || liveProfile.username, icon: 'fa-solid fa-signature' },
                  { label: 'Visible Servers', value: liveGuilds.length || '—', icon: 'fa-solid fa-server' },
                  { label: 'Locale', value: liveProfile.locale || '—', icon: 'fa-solid fa-globe' },
                  { label: '2FA', value: liveProfile.mfa_enabled ? 'Enabled' : 'Disabled', icon: 'fa-solid fa-shield-halved' },
                  { label: 'Nitro', value: ['None','Nitro Classic','Nitro','Nitro Basic'][liveProfile.premium_type] || 'None', icon: 'fa-solid fa-gem' },
                  { label: 'Verified', value: liveProfile.verified ? 'Yes' : 'No', icon: 'fa-solid fa-envelope-circle-check' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                    padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className={item.icon}></i> {item.label}
                    </span>
                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-spinner fa-spin"></i> Waiting for live data…
              </div>
            )}
          </div>

          {/* Preference Changes History */}
          <div className="glass-panel" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                <i className="fa-solid fa-sliders" style={{ color: 'var(--premium-pink)' }}></i> Preference Changes
              </h3>
              <button
                data-testid="history-pref-clear"
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                onClick={() => { localStorage.removeItem(HISTORY_KEY); setPrefHistory([]); }}
              >
                <i className="fa-solid fa-trash"></i> Clear
              </button>
            </div>
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {prefHistory.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '20px 0' }}>
                  No preference changes recorded yet.
                </div>
              ) : (
                prefHistory.map(entry => (
                  <div
                    key={entry.id}
                    data-testid="history-pref-entry"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'rgba(255,100,180,0.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className="fa-solid fa-toggle-on" style={{ color: 'var(--premium-pink)', fontSize: '0.85rem' }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{entry.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {entry.from ? 'ON' : 'OFF'} <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem', margin: '0 4px' }}></i> {entry.to ? 'ON' : 'OFF'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      <div>{relativeTime(entry.timestamp)}</div>
                      <div>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Discord OAuth Sessions */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                <i className="fa-brands fa-discord" style={{ color: 'var(--premium-pink)' }}></i> OAuth Sessions
              </h3>
              <button
                data-testid="history-session-clear"
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                onClick={() => { localStorage.removeItem(SESSION_HISTORY_KEY); setSessionHistory([]); }}
              >
                <i className="fa-solid fa-trash"></i> Clear
              </button>
            </div>
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {sessionHistory.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '20px 0' }}>
                  No sessions recorded.
                </div>
              ) : (
                sessionHistory.map((s, i) => {
                  const now = Date.now();
                  const isCurrent = currentPayload && currentPayload.jti === s.jti;
                  const isExpired = s.exp * 1000 < now;
                  const os = detectOS(s.userAgent);
                  return (
                    <div
                      key={s.jti || i}
                      data-testid="history-session-entry"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <img
                        src={s.avatar
                          ? `https://cdn.discordapp.com/avatars/${s.userId}/${s.avatar}.png?size=64`
                          : 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt=""
                        style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                          {s.username}
                          {isCurrent && (
                            <span style={{
                              marginLeft: '8px', fontSize: '0.7rem', padding: '2px 8px',
                              borderRadius: '10px', background: 'rgba(0,200,81,0.15)', color: '#00C851',
                            }}>Current</span>
                          )}
                          {!isCurrent && isExpired && (
                            <span style={{
                              marginLeft: '8px', fontSize: '0.7rem', padding: '2px 8px',
                              borderRadius: '10px', background: 'rgba(255,68,68,0.15)', color: '#ff4444',
                            }}>Expired</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <i className={os.icon}></i> {os.label} · {s.guildsCount} server{s.guildsCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                        <div>Exp: {new Date(s.exp * 1000).toLocaleDateString()}</div>
                        <div>{relativeTime(s.loginAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .settings-details-grid { grid-template-columns: 1fr !important; }
          .settings-servers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function renderBadges(flags) {
  if (!flags) return <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No badges found.</p>;
  const BADGES = [
    { flag: 1 << 0,  name: 'Discord Employee',        icon: 'fa-solid fa-briefcase' },
    { flag: 1 << 1,  name: 'Partnered Server Owner',  icon: 'fa-solid fa-handshake' },
    { flag: 1 << 2,  name: 'HypeSquad Events',        icon: 'fa-solid fa-calendar-star' },
    { flag: 1 << 3,  name: 'Bug Hunter Level 1',      icon: 'fa-solid fa-bug' },
    { flag: 1 << 6,  name: 'HypeSquad Bravery',       icon: 'fa-solid fa-shield' },
    { flag: 1 << 7,  name: 'HypeSquad Brilliance',    icon: 'fa-solid fa-gem' },
    { flag: 1 << 8,  name: 'HypeSquad Balance',       icon: 'fa-solid fa-scale-balanced' },
    { flag: 1 << 9,  name: 'Early Supporter',         icon: 'fa-solid fa-heart' },
    { flag: 1 << 14, name: 'Bug Hunter Level 2',      icon: 'fa-solid fa-bug-slash' },
    { flag: 1 << 17, name: 'Verified Bot Developer',  icon: 'fa-solid fa-robot' },
    { flag: 1 << 18, name: 'Certified Moderator',     icon: 'fa-solid fa-certificate' },
    { flag: 1 << 22, name: 'Active Developer',        icon: 'fa-solid fa-code' },
  ];
  const userBadges = BADGES.filter(b => (flags & b.flag) !== 0);
  if (userBadges.length === 0) return <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No badges found.</p>;
  return (
    <>
      {userBadges.map(b => (
        <span key={b.flag} className="settings-badge-chip" title={b.name}>
          <i className={b.icon}></i> {b.name}
        </span>
      ))}
    </>
  );
}
