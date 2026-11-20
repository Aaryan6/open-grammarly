import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../lib/storage';
import { Settings as SettingsIcon, Sparkles } from 'lucide-react';

export default function Popup() {
  const [enabled, setEnabled] = useState(true);
  const [runMessage, setRunMessage] = useState('');
  const [hasKey, setHasKey] = useState(true);
  const [stats, setStats] = useState<{ lastScore: number | null }>({ lastScore: null });

  useEffect(() => {
    const load = () => chrome.storage.local.get('stats').then(r => r.stats && setStats(r.stats as typeof stats));
    load();
    const listener = (_: unknown, area: string) => area === 'local' && load();
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    getSettings().then(s => {
      setEnabled(s.enabled);
      setHasKey(!!(s.provider === 'google' ? s.googleKey : s.openRouterKey));
    });
  }, []);

  const toggleEnabled = async () => {
    const newState = !enabled;
    setEnabled(newState);
    await saveSettings({ enabled: newState });
  };

  const runAnalysisNow = async () => {
    setRunMessage('');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const res = tab?.id != null ? await chrome.tabs.sendMessage(tab.id, { type: 'RUN_ANALYSIS_NOW' }) : undefined;
      if (res?.started) window.close();
      else setRunMessage(res?.reason === 'short' ? 'Write a bit more text first.' : 'Click into a text field first.');
    } catch {
      setRunMessage('Click into a text field first. If you just reloaded the extension, reload this page too.');
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="header animate-in">
        <div className="logo-group">
          <div className="logo-icon">
            <Sparkles size={18} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="brand-name">Open Grammarly</span>
        </div>
        <button onClick={openOptions} className="settings-btn" title="Open Settings">
          <SettingsIcon size={18} />
        </button>
      </header>

      {/* Content */}
      <div className="content">
        {/* Status Row */}
        <div className="status-row animate-in delay-1">
          <div className="status-left">
            <div className={`status-dot ${enabled ? 'active' : ''}`} />
            <span className="status-label">{enabled ? 'Service Enabled' : 'Service Disabled'}</span>
          </div>
          <button
            onClick={toggleEnabled}
            className={`toggle ${enabled ? 'active' : ''}`}
            aria-label="Toggle service"
          />
        </div>

        {/* Stats Grid */}
        <div className="stats-grid animate-in delay-2">
          <div className="stat-card">
            <div className="stat-value">{stats.lastScore ?? '--'}</div>
            <div className="stat-label">Writing Score</div>
          </div>
          <button onClick={runAnalysisNow} disabled={!enabled} className="btn-primary">
            Check Grammar
          </button>
        </div>
        {runMessage && <div className="section-title">{runMessage}</div>}

        {!hasKey && (
          <div className="section-title" style={{ color: '#dc2626' }}>
            No API key set — checking is off until you add one in Settings.
          </div>
        )}
      </div>
    </div>
  );
}
