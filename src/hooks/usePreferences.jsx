import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const PREFS_KEY = 'zenith_preferences';
const HISTORY_KEY = 'zenith_settings_history';

const DEFAULT_PREFS = {
  compactMode: false,
  notificationSounds: false,
  autoRefresh: false,
  showMemberCount: false,
};

const PREF_LABELS = {
  compactMode: 'Compact Mode',
  notificationSounds: 'Notification Sounds',
  autoRefresh: 'Auto-Refresh Dashboard',
  showMemberCount: 'Show Server Member Count',
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : { ...DEFAULT_PREFS };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  });

  const audioCtxRef = useRef(null);

  // Persist prefs to localStorage
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Apply compact-mode class to body
  useEffect(() => {
    if (prefs.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [prefs.compactMode]);

  const recordHistory = useCallback((key, from, to) => {
    try {
      const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        key,
        label: PREF_LABELS[key] || key,
        from,
        to,
        timestamp: new Date().toISOString(),
      };
      const updated = [entry, ...existing].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const setPreference = useCallback((key, value) => {
    setPrefs(prev => {
      recordHistory(key, prev[key], value);
      return { ...prev, [key]: value };
    });
  }, [recordHistory]);

  const resetPrefs = useCallback(() => {
    setPrefs({ ...DEFAULT_PREFS });
    localStorage.setItem(PREFS_KEY, JSON.stringify(DEFAULT_PREFS));
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('[Notification Sound]', e);
    }
  }, []);

  const customizedCount = Object.entries(prefs).filter(
    ([k, v]) => DEFAULT_PREFS[k] !== v
  ).length;

  return (
    <PreferencesContext.Provider value={{
      prefs,
      setPreference,
      resetPrefs,
      playNotificationSound,
      customizedCount,
      PREF_LABELS,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
