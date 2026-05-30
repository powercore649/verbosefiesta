import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    icon: 'fa-solid fa-handshake',
    content: `By accessing or using the zyntra platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.

These Terms apply to all users of zyntra, including Discord server administrators, moderators, and any other individuals who access the Service through our dashboard or API.

We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms.`
  },
  {
    id: 'use',
    title: 'Permitted Use',
    icon: 'fa-solid fa-circle-check',
    content: `You may use zyntra solely for lawful purposes and in accordance with these Terms. You agree not to use the Service to:

• Violate any applicable laws or regulations
• Harass, abuse, or harm any individual or group
• Attempt to bypass, disable, or circumvent any security features
• Scrape, crawl, or automatically extract data without permission
• Distribute malware, spam, or other harmful content
• Impersonate zyntra, its staff, or other users

Authorized use includes: moderation of Discord servers you administer, reviewing analytics for servers you have permission to manage, and configuring auto-moderation rules for your community.`
  },
  {
    id: 'account',
    title: 'Account & Authentication',
    icon: 'fa-brands fa-discord',
    content: `zyntra uses Discord OAuth2 for authentication. By logging in, you grant zyntra read access to your Discord account information, including your username, avatar, and guild membership.

You are responsible for maintaining the confidentiality of your session token. You agree to notify us immediately of any unauthorized use of your account.

We do not store your Discord password. Session tokens expire automatically and can be revoked at any time through the Account Manager.`
  },
  {
    id: 'data',
    title: 'Data & Privacy',
    icon: 'fa-solid fa-shield-halved',
    content: `zyntra collects moderation data — including cases, warnings, and server statistics — solely to provide the Service. This data is associated with Discord server IDs and user IDs, not personal identities.

We do not sell your data to third parties. Moderation logs are retained to support appeals and audit trails. You may request deletion of your server's data by contacting our support team.

For full details, please review our Privacy Policy.`
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    icon: 'fa-solid fa-copyright',
    content: `All content, branding, and code comprising the zyntra platform are the exclusive intellectual property of zyntra and its licensors. You may not copy, reproduce, distribute, or create derivative works without express written permission.

The zyntra name, logo, and visual identity may not be used in any manner that implies endorsement or affiliation without prior written consent.`
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer of Warranties',
    icon: 'fa-solid fa-triangle-exclamation',
    content: `The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. zyntra does not warrant that the Service will be uninterrupted, error-free, or free of harmful components.

You use the Service at your own risk. zyntra is not responsible for decisions made based on moderation data, analytics, or automated actions taken by the bot.`
  },
  {
    id: 'limitation',
    title: 'Limitation of Liability',
    icon: 'fa-solid fa-scale-balanced',
    content: `To the maximum extent permitted by law, zyntra shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.

Our total liability to you for any claim arising from these Terms or your use of the Service shall not exceed the amount you paid us in the twelve months preceding the claim (if any).`
  },
  {
    id: 'termination',
    title: 'Termination',
    icon: 'fa-solid fa-ban',
    content: `We may suspend or terminate your access to zyntra at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.

Upon termination, your right to use the Service immediately ceases. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.`
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: 'fa-solid fa-envelope',
    content: `If you have questions about these Terms of Service, please contact us through our official Discord support server or via the feedback channel in the dashboard.

Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
  },
];

export default function TermsOfService() {
  const navigate = useNavigate();
  const [active, setActive] = useState('acceptance');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #080911)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,9,17,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1.1rem' }}>
            <span style={{ background: 'linear-gradient(135deg,#ff66b2,#8A5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>zyntra</span>
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-arrow-left"></i> Back
            </button>
            <button onClick={() => navigate('/privacy')} style={{ background: 'rgba(255,102,178,0.1)', border: '1px solid rgba(255,102,178,0.2)', borderRadius: '8px', padding: '7px 16px', color: '#ff66b2', cursor: 'pointer', fontSize: '0.85rem' }}>
              Privacy Policy
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
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '16px 0 8px' }}>Terms of Service</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
              Effective date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Please read carefully before using zyntra.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {SECTIONS.map((s, i) => (
              <div key={s.id} id={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '28px 32px', marginBottom: '12px' }}>
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

          {/* Footer actions */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg,#ff66b2,#d4418e)', border: 'none', borderRadius: '10px', padding: '12px 28px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-house"></i> Back to Home
            </button>
            <button onClick={() => navigate('/privacy')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 28px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
              Privacy Policy →
            </button>
          </div>
        </main>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', marginTop: '48px' }}>
        © {new Date().getFullYear()} zyntra · <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.8rem' }}>Privacy Policy</button> · <button onClick={() => navigate('/tos')} style={{ background: 'none', border: 'none', color: '#ff66b2', cursor: 'pointer', fontSize: '0.8rem' }}>Terms of Service</button>
      </footer>
    </div>
  );
}
