import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Matches real API: /api/moderation/${guild}/stats
// Real fields: totalCases, last24h, totalWarnings, healthScore, activeProtectionLayers,
//              dailyData[]{date, count}, actionBreakdown{BAN,WARN,...},
//              recentActivity[]{_id, action, targetTag, targetId, moderatorTag, timestamp, reason},
//              topModerators[]{moderatorId, moderatorTag, count},
//              topTargets[]{userId, targetTag, count}
// Real fields: /api/overview/${guild}/guild-info → memberCount, channelCount, name, icon

const ACTION_COLORS = {
  WARN:    { color: '#ffbb33', bg: 'rgba(255,187,51,0.15)' },
  BAN:     { color: '#ff4444', bg: 'rgba(255,68,68,0.15)' },
  MUTE:    { color: '#ff66b2', bg: 'rgba(255,102,178,0.15)' },
  KICK:    { color: '#ff8800', bg: 'rgba(255,136,0,0.15)' },
  UNMUTE:  { color: '#00C851', bg: 'rgba(0,200,81,0.15)' },
  UNBAN:   { color: '#33b5e5', bg: 'rgba(51,181,229,0.15)' },
  PURGE:   { color: '#aa66cc', bg: 'rgba(170,102,204,0.15)' },
  MASSBAN: { color: '#cc0000', bg: 'rgba(204,0,0,0.15)' },
};

function getHealthColor(score) {
  if (score >= 80) return '#00C851';
  if (score >= 50) return '#ffbb33';
  return '#ff4444';
}

function relTime(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Analytics({ selectedGuild }) {
  const [stats, setStats]         = useState(null);
  const [guildInfo, setGuildInfo] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [range, setRange]         = useState('7d');

  const lineRef   = useRef(null);
  const donutRef  = useRef(null);
  const barRef    = useRef(null);
  const lineInst  = useRef(null);
  const donutInst = useRef(null);
  const barInst   = useRef(null);

  useEffect(() => {
    if (selectedGuild) fetchData();
  }, [selectedGuild]);

  useEffect(() => () => {
    lineInst.current?.destroy();
    donutInst.current?.destroy();
    barInst.current?.destroy();
  }, []);

  useEffect(() => {
    if (!loading && stats) {
      buildLineChart();
      buildDonutChart();
      buildBarChart();
    }
  }, [loading, stats, range]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token   = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [sRes, gRes] = await Promise.all([
        fetch(`/api/moderation/${selectedGuild}/stats`, { headers }),
        fetch(`/api/overview/${selectedGuild}/guild-info`, { headers }),
      ]);
      if (!sRes.ok) throw new Error(`Stats API ${sRes.status}`);
      setStats(await sRes.json());
      if (gRes.ok) setGuildInfo(await gRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter dailyData to selected range
  const filteredDaily = () => {
    if (!stats?.dailyData) return [];
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return stats.dailyData.slice(-days);
  };

  const buildLineChart = () => {
    if (!lineRef.current) return;
    lineInst.current?.destroy();
    const data = filteredDaily();
    if (!data.length) return;
    lineInst.current = new Chart(lineRef.current, {
      type: 'line',
      data: {
        labels: data.map(p => {
          const d = new Date(`${p.date}T00:00:00`);
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Actions/jour',
          data: data.map(p => p.count),
          borderColor: '#ff66b2',
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
            g.addColorStop(0, 'rgba(255,102,178,0.3)');
            g.addColorStop(1, 'rgba(255,102,178,0.0)');
            return g;
          },
          tension: 0.4, fill: true,
          pointBackgroundColor: '#ff66b2', pointRadius: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8', maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8' }, beginAtZero: true },
        },
      },
    });
  };

  const buildDonutChart = () => {
    if (!donutRef.current || !stats?.actionBreakdown) return;
    donutInst.current?.destroy();
    const entries = Object.entries(stats.actionBreakdown).filter(([, v]) => v > 0);
    if (!entries.length) return;
    donutInst.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => (ACTION_COLORS[k]?.color || '#64748b') + 'cc'),
          borderColor: 'rgba(10,10,12,0.8)', borderWidth: 3, hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { position: 'right', labels: { color: '#8b8fa8', font: { size: 11 }, padding: 12 } } },
      },
    });
  };

  const buildBarChart = () => {
    if (!barRef.current || !stats?.actionBreakdown) return;
    barInst.current?.destroy();
    const entries = Object.entries(stats.actionBreakdown).filter(([, v]) => v > 0);
    if (!entries.length) return;
    barInst.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          label: 'Nombre d\'actions',
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => (ACTION_COLORS[k]?.color || '#64748b') + 'aa'),
          borderColor:     entries.map(([k]) => ACTION_COLORS[k]?.color || '#64748b'),
          borderWidth: 1, borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8' }, beginAtZero: true },
        },
      },
    });
  };

  if (loading) return <div className="loader">Chargement des statistiques…</div>;

  if (error || !stats) return (
    <div className="ov-container animate-fade-in">
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', color: '#ff4444', marginBottom: '12px', display: 'block' }}></i>
        <p>Impossible de charger les statistiques. {error}</p>
        <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={fetchData}>
          <i className="fa-solid fa-rotate-right"></i> Réessayer
        </button>
      </div>
    </div>
  );

  const topAction = stats.actionBreakdown
    ? Object.entries(stats.actionBreakdown).sort((a, b) => b[1] - a[1])[0]
    : null;
  const healthColor = getHealthColor(stats.healthScore || 0);

  return (
    <div className="ov-container animate-fade-in">
      {/* Header */}
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text"><i className="fa-solid fa-chart-line"></i> Analytics</h2>
          <p className="subtitle">
            Statistiques réelles de modération — {guildInfo?.name || 'ce serveur'}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['7d', '30d', '90d'].map(r => (
            <button
              key={r}
              className={range === r ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => setRange(r)}
            >{r}</button>
          ))}
          <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={fetchData}>
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ov-stats-grid">
        {[
          { icon: 'fa-solid fa-gavel',             label: 'Total cases',      value: stats.totalCases ?? '—',           color: '#ff66b2', bg: 'rgba(255,102,178,0.12)' },
          { icon: 'fa-solid fa-bolt',               label: 'Actif (24h)',      value: stats.last24h ?? '—',              color: '#ffbb33', bg: 'rgba(255,187,51,0.12)'  },
          { icon: 'fa-solid fa-triangle-exclamation',label: 'Warnings',        value: stats.totalWarnings ?? '—',        color: '#ff8800', bg: 'rgba(255,136,0,0.12)'   },
          { icon: 'fa-solid fa-heart-pulse',        label: 'Health Score',     value: stats.healthScore != null ? `${stats.healthScore}%` : '—', color: healthColor, bg: `${healthColor}1a` },
          { icon: 'fa-solid fa-users',              label: 'Membres',          value: guildInfo?.memberCount ?? '—',     color: '#33b5e5', bg: 'rgba(51,181,229,0.12)'  },
          { icon: 'fa-solid fa-hashtag',            label: 'Salons',           value: guildInfo?.channelCount ?? '—',    color: '#aa66cc', bg: 'rgba(170,102,204,0.12)' },
          { icon: 'fa-solid fa-shield-halved',      label: 'Couches de protection', value: stats.activeProtectionLayers ?? 0, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { icon: 'fa-solid fa-bolt-lightning',     label: 'Action principale', value: topAction?.[0] ?? '—',           color: ACTION_COLORS[topAction?.[0]]?.color || '#ff66b2', bg: ACTION_COLORS[topAction?.[0]]?.bg || 'rgba(255,102,178,0.12)' },
        ].map((s, i) => (
          <div key={s.label} className="glass-panel ov-stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="ov-stat-icon" style={{ background: s.bg, color: s.color }}>
              <i className={s.icon}></i>
            </div>
            <div className="ov-stat-info">
              <span className="ov-stat-label">{s.label}</span>
              <span className="ov-stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Line + Donut */}
      <div className="ov-charts-row" style={{ gap: '16px', marginTop: '20px' }}>
        <div className="glass-panel ov-chart-card" style={{ flex: 2 }}>
          <div className="ov-chart-header">
            <h3><i className="fa-solid fa-chart-line" style={{ color: '#ff66b2' }}></i> Activité ({range})</h3>
          </div>
          {filteredDaily().length > 0
            ? <div style={{ height: '220px', position: 'relative' }}><canvas ref={lineRef}></canvas></div>
            : <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '8px' }}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: '2rem', opacity: 0.2 }}></i>
                <span>Pas encore de données sur cette période</span>
              </div>
          }
        </div>
        <div className="glass-panel ov-chart-card ov-chart-doughnut" style={{ flex: 1 }}>
          <div className="ov-chart-header">
            <h3><i className="fa-solid fa-chart-pie" style={{ color: '#ff66b2' }}></i> Répartition</h3>
          </div>
          {Object.keys(stats.actionBreakdown || {}).length > 0
            ? <div style={{ height: '220px', position: 'relative' }}><canvas ref={donutRef}></canvas></div>
            : <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '8px' }}>
                <i className="fa-solid fa-chart-pie" style={{ fontSize: '2rem', opacity: 0.2 }}></i>
                <span>Aucune action enregistrée</span>
              </div>
          }
        </div>
      </div>

      {/* Bar chart */}
      {Object.keys(stats.actionBreakdown || {}).length > 0 && (
        <div className="glass-panel" style={{ marginTop: '16px' }}>
          <div className="ov-chart-header">
            <h3><i className="fa-solid fa-chart-bar" style={{ color: '#ff66b2' }}></i> Actions par type</h3>
          </div>
          <div style={{ height: '200px', position: 'relative' }}>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
      )}

      {/* Recent Activity + Top Moderators */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        {/* Recent Activity */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '14px' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ color: '#ff66b2' }}></i> Activité récente
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: 400 }}>
              {stats.recentActivity?.length || 0} entrée{stats.recentActivity?.length !== 1 ? 's' : ''}
            </span>
          </h3>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {stats.recentActivity?.length > 0 ? stats.recentActivity.map(entry => {
              const meta = ACTION_COLORS[entry.action] || { color: '#94a3b8', bg: 'rgba(255,255,255,0.05)' };
              return (
                <div key={entry._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem' }}>
                    <i className={entry.action === 'BAN' ? 'fa-solid fa-hammer' : entry.action === 'WARN' ? 'fa-solid fa-triangle-exclamation' : entry.action === 'MUTE' ? 'fa-solid fa-volume-xmark' : entry.action === 'KICK' ? 'fa-solid fa-right-from-bracket' : 'fa-solid fa-shield'}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                      <span style={{ color: meta.color }}>{entry.action}</span>
                      {' '}<span style={{ color: '#ccc' }}>{entry.targetTag}</span>
                    </div>
                    {entry.reason && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.reason}</div>}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{relTime(entry.timestamp)}</span>
                </div>
              );
            }) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-inbox" style={{ fontSize: '1.5rem', opacity: 0.2, display: 'block', marginBottom: '8px' }}></i>
                Aucune activité récente
              </div>
            )}
          </div>
        </div>

        {/* Top Moderators */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '14px' }}>
            <i className="fa-solid fa-ranking-star" style={{ color: '#ff66b2' }}></i> Top Modérateurs
          </h3>
          {stats.topModerators?.length > 0 ? (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {stats.topModerators.map((mod, i) => (
                <div key={mod.moderatorId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? 'rgba(255,187,51,0.15)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#ffbb33' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, fontWeight: '700' }}>
                    {i === 0 ? <i className="fa-solid fa-crown"></i> : `#${i + 1}`}
                  </div>
                  <span style={{ flex: 1, fontWeight: '500', fontSize: '0.88rem' }}>{mod.moderatorTag}</span>
                  <span style={{ background: 'rgba(255,102,178,0.12)', color: '#ff66b2', padding: '3px 10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.8rem', flexShrink: 0 }}>
                    {mod.count} action{mod.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <i className="fa-solid fa-user-group" style={{ fontSize: '1.5rem', opacity: 0.2, display: 'block', marginBottom: '8px' }}></i>
              Aucun modérateur enregistré
            </div>
          )}

          {/* Top Targets */}
          {stats.topTargets?.length > 0 && (
            <>
              <h3 style={{ margin: '20px 0 14px' }}>
                <i className="fa-solid fa-user-slash" style={{ color: '#ff4444' }}></i> Utilisateurs ciblés
              </h3>
              {stats.topTargets.map((t, i) => (
                <div key={t.userId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,68,68,0.1)', color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, fontWeight: '700' }}>
                    {i + 1}
                  </div>
                  <span style={{ flex: 1, fontWeight: '500', fontSize: '0.88rem' }}>{t.targetTag}</span>
                  <span style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444', padding: '3px 10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.8rem', flexShrink: 0 }}>
                    {t.count} cas
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Config Coverage */}
      {stats.configCoverage && (
        <div className="glass-panel" style={{ marginTop: '16px', borderLeft: '3px solid #10b981' }}>
          <h3 style={{ marginBottom: '14px' }}><i className="fa-solid fa-shield-halved" style={{ color: '#10b981' }}></i> Couverture de protection</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Filtres statiques', value: `${stats.configCoverage.staticEnabled}/${stats.configCoverage.staticTotal}` },
              { label: 'Filtres IA', value: `${stats.configCoverage.aiEnabled}/${stats.configCoverage.aiTotal}` },
              { label: 'Mots bloqués', value: stats.configCoverage.wordsCount },
              { label: 'Domaines autorisés', value: stats.configCoverage.whitelistedDomains },
              { label: 'Actions auto', value: stats.configCoverage.automationsEnabled ? 'Oui' : 'Non' },
            ].map(f => (
              <div key={f.label} style={{ background: 'rgba(16,185,129,0.06)', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{f.label}</div>
                <div style={{ fontWeight: '600', color: '#10b981' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){.ov-charts-row{flex-direction:column!important} div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
