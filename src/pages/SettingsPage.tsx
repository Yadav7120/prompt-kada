import { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Globe, ChevronRight, Check, Loader } from 'lucide-react';
import { cn } from '../lib/utils';

const sections = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance',    label: 'Appearance',    icon: Palette },
  { id: 'privacy',       label: 'Privacy',       icon: Shield },
  { id: 'language',      label: 'Language',      icon: Globe },
];

export default function SettingsPage() {
  const [active, setActive]         = useState('profile');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');

  // Profile state
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [notifCopy, setNotifCopy]   = useState(true);
  const [notifNew, setNotifNew]     = useState(false);
  const [theme, setTheme]           = useState('dark');
  const [language, setLanguage]     = useState('en');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Load profile on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/profile', { headers })
      .then(r => r.json())
      .then(data => {
        setName(data.display_name || '');
        setEmail(data.email || '');
        setNotifCopy(Boolean(data.notif_copy));
        setNotifNew(Boolean(data.notif_new));
        setTheme(data.theme || 'dark');
        setLanguage(data.language || 'en');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          display_name: name,
          email,
          theme,
          language,
          notif_copy: notifCopy,
          notif_new:  notifNew,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const d = await res.json();
        setError(d.message || 'Failed to save.');
      }
    } catch {
      setError('Network error. Try again.');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={28} className="animate-spin text-brand-primary" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-text-dim text-sm">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 glass-card p-3 h-fit">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all',
                active === s.id
                  ? 'bg-brand-primary/10 text-white border-r-4 border-brand-primary'
                  : 'text-text-dim hover:text-white hover:bg-white/5'
              )}
            >
              <div className="flex items-center gap-3">
                <s.icon size={18} />
                <span>{s.label}</span>
              </div>
              <ChevronRight size={14} className="opacity-40" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass-card p-6 space-y-6">

          {/* ── Profile ── */}
          {active === 'profile' && (
            <>
              <h3 className="font-bold text-lg">Profile</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-2xl font-bold">
                  {name.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-medium">{name || 'No name set'}</p>
                  <p className="text-text-dim text-sm">Admin</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Display Name</label>
                  <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Email</label>
                  <input className="input-field w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" />
                </div>
              </div>
            </>
          )}

          {/* ── Notifications ── */}
          {active === 'notifications' && (
            <>
              <h3 className="font-bold text-lg">Notifications</h3>
              <div className="space-y-4">
                {[
                  { label: 'Notify when a prompt is copied', value: notifCopy, set: setNotifCopy },
                  { label: 'Notify on new prompts added',    value: notifNew,  set: setNotifNew  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <span className="text-sm">{item.label}</span>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={cn('w-11 h-6 rounded-full transition-all relative', item.value ? 'bg-brand-primary' : 'bg-white/10')}
                    >
                      <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all', item.value ? 'left-6' : 'left-1')} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Appearance ── */}
          {active === 'appearance' && (
            <>
              <h3 className="font-bold text-lg">Appearance</h3>
              <div className="space-y-3">
                {['dark', 'darker', 'midnight'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                      theme === t ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-border-dim bg-white/5 text-text-dim hover:text-white'
                    )}
                  >
                    <span className="capitalize text-sm">{t} Mode</span>
                    {theme === t && <Check size={16} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Privacy ── */}
          {active === 'privacy' && (
            <>
              <h3 className="font-bold text-lg">Privacy</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm font-medium mb-1">Public Profile</p>
                  <p className="text-xs text-text-dim">Your prompts are visible to everyone.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm font-medium mb-1">Data & Usage</p>
                  <p className="text-xs text-text-dim">We only store prompt data you create. No tracking.</p>
                </div>
                <button className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm hover:bg-red-500/20 transition-all">
                  Delete Account
                </button>
              </div>
            </>
          )}

          {/* ── Language ── */}
          {active === 'language' && (
            <>
              <h3 className="font-bold text-lg">Language</h3>
              <div className="space-y-3">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'es', label: 'Spanish' },
                  { code: 'fr', label: 'French' },
                  { code: 'de', label: 'German' },
                  { code: 'ja', label: 'Japanese' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                      language === l.code ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-border-dim bg-white/5 text-text-dim hover:text-white'
                    )}
                  >
                    <span className="text-sm">{l.label}</span>
                    {language === l.code && <Check size={16} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Error */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn('btn-primary w-full justify-center mt-4', saved && 'bg-green-500 hover:bg-green-600')}
          >
            {saving ? (
              <><Loader size={18} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check size={18} /> Saved!</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
          }
