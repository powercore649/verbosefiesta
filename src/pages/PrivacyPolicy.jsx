import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    icon: 'fa-solid fa-eye',
    content: `zyntra ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what data we collect, why we collect it, and how we use it when you use the zyntra platform.

By using zyntra, you agree to the collection and use of information in accordance with this policy. We will never sell your personal data to third parties.`
  },
  {
    id: 'collected',
    title: 'Data We Collect',
    icon: 'fa-solid fa-database',
    content: `When you authenticate with zyntra via Discord OAuth2, we receive:

• Discord User ID, username, and display name
• Avatar hash (to display your profile picture)
• Guild (server) membership and permissions
• OAuth2 access scopes you grant

When using the dashboard, we store:

• Moderation cases and warnings issued through the bot
• Server configuration and auto-moderation rules
• Usage analytics (which features are used, error rates)
• Session tokens (JWT) stored locally in your browser

We do NOT collect: passwords, email addresses (unless voluntarily provided), payment information, or private messages.`
  },
  {
    id: 'usage',
    title: 'How We Use Your Data',
    icon: 'fa-solid fa-gear',
    content: `We use the data we collect to:

• Authenticate you and authorize access to server dashboards
• Display moderation history, analytics, and server statistics
• Power auto-moderation features and execute bot commands
• Improve platform reliability, performance, and features
• Detect and prevent abuse, fraud, and security incidents

We do not use your data for advertising, profiling, or any purpose beyond operating the zyntra service.`
  },
  {
    id: 'storage',
    title: 'Data Storage & Security',
    icon: 'fa-solid fa-lock',
    content: `Your data is stored on secured servers with access controls. Session tokens are stored in your browser's localStorage and expire automatically.

We implement industry-standard security practices including encrypted connections (HTTPS/TLS), rate limiting, and access logging.

Moderation data is retained as long as your server uses zyntra. You may request deletion at any time.`
  },
  {
    id: 'sharing',
    title: 'Data Sharing',
    icon: 'fa-solid fa-share-nodes',
    content: `We do not sell, trade, or rent your personal information to third parties.

We may share data with:

• Discord — to authenticate users and interact with the Discord API
• Infrastructure providers — hosting and database services, under strict data processing agreements
• Law enforcement — only when required by law or to protect the safety of users

We require all third-party service providers to maintain the confidentiality and security of your data.`
  },
  {
    id: 'rights',
    title: 'Your Rights',
    icon: 'fa-solid fa-user-shield',
    content: `You have the right to:

• Access the data we hold about you
• Request correction of inaccurate data
• Request deletion of your data ("right to be forgotten")
• Withdraw consent for data processing at any time
• Data portability — receive your data in a machine-readable format

To exercise any of these rights, contact us through our Discord support server. We will respond within 30 days.`
  },
  {
    id: 'cookies',
    title: 'Cookies & Local Storage',
    icon: 'fa-solid fa-cookie-bite',
    content: `zyntra does not use tracking cookies. We use browser localStorage to store:

• Your session token (zenith_token) — required for authentication
• Your preferences (zenith_preferences) — dashboard settings
• Notification read state — to track which alerts you've seen
• Guild selection — to remember your last selected server

This data never leaves your browser and is not transmitted to any third party. You can clear it at any time through your browser settings or the Account Manager in the dashboard.`
  },
  {
    id: 'children',
    title: "Children's Privacy",
    icon: 'fa-solid fa-child',
    content: `zyntra is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13.

If you believe a child under 13 has provided us with personal information, please contact us immediately and we will take steps to remove that information.`
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    icon: 'fa-solid fa-clock-rotate-left',
    content: `We may update this Privacy Policy from time to time. We will notify users of significant changes through the dashboard or our Discord support server.

The date of the last update is displayed at the top of this page. Continued use of the Service after changes constitutes acceptance of the updated policy.

Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
  },
  {
    id: 'contact',
    title: 'Contact Us',
    icon: 'fa-solid fa-envelope',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy, please reach out to us:

• Discord Support Server — the fastest way to reach us
• Dashboard Feedback — use the feedback option in the Account Manager

We take privacy seriously and will respond to all legitimate inquiries promptly.`
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #080911)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,9,17,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '1.1rem' }}>
            <span style={{ background: 'linear-gradient(135deg,#ff66b2,#8A5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>zyntra</span>
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-arrow-left"></i> Back
            </button>
            <button onClick={() => navigate('/tos')} style={{ background: 'rgba(255,102,178,0.1)', border: '1px solid rgba(255,102,178,0.2)', borderRadius: '8px', padding: '7px 16px', color: '#ff66b2', cursor: 'pointer', fontSize: '0.85rem' }}>
              Terms of Service
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Sidebar TOC */}
        <aside style={{ width: '220px', flexShrink: 0, position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', paddingLeft: '10px' }}>Contents</p>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setActive(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
                fontSize: '0.82rem', transition: 'all 0.15s',
                background: active === s.id ? 'rgba(255,102,178,0.1)' : 'transparent',
                color: active === s.id ? '#ff66b2' : 'rgba(255,255,255,0.5)',
                borderLeft: active === s.id ? '2px solid #ff66b2' : '2px solid transparent',
              }}
            >
              <i className={s.icon} style={{ width: '14px', fontSize: '0.75rem' }}></i>
              {s.title}
            </a>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,102,178,0.1)', color: '#ff66b2', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,102,178,0.2)' }}>Legal</span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '16px 0 8px' }}>Privacy Policy</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
              Effective date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Your privacy matters to us.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SECTIONS.map((s, i) => (
              <div key={s.id} id={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,102,178,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={s.icon} style={{ color: '#ff66b2', fontSize: '0.9rem' }}></i>
                  </div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)', marginRight: '8px', fontSize: '0.85rem' }}>{String(i + 1).padStart(2, '0')}</span>
                    {s.title}
                  </h2>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                  {s.content}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg,#ff66b2,#d4418e)', border: 'none', borderRadius: '10px', padding: '12px 28px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-house"></i> Back to Home
            </button>
            <button onClick={() => navigate('/tos')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 28px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
              Terms of Service →
            </button>
          </div>
        </main>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', marginTop: '48px' }}>
        © {new Date().getFullYear()} zyntra · <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', color: '#ff66b2', cursor: 'pointer', fontSize: '0.8rem' }}>Privacy Policy</button> · <button onClick={() => navigate('/tos')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.8rem' }}>Terms of Service</button>
      </footer>
    </div>
  );
}
