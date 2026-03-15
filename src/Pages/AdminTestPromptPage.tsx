import { useState, useEffect } from 'react';
import { Play, Clock, Zap, ChevronDown, Copy, Check } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Prompt, ApiKey, TestHistoryEntry } from '../types';

export default function AdminTestPromptPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [history, setHistory] = useState<TestHistoryEntry[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [result, setResult] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [modelUsed, setModelUsed] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'test' | 'history'>('test');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/admin/prompts', { headers }).then(r => r.json()).then(setPrompts);
    fetch('/api/admin/api-keys', { headers }).then(r => r.json()).then(setKeys);
    fetch('/api/admin/test-history', { headers }).then(r => r.json()).then(setHistory);
  }, []);

  const handleTest = async () => {
    if (!selectedPrompt || !selectedKey) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/test-prompt', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt_id: Number(selectedPrompt),
          api_key_id: Number(selectedKey),
          model: customModel || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.response);
        setTokensUsed(data.tokens_used);
        setModelUsed(data.model);
        // Refresh history
        fetch('/api/admin/test-history', { headers }).then(r => r.json()).then(setHistory);
      } else {
        setResult(`Error: ${data.message}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeKeys = keys.filter(k => k.is_active);
  const selectedKeyData = keys.find(k => String(k.id) === selectedKey);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Test Prompts</h2>
        <p className="text-text-dim text-sm">Run your prompts against any AI provider.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['test', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-brand-primary text-white' : 'bg-white/5 text-text-dim hover:text-white'
            )}
          >
            {t === 'history' ? `History (${history.length})` : 'Test'}
          </button>
        ))}
      </div>

      {tab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Config */}
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-brand-primary" /> Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Select Prompt</label>
                  <div className="relative">
                    <select
                      className="input-field w-full appearance-none pr-10"
                      value={selectedPrompt}
                      onChange={e => setSelectedPrompt(e.target.value)}
                    >
                      <option value="">Choose a prompt...</option>
                      {prompts.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Select AI</label>
                  {activeKeys.length === 0 ? (
                    <div className="p-4 bg-white/5 rounded-xl text-sm text-text-dim">
                      No active API keys. Add one in the <span className="text-brand-primary">API Keys</span> section.
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        className="input-field w-full appearance-none pr-10"
                        value={selectedKey}
                        onChange={e => setSelectedKey(e.target.value)}
                      >
                        <option value="">Choose an AI...</option>
                        {activeKeys.map(k => (
                          <option key={k.id} value={k.id}>{k.label} ({k.provider})</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">
                    Model Override <span className="normal-case text-text-dim/50">(optional)</span>
                  </label>
                  <input
                    className="input-field w-full"
                    placeholder={selectedKeyData?.default_model || 'Use default model'}
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleTest}
                  disabled={loading || !selectedPrompt || !selectedKey}
                  className={cn(
                    'btn-primary w-full justify-center',
                    (loading || !selectedPrompt || !selectedKey) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </span>
                  ) : (
                    <><Play size={18} /> Run Prompt</>
                  )}
                </button>
              </div>
            </div>

            {/* Prompt preview */}
            {selectedPrompt && (
              <div className="glass-card p-6">
                <p className="text-xs text-text-dim uppercase tracking-wider mb-3">Prompt Preview</p>
                <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
                  {prompts.find(p => String(p.id) === selectedPrompt)?.content}
                </pre>
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Play size={18} className="text-brand-primary" /> Response
              </h3>
              {result && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-dim">{tokensUsed} tokens · {modelUsed}</span>
                  <button onClick={handleCopy} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-text-dim hover:text-white transition-all">
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                <p className="text-text-dim text-sm">Calling AI...</p>
              </div>
            ) : result ? (
              <pre className="whitespace-pre-wrap text-sm text-white/80 font-mono bg-black/20 p-4 rounded-xl border border-white/5 min-h-64 max-h-[500px] overflow-y-auto leading-relaxed">
                {result}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-text-dim gap-3">
                <Zap size={32} className="opacity-30" />
                <p className="text-sm">Select a prompt and AI to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Clock size={40} className="text-text-dim mx-auto mb-4 opacity-30" />
              <p className="text-text-dim">No test history yet.</p>
            </div>
          ) : history.map(h => (
            <div key={h.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-sm">{h.prompt_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded">{h.provider}</span>
                    <span className="text-[10px] text-text-dim">{h.model_used}</span>
                    <span className="text-[10px] text-text-dim">{h.tokens_used} tokens</span>
                  </div>
                </div>
                <span className="text-[10px] text-text-dim whitespace-nowrap">{formatDate(h.created_at)}</span>
              </div>
              <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono bg-black/20 p-3 rounded-lg border border-white/5 line-clamp-4 max-h-24 overflow-hidden">
                {h.response}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

