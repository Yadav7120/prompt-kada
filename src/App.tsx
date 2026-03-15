import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Search,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Copy,
  Share2,
  Trash2,
  Edit2,
  Check,
  ExternalLink,
  User,
  Menu,
  X,
  Zap,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from './lib/utils';
import { Prompt, Category, AdminStats } from './types';
import SettingsPage from './pages/SettingsPage';
import AdminApiKeysPage from './pages/AdminApiKeysPage';
import AdminTestPromptPage from './pages/AdminTestPromptPage';
import { ProfileProvider, useProfile } from './context/ProfileContext';

// --- Sidebar ---

const Sidebar = ({ isAdmin = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { profile } = useProfile();

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);
  }, []);

  const menuItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/admin' },
    { icon: Plus,            label: 'Add Prompt',     path: '/admin/editor' },
    { icon: Library,         label: 'Manage Prompts', path: '/admin/manage' },
    { icon: Zap,             label: 'API Keys',       path: '/admin/api-keys' },
    { icon: Play,            label: 'Test Prompts',   path: '/admin/test' },
    { icon: Settings,        label: 'Settings',       path: '/settings' },
  ] : [
    { icon: Library,  label: 'Prompt Library', path: '/' },
    { icon: BarChart3, label: 'Trending',      path: '/trending' },
    { icon: Settings,  label: 'Settings',      path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-card rounded-lg border border-border-dim"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-bg-sidebar border-r border-border-dim flex flex-col transition-transform duration-300 lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Library className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Prompt Kada</h1>
            <p className="text-xs text-text-dim">{isAdmin ? 'Admin Console' : 'Personal Library'}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <div>
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-dim mb-4">Main Menu</p>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn("sidebar-item", location.pathname === item.path && "active")}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {!isAdmin && (
            <div>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-dim mb-4">Categories</p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={'/category/' + cat.slug}
                    className={cn("sidebar-item", location.pathname === '/category/' + cat.slug && "active")}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <ChevronRight size={16} className="text-text-dim/50" />
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.display_name}</p>
              <p className="text-xs text-text-dim truncate">{isAdmin ? 'Super Admin' : 'Pro Member'}</p>
            </div>
            {isAdmin && (
              <button onClick={handleLogout} className="text-text-dim hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

// --- Header ---

const Header = ({ title, subtitle, showSearch = true }: { title: string; subtitle: string; showSearch?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue) {
      searchParams.set('search', searchValue);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-text-dim text-sm">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {showSearch && (
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-brand-primary transition-colors" size={18} />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search prompts..."
              className="bg-bg-card border border-border-dim rounded-xl pl-12 pr-4 py-2.5 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </form>
        )}
        <button className="p-2.5 bg-bg-card border border-border-dim rounded-xl text-text-dim hover:text-white transition-colors">
          <Bell size={20} />
        </button>
        <button className="p-2.5 bg-bg-card border border-border-dim rounded-xl text-text-dim hover:text-white transition-colors">
          <Moon size={20} />
        </button>
      </div>
    </header>
  );
};

// --- PromptCard ---

const PromptCard = ({ prompt, onCopy }: { prompt: Prompt; onCopy: (id: number, text: string) => void }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(prompt.id, prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden group hover:border-brand-primary/30 transition-all duration-300"
    >
      <div className="h-32 bg-gradient-to-br from-brand-primary/20 to-transparent p-4 relative">
        <span className="absolute top-4 right-4 px-2 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-wider rounded">
          {prompt.category_name}
        </span>
        <div className="text-[10px] font-mono text-white/30 line-clamp-4 overflow-hidden">
          {prompt.content}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 group-hover:text-brand-primary transition-colors">
          <Link to={'/prompt/' + prompt.id}>{prompt.title}</Link>
        </h3>
        <p className="text-text-dim text-sm line-clamp-2 mb-6 h-10">{prompt.description}</p>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              copied ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-white/5 hover:bg-white/10 text-white"
            )}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 text-text-dim hover:text-white rounded-xl transition-all">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Pages ---

const HomePage = ({ showToast }: { showToast: (m: string) => void }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    setLoading(true);
    let url = '/api/prompts?';
    if (slug)   url += 'category=' + slug + '&';
    if (search) url += 'search=' + search + '&';
    fetch(url)
      .then(res => res.json())
      .then(data => { setPrompts(data); setLoading(false); });
  }, [slug, search]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    fetch('/api/prompts/' + id + '/copy', { method: 'POST' });
    showToast('Prompt copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Header title="Prompt Repository" subtitle="Organize, edit, and curate all community-generated AI prompts." />
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {['All Prompts', 'Trending', 'Staff Picks', 'Community'].map((tab, i) => (
          <button
            key={tab}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              i === 0 ? "bg-brand-primary text-white" : "bg-white/5 text-text-dim hover:text-white hover:bg-white/10"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {prompts.map(prompt => <PromptCard key={prompt.id} prompt={prompt} onCopy={handleCopy} />)}
        </div>
      )}
    </div>
  );
};

const PromptDetailPage = ({ showToast }: { showToast: (m: string) => void }) => {
  const { id } = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/prompts/' + id)
      .then(res => res.json())
      .then(data => { setPrompt(data); setLoading(false); });
  }, [id]);

  const handleCopy = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt.content);
    fetch('/api/prompts/' + prompt.id + '/copy', { method: 'POST' });
    setCopied(true);
    showToast('Prompt copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-text-dim">Loading...</div>;
  if (!prompt)  return <div className="p-8 text-center text-text-dim">Prompt not found</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-xs text-text-dim mb-6">
        <Link to="/" className="hover:text-white">Library</Link>
        <ChevronRight size={12} />
        <span className="text-white">{prompt.category_name}</span>
      </nav>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase rounded">{prompt.category_name}</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase rounded">Verified</span>
          </div>
          <h1 className="text-4xl font-bold mb-6 leading-tight">{prompt.title}</h1>
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">PK</div>
              <span className="text-sm text-text-dim">@prompt_kada</span>
            </div>
            <div className="text-sm text-text-dim">Updated {formatDate(prompt.updated_at)}</div>
          </div>
          <div className="flex items-center gap-3 mb-10">
            <button onClick={handleCopy} className="btn-primary">
              {copied ? <Check size={20} /> : <Copy size={20} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
            </button>
            <button className="btn-secondary p-2.5"><Share2 size={20} /></button>
          </div>
          <div className="glass-card p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">System Prompt</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm text-white/80 leading-relaxed bg-black/20 p-6 rounded-xl border border-white/5">
              {prompt.content}
            </pre>
          </div>
          <div className="mt-12">
            <h3 className="flex items-center gap-2 font-bold mb-4">
              <HelpCircle size={18} className="text-brand-primary" />
              How to use
            </h3>
            <p className="text-text-dim text-sm leading-relaxed mb-6">{prompt.description}</p>
          </div>
        </div>
        <aside className="w-full lg:w-80 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold text-sm mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {prompt.tags && prompt.tags.split(',').map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 text-text-dim text-[10px] rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-all">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2">Share This Prompt</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-4">Share this prompt with your team or friends.</p>
            <button className="w-full py-2.5 bg-white text-brand-primary font-bold rounded-xl text-sm hover:bg-white/90 transition-all">
              Copy Link
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

// --- Admin Login ---

const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('token', token);
      navigate('/admin');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-xl shadow-brand-primary/20">
            <Library className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Admin Login</h2>
        <p className="text-text-dim text-sm text-center mb-8">Access the prompt management console.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Username</label>
            <input
              className="input-field w-full"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">Password</label>
            <input
              className="input-field w-full"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center mt-2">
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Admin Dashboard ---

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(setStats);
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <Header title="Dashboard" subtitle="Overview of your prompt library." showSearch={false} />
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Prompts', value: stats.totalPrompts },
              { label: 'Total Views',   value: stats.totalViews   },
              { label: 'Total Copies',  value: stats.totalCopies  },
            ].map(s => (
              <div key={s.label} className="glass-card p-6">
                <p className="text-text-dim text-xs uppercase tracking-wider mb-2">{s.label}</p>
                <p className="text-3xl font-bold text-brand-primary">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4">Recent Prompts</h3>
            <div className="space-y-3">
              {stats.recentPrompts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-text-dim">{p.category_name} · {formatDate(p.created_at)}</p>
                  </div>
             
