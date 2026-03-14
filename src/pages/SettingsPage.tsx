import { useState } from 'react';
import { User, Bell, Shield, Palette, Globe, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'language', label: 'Language', icon: Globe },
];

export default function SettingsPage() {
  const [active, setActive] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex@example.com');
  const [notifCopy, setNotifCopy] = useState(true);
  const [notifNew, setNotifNew] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
          {active === 'profile' && (
            <>
              <h3 className="font-bold text-lg">Profile</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-2xl font-bold">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-text-dim text-sm">Pro Member</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Display Name</label>
                  <input
                    className="input-field w-full"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Email</label>
                  <input
                    className="input-field w-full"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {active === 'notifications' && (
            <>
              <h3 className="font-bold text-lg">Notifications</h3>
              <div className="space-y-4">
                {[
                  { label: 'Notify when a prompt is copied', value: notifCopy, set: setNotifCopy },
                  { label: 'Notify on new prompts added', value: notifNew, set: setNotifNew },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <span className="text-sm">{item.label}</span>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-all relative',
                        item.value ? 'bg-brand-primary' : 'bg-white/10'
                      )}
                    >
                      <span className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                        item.value ? 'left-6' : 'left-1'
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

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
                      theme === t
                        ? 'border-brand-primary bg-brand-primary/10 text-white'
                        : 'border-border-dim bg-white/5 text-text-dim hover:text-white'
                    )}
                  >
                    <span className="capitalize text-sm">{t} Mode</span>
                    {theme === t && <Check size={16} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

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
                      language === l.code
                        ? 'border-brand-primary bg-brand-primary/10 text-white'
                        : 'border-border-dim bg-white/5 text-text-dim hover:text-white'
                    )}
                  >
                    <span className="text-sm">{l.label}</span>
                    {language === l.code && <Check size={16} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            className={cn(
              'btn-primary w-full justify-center mt-4',
              saved && 'bg-green-500 hover:bg-green-600'
            )}
          >
            {saved ? <><Check size={18} /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
                  }
