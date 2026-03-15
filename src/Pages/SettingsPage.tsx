import { useState } from 'react';
import { User, Bell, Shield, Palette, Globe, ChevronRight, Check, Loader } from 'lucide-react';
import { cn } from '../lib/utils';
import { useProfile } from '../context/ProfileContext';

const sections = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance',    label: 'Appearance',    icon: Palette },
  { id: 'privacy',       label: 'Privacy',       icon: Shield },
  { id: 'language',      label: 'Language',      icon: Globe },
];

const colorThemes = [
  { id: 'indigo',  label: 'Indigo',    desc: 'Default purple-blue',  color: '#6366f1' },
  { id: 'teal',    label: 'Teal',      desc: 'Cool cyan-green',      color: '#14b8a6' },
  { id: 'rose',    label: 'Rose',      desc: 'Warm pink-red',        color: '#f43f5e' },
  { id: 'amber',   label: 'Amber',     desc: 'Warm golden yellow',   color: '#f59e0b' },
  { id: 'emerald', label: 'Emerald',   desc: 'Fresh deep green',     color: '#10b981' },
  { id: 'violet',  label: 'Violet',    desc: 'Rich deep purple',     color: '#8b5cf6' },
];

export default function SettingsPage() {
  const { profile, loading, saving, error, updateProfile, saveProfile } = useProfile();
  const [active, setActive] = useState('profile');
  const [saved,  setSaved]  = useState(false);

  const handleSave = async () => {
    const ok = await saveProfile();
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
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
        {/* Sidebar nav */}
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
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{profile.display_name}</p>
                  <p className="text-text-dim text-sm">{profile.email || 'No email set'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Display Name</label>
                  <input
                    className="input-field w-full"
                    value={profile.display_name}
                    onChange={e => updateProfile({ display_name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Email</label>
                  <input
                    className="input-field w-full"
                    value={profile.email}
                    onChange={e => updateProfile({ email: e.target.value })}
                    placeholder="your@email.com"
                    type="email"
                  />
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
                  { label: 'Notify when a prompt is copied', value: profile.notif_copy, key: 'notif_copy' as const },
                  { label: 'Notify on new prompts added',    value: profile.notif_new,  key: 'notif_new'  as const },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <span className="text-sm">{item.label}</span>
                    <button
                      onClick={() => updateProfile({ [item.key]: !item.value })}
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
              <h3 className="font-bold text-lg">Accent Color</h3>
              <p className="text-text-dim text-sm -mt-4">Choose the accent color used across the app.</p>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {colorThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateProfile({ theme: t.id })}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                      profile.theme === t.id
                        ? 'border-white/30 bg-white/5 text-white'
                        : 'border-border-dim bg-white/[0.02] text-text-dim hover:text-white hover:bg-white/5'
                    )}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 shadow-lg"
                      style={{ backgroundColor: t.color, boxShadow: profile.theme === t.id ? '0 0 12px ' + t.color + '80' : 'none' }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-text-dim">{t.desc}</p>
                    </div>
                    {profile.theme === t.id && (
                      <Check size={18} style={{ color: t.color }} />
                    )}
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
                  { code: 'en', label: 'English',  flag: '🇬🇧' },
                  { code: 'es', label: 'Spanish',  flag: '🇪🇸' },
                  { code: 'fr', label: 'French',   flag: '🇫🇷' },
                  { code: 'de', label: 'German',   flag: '🇩🇪' },
                  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
                  { code: 'hi', label: 'Hindi',    flag: '🇮🇳' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => updateProfile({ language: l.code })}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                      profile.language === l.code
                        ? 'border-brand-primary bg-brand-primary/10 text-white'
                        : 'border-border-dim bg-white/5 text-text-dim hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{l.flag}</span>
                      <span className="text-sm">{l.label}</span>
                    </div>
                    {profile.language === l.code && <Check size={16} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

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


