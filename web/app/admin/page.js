'use client';

import { useState } from 'react';
import StatusCard from '@/components/StatusCard';
import SubmissionList from '@/components/SubmissionList';
import RuleExtractor from '@/components/RuleExtractor';
import RulesList from '@/components/RulesList';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'dashboard' },
  { key: 'submissions', label: 'Submissions', icon: 'inbox' },
  { key: 'rules', label: 'Rules', icon: 'gavel' },
  { key: 'stats', label: 'Bot Stats', icon: 'monitoring' },
];

const TOP_TABS = [
  { key: 'overview', label: 'Dashboard' },
  { key: 'submissions', label: 'Reports' },
  { key: 'rules', label: 'Rules' },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractSub, setExtractSub] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      setAuthed(true);
    } else {
      setError(true);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="glow-blob w-[500px] h-[500px] bg-primary top-[-200px] right-[-100px] absolute" />

        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">security</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface text-center mb-1">Guardian Admin</h1>
          <p className="text-on-surface-variant text-sm text-center mb-8">Authenticate to access the control panel</p>

          <form onSubmit={handleLogin} className="bg-surface-container-low rounded-2xl p-8 space-y-6">
            <div>
              <label className="sentinel-label block mb-3">Access Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="stealth-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
            {error && (
              <p className="flex items-center justify-center gap-1.5 text-tertiary text-sm">
                <span className="material-symbols-outlined text-lg">error</span>
                Invalid access key.
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  function handleNavClick(key) {
    setActiveTab(key);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'flex fixed inset-y-0 left-0 z-30' : 'hidden'} md:flex md:relative md:z-auto w-64 bg-surface-container-low flex-col min-h-screen shrink-0`}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">security</span>
            <span className="font-headline font-bold text-on-surface">Sentinel</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 ml-8">
            Guardian Admin / Protocol v4.2
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar bottom */}
        <div className="px-3 pb-4 space-y-2">
          <button className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
            <span className="material-symbols-outlined text-lg">radar</span>
            Scan Now
          </button>
          <div className="flex items-center justify-between px-3 pt-2">
            <button className="text-on-surface-variant hover:text-on-surface text-xs flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm">help</span>
              Help
            </button>
            <button
              onClick={() => setAuthed(false)}
              className="text-on-surface-variant hover:text-tertiary text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-surface-container-low/50">
          <div className="flex items-center gap-3 md:gap-6">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-all"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <h1 className="font-headline font-semibold text-on-surface text-base md:text-lg">WhatsApp Spam Guard</h1>
            <div className="hidden sm:flex items-center gap-1">
              {TOP_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {(activeTab === 'overview' || activeTab === 'stats') && (
            <StatusCard />
          )}

          {(activeTab === 'overview' || activeTab === 'submissions') && (
            <div className={activeTab === 'overview' ? 'mt-6' : ''}>
              <SubmissionList onAddRule={(sub) => setExtractSub(sub)} refreshKey={refreshKey} />
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'rules') && (
            <div className={activeTab !== 'rules' ? 'mt-6' : ''}>
              <RulesList refreshKey={refreshKey} />
            </div>
          )}
        </main>
      </div>

      {extractSub && (
        <RuleExtractor
          submission={extractSub}
          onClose={() => setExtractSub(null)}
          onDone={() => {
            setExtractSub(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
