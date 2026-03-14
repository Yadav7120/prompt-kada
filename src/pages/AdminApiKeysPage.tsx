import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check, X, Zap } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { ApiKey, AI_PROVIDERS } from '../types';

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [showKey, setShowKey] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchKeys = () => {
    fetch('/api/admin/api-keys', { headers })
      .then(r => r.json())
      .then(data => { setKeys(data); setLoading(false); });
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleAdd = async () => {
    if (!label.trim() || !apiKey.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/api-keys', {
      method: 'POST',
      headers,
      body: JSON.stringify({ label, provider, api_key: apiKey, default_model: defaultModel || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setLabel(''); setApiKey(''); setDefaultModel(''); setProvider('openai');
      fetchKeys();
      showToast('API key added!');
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE', headers });
    fetchKeys();
    showToast('Key deleted.');
  };

  const handleToggle = async (key: ApiKey) => {
    await fetch(`/api/admin/api-keys/${key.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ label: key.label, default_model: key.default_model, is_active: !key.is_active }),
    });
    fetchKeys();
  };

  const providerColors: Record<string, string> = {
    openai: 'text-green-400 bg-green-500/10',
    anthropic: 'text-orange-400 bg-orange-500/10',
    gemini: 'text-blue-400 bg-blue-500/10',
    groq: 'text-purple-400 bg-purple-500/10',
    cohere: 'text-pink-400 bg-pink-500/10',
    mistral: 'text-yellow-400 bg-yellow-500/10',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-brand-primary text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <Check size={16} /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">AI API Keys</h2>
          <p className="text-text-dim text-sm">Manage your AI provider connections.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Key'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass-card p-6 mb-6 border border-brand-primary/30">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-brand-primary" /> New API Key
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Label</label>
              <input
                className="input-field w-full"
                placeholder="e.g. My OpenAI Key"
                value={label}
                onChange={e => setLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Provider</label>
              <select
                className="input-field w-full"
                value={provider}
                onChange={e => {
                  setProvider(e.target.value);
                  const p = AI_PROVIDERS.find(p => p.value === e.target.value);
                  if (p) setDefaultModel(p.defaultModel);
                }}
              >
                {AI_PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">API Key</label>
              <input
                className="input-field w-full font-mono"
                placeholder="sk-..."
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">
                Default Model <span className="text-text-dim/50 normal-case">(optional)</span>
              </label>
              <input
                className="input-field w-full"
                placeholder={AI_PROVIDERS.find(p => p.value === provider)?.defaultModel}
                value={defaultModel}
                onChange={e => setDefaultModel(e.target.value)}
              />
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : <><Check size={18} /> Save Key</>}
          </button>
        </div>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="glass-card h-20 animate-pulse bg-white/5" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Zap size={40} className="text-text-dim mx-auto mb-4" />
          <p className="text-text-dim">No API keys yet. Add one to start testing prompts against AI.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map(key => (
            <div key={key.id} className={cn(
              'glass-card p-5 flex items-center gap-4 transition-all',
              !key.is_active && 'opacity-50'
            )}>
              <div className={cn('px-3 py-1 rounded-lg text-xs font-bold uppercase', providerColors[key.provider] || 'text-white bg-white/10')}>
                {key.provider}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{key.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-mono text-text-dim">
                    {showKey === key.id ? key.masked_key : '••••••••••••••••'}
                  </p>
                  <button onClick={() => setShowKey(showKey === key.id ? null : key.id)} className="text-text-dim hover:text-white">
                    {showKey === key.id ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                {key.default_model && (
                  <p className="text-[10px] text-text-dim mt-1">Model: {key.default_model}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(key)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-all relative',
                    key.is_active ? 'bg-brand-primary' : 'bg-white/10'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                    key.is_active ? 'left-6' : 'left-1'
                  )} />
                </button>
                <button onClick={() => handleDelete(key.id)} className="p-2 text-text-dim hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
          }

