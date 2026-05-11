import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Overview from '../components/Overview';
import Moderation from '../components/Moderation';
import AutoModeration from '../components/AutoModeration';
import LandingOverlay from '../components/LandingOverlay';
import Docs from '../components/Docs';
import CommandCenter from '../components/CommandCenter';
import AccountManager from '../components/AccountManager';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [activePage, setActivePage] = useState('overview');
  const [showLanding, setShowLanding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('zenith_token');
    if (!token) return navigate('/login');

    const payload = parseJwt(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('zenith_token');
      return navigate('/login');
    }

    const guilds = payload.allowedGuilds || [];
    
    if (guilds.length > 0 && typeof guilds[0] === 'string') {
      localStorage.removeItem('zenith_token');
      alert('Security schema updated. Please log in again.');
      return navigate('/login');
    }

    if (guilds.length === 0) {
      alert("Error: access Denied: You do not have Administrator permissions in any Zenith servers.");
      localStorage.removeItem('zenith_token');
      return navigate('/login');
    }

    setUser(payload);

    const savedGuild = localStorage.getItem('zenith_guild_id');
    if (!savedGuild || savedGuild === 'undefined' || !guilds.some(g => g.id === savedGuild)) {
      setShowLanding(true);
    } else {
      setSelectedGuild(savedGuild);
    }
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGuildSelect = (guildId) => {
    localStorage.setItem('zenith_guild_id', guildId);
    setSelectedGuild(guildId);
    setShowLanding(false);
  };

  const fetchDashboardData = async () => {
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedGuild]);

  const handleLogout = () => {
    localStorage.removeItem('zenith_token');
    localStorage.removeItem('zenith_guild_id');
    navigate('/login');
  };

  const pageTitleMap = {
    overview: 'Dashboard Overview',
    moderation: 'Server Moderation',
    automod: 'Auto Moderation',
    commands: 'Command Center',
    docs: 'Documentation & Help',
    account: 'Account Manager'
  };

  const requiresGuild = ['overview', 'moderation', 'automod'].includes(activePage);
  const canRenderPage = !showLanding && (!requiresGuild || selectedGuild);

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png?size=64`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  if (!user) return <div className="login-body"><div className="loader">Authenticating...</div></div>;

  return (
    <div className="app-container">
      {showLanding && <LandingOverlay guilds={user.allowedGuilds} onSelectGuild={handleGuildSelect} />}
      
      <Sidebar 
        user={user} 
        selectedGuild={selectedGuild} 
        onSelectGuild={handleGuildSelect} 
        activePage={activePage} 
        setActivePage={setActivePage} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-only" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: '#DBDEE1', fontSize: '1.4rem', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="topbar-title-wrap">
              <p className="topbar-eyebrow">zyntra Control Surface</p>
              <h1 style={{ margin: 0 }}>{pageTitleMap[activePage] || 'Zenith Dashboard'}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            
            {selectedGuild && user && (
              <div className="mobile-guild-selector mobile-only" onClick={() => { localStorage.removeItem('zenith_guild_id'); setShowLanding(true); }}>
                <img 
                  src={user.allowedGuilds.find(g => g.id === selectedGuild)?.icon 
                    ? `https://cdn.discordapp.com/icons/${selectedGuild}/${user.allowedGuilds.find(g => g.id === selectedGuild).icon}.png` 
                    : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  alt="" 
                />
                <span>{user.allowedGuilds.find(g => g.id === selectedGuild)?.name || 'Server'}</span>
              </div>
            )}
            
            {requiresGuild && (
              <button
                className="btn-icon"
                onClick={() => window.location.reload()}
                title="Reload Page"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
            )}

            {/* Modern Profile Widget */}
            <div className="topbar-profile-widget" ref={profileDropdownRef}>
              <button
                className="topbar-profile-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <img src={avatarUrl} alt="Profile" className="topbar-profile-avatar" />
                <span className="topbar-profile-name">{user.global_name || user.username}</span>
                <i className={`fa-solid fa-chevron-${profileDropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '0.65rem', opacity: 0.6 }}></i>
              </button>
              <div className={`topbar-profile-dropdown ${profileDropdownOpen ? 'active' : ''}`}>
                <div className="topbar-profile-dropdown-header">
                  <img src={avatarUrl} alt="" className="topbar-profile-dropdown-avatar" />
                  <div className="topbar-profile-dropdown-info">
                    <span className="topbar-profile-dropdown-name">{user.global_name || user.username}</span>
                    <span className="topbar-profile-dropdown-tag">@{user.username}</span>
                  </div>
                </div>
                <div className="topbar-profile-dropdown-divider" />
                <button className="topbar-profile-dropdown-item" onClick={() => { navigate('/'); setProfileDropdownOpen(false); }}>
                  <i className="fa-solid fa-house"></i> Home
                </button>
                <button className="topbar-profile-dropdown-item" onClick={() => { setActivePage('account'); setProfileDropdownOpen(false); }}>
                  <i className="fa-solid fa-user-gear"></i> Account Settings
                </button>
                <div className="topbar-profile-dropdown-divider" />
                <button className="topbar-profile-dropdown-item topbar-profile-logout" onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket"></i> Log Out
                </button>
              </div>
            </div>
            
          </div>
        </header>

        <div className="content-area">
          {canRenderPage && (
            <>
              {activePage === 'overview' && <Overview selectedGuild={selectedGuild} />}
              {activePage === 'moderation' && <Moderation selectedGuild={selectedGuild} />}
              {activePage === 'automod' && <AutoModeration selectedGuild={selectedGuild} />}
              {activePage === 'commands' && <CommandCenter />}
              {activePage === 'docs' && <Docs />}
              {activePage === 'account' && <AccountManager user={user} />}
            </>
          )}

          {!showLanding && requiresGuild && !selectedGuild && (
            <div className="dashboard-empty-state glass-panel">
              <div className="dashboard-empty-icon">
                <i className="fa-solid fa-building-shield"></i>
              </div>
              <h2>Select a Server</h2>
              <p>Pick a guild to open moderation analytics, automod controls, and server-specific insights.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  localStorage.removeItem('zenith_guild_id');
                  setShowLanding(true);
                }}
              >
                Choose Server
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
