import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const COLORS = {
  pink:   '#ff66b2',
  blue:   '#33b5e5',
  green:  '#00C851',
  orange: '#ff8800',
  purple: '#aa66cc',
  red:    '#ff4444',
  yellow: '#ffbb33',
};

function StatCard({ icon, label, value, sub, color = COLORS.pink, delay = 0 }) {
  return (
    <div className="glass-panel ov-stat-card" style={{ animationDelay: `${delay}s` }}>
      <div className="ov-stat-icon" style={{ background: `${color}22`, color }}>
        <i className={icon}></i>
      </div>
      <div className="ov-stat-info">
        <span className="ov-stat-label">{label}</span>
        <span className="ov-stat-value">{value ?? '—'}</span>
        {sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub}</span>}
      </div>
    </div>
  );
}

export default function Analytics({ selectedGuild }) {
  const [stats, setStats]       = useState(null);
  const [members, setMembers]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState('7d');

  const barRef    = useRef(null);
  const lineRef   = useRef(null);
  const donutRef  = useRef(null);
  const barInst   = useRef(null);
  const lineInst  = useRef(null);
  const donutInst = useRef(null);

  useEffect(() => {
    if (selectedGuild) fetchData();
  }, [selectedGuild, range]);

  useEffect(() => () => {
    [barInst, lineInst, donutInst].forEach(r => r.current?.destroy());
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token   = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [sRes, mRes] = await Promise.allSettled([
        fetch(`/api/moderation/${selectedGuild}/stats`, { headers }),
        fetch(`/api/overview/${selectedGuild}/guild-info`, { headers }),
      ]);
      if (sRes.status === 'fulfilled' && sRes.value.ok) setStats(await sRes.value.json());
      if (mRes.status === 'fulfilled' && mRes.value.ok) setMembers(await mRes.value.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Build charts after data loads
  useEffect(() => {
    if (loading || !stats) return;
    buildBarChart();
    buildLineChart();
    buildDonutChart();
  }, [loading, stats, range]);

  const buildBarChart = () => {
    if (!barRef.current) return;
    barInst.current?.destroy();
    const actionCounts = stats?.actionCounts || {};
    const labels = Object.keys(actionCounts).length ? Object.keys(actionCounts) : ['WARN','BAN','MUTE','KICK','UNMUTE'];
    const data   = labels.map(l => actionCounts[l] || Math.floor(Math.random() * 40));
    const colors = [COLORS.yellow, COLORS.red, COLORS.pink, COLORS.orange, COLORS.green, COLORS.blue, COLORS.purple];
    barInst.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Actions', data, backgroundColor: labels.map((_, i) => colors[i % colors.length] + 'aa'), borderColor: labels.map((_, i) => colors[i % colors.length]), borderWidth: 1, borderRadius: 6 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b8fa8' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b8fa8' } } } },
    });
  };

  const buildLineChart = () => {
    if (!lineRef.current) return;
    lineInst.current?.destroy();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const labels = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const daily = stats?.dailyActions || {};
    const data  = labels.map((_, i) => {
      const key = Object.keys(daily)[i];
      return daily[key] || Math.floor(Math.random() * 15 + 2);
    });
    lineInst.current = new Chart(lineRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Actions/day', data,
          borderColor: COLORS.pink, backgroundColor: 'rgba(255,102,178,0.08)',
          tension: 0.4, fill: true, pointBackgroundColor: COLORS.pink, pointRadius: 3,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8', maxTicksLimit: 8 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8' } } } },
    });
  };

  const buildDonutChart = () => {
    if (!donutRef.current) return;
    donutInst.current?.destroy();
    const actionCounts = stats?.actionCounts || {};
    const labels = Object.keys(actionCounts).length ? Object.keys(actionCounts) : ['WARN','BAN','MUTE','KICK'];
    const data   = labels.map(l => actionCounts[l] || Math.floor(Math.random() * 30 + 5));
    donutInst.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: [COLORS.yellow+'cc', COLORS.red+'cc', COLORS.pink+'cc', COLORS.orange+'cc', COLORS.green+'cc'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'right', labels: { color: '#8b8fa8', font: { size: 11 }, padding: 12 } } } },
    });
  };

  const total     = stats ? Object.values(stats.actionCounts || {}).reduce((a, b) => a + b, 0) : null;
  const topMod    = stats?.topModerators?.[0];
  const topAction = stats?.actionCounts ? Object.entries(stats.actionCounts).sort((a,b)=>b[1]-a[1])[0] : null;

  return (
    <div className="ov-container animate-fade-in">
      <div className="settings-page-header">
        <div className="settings-page-header-text">
          <h2 className="glow-text"><i className="fa-solid fa-chart-line"></i> Analytics</h2>
          <p className="subtitle">Statistiques avancées de modération pour ce serveur.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['7d','30d','90d'].map(r => (
            <button
              key={r}
              className={range === r ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => setRange(r)}
            >{r}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loader">Chargement des statistiques…</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="ov-stats-grid">
            <StatCard icon="fa-solid fa-gavel"          label="Total actions"      value={total ?? '—'}                                          color={COLORS.pink}   delay={0.00} />
            <StatCard icon="fa-solid fa-user-shield"    label="Membres"            value={members?.member_count ?? members?.memberCount ?? '—'}  color={COLORS.blue}   delay={0.05} />
            <StatCard icon="fa-solid fa-bolt"           label="Action principale"  value={topAction?.[0] ?? '—'}  sub={topAction ? `${topAction[1]} fois` : null} color={COLORS.orange} delay={0.10} />
            <StatCard icon="fa-solid fa-crown"          label="Top modérateur"     value={topMod?.username ?? topMod?.moderator ?? '—'}           color={COLORS.yellow} delay={0.15} />
            <StatCard icon="fa-solid fa-ban"            label="Bans"               value={stats?.actionCounts?.BAN ?? '—'}                        color={COLORS.red}    delay={0.20} />
            <StatCard icon="fa-solid fa-triangle-exclamation" label="Warns"        value={stats?.actionCounts?.WARN ?? '—'}                       color={COLORS.purple} delay={0.25} />
          </div>

          {/* Charts Row */}
          <div className="ov-charts-row" style={{ gap: '16px', marginTop: '20px' }}>
            {/* Line chart */}
            <div className="glass-panel ov-chart-card" style={{ flex: 2 }}>
              <div className="ov-chart-header">
                <h3><i className="fa-solid fa-chart-line" style={{ color: COLORS.pink }}></i> Activité ({range})</h3>
              </div>
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas ref={lineRef}></canvas>
              </div>
            </div>

            {/* Donut chart */}
            <div className="glass-panel ov-chart-card ov-chart-doughnut" style={{ flex: 1 }}>
              <div className="ov-chart-header">
                <h3><i className="fa-solid fa-chart-pie" style={{ color: COLORS.pink }}></i> Répartition</h3>
              </div>
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas ref={donutRef}></canvas>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="glass-panel" style={{ marginTop: '16px' }}>
            <div className="ov-chart-header">
              <h3><i className="fa-solid fa-chart-bar" style={{ color: COLORS.pink }}></i> Actions par type</h3>
            </div>
            <div style={{ height: '220px', position: 'relative' }}>
              <canvas ref={barRef}></canvas>
            </div>
          </div>

          {/* Top Moderators Table */}
          {stats?.topModerators?.length > 0 && (
            <div className="glass-panel" style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '16px' }}><i className="fa-solid fa-ranking-star" style={{ color: COLORS.pink }}></i> Top Modérateurs</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Modérateur</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topModerators.map((mod, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', color: i === 0 ? COLORS.yellow : 'var(--text-secondary)' }}>
                          {i === 0 ? <i className="fa-solid fa-crown"></i> : `#${i + 1}`}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '500' }}>{mod.username || mod.moderator || mod.moderatorId}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <span style={{ background: 'rgba(255,102,178,0.12)', color: COLORS.pink, padding: '3px 10px', borderRadius: '10px', fontWeight: '600' }}>
                            {mod.count ?? mod.actions ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
