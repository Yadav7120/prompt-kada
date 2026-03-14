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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from './lib/utils';
import { Prompt, Category, AdminStats } from './types';

// --- Components ---

const Sidebar = ({ isAdmin = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);
  }, []);

  const menuItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Plus, label: 'Add Prompt', path: '/admin/editor' },
    { icon: Library, label: 'Manage Prompts', path: '/admin/manage' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ] : [
    { icon: Library, label: 'Prompt Library', path: '/' },
    { icon: BarChart3, label: 'Trending', path: '/trending' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
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
                  className={cn(
                    "sidebar-item",
                    location.pathname === item.path && "active"
                  )}
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
                    to={`/category/${cat.slug}`}
                    className={cn(
                      "sidebar-item",
                      location.pathname === `/category/${cat.slug}` && "active"
                    )}
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
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Alex Rivera</p>
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

const Header = ({ title, subtitle, showSearch = true }: { title: string, subtitle: string, showSearch?: boolean }) => {
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

const PromptCard = ({ prompt, onCopy }: { prompt: Prompt, onCopy: (id: number, text: string) => void }) => {
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
          <Link to={`/prompt/${prompt.id}`}>{prompt.title}</Link>
        </h3>
        <p className="text-text-dim text-sm line-clamp-2 mb-6 h-10">
          {prompt.description}
        </p>
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
    if (slug) url += `category=${slug}&`;
    if (search) url += `search=${search}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setPrompts(data);
        setLoading(false);
      });
  }, [slug, search]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    fetch(`/api/prompts/${id}/copy`, { method: 'POST' });
    showToast('Prompt copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Header 
        title="Prompt Repository" 
        subtitle="Organize, edit, and curate all community-generated AI prompts." 
      />

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {prompts.map(prompt => (
            <PromptCard key={prompt.id} prompt={prompt} onCopy={handleCopy} />
          ))}
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
    fetch(`/api/prompts/${id}`)
      .then(res => res.json())
      .then(data => {
        setPrompt(data);
        setLoading(false);
      });
  }, [id]);

  const handleCopy = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt.content);
    fetch(`/api/prompts/${prompt.id}/copy`, { method: 'POST' });
    setCopied(true);
    showToast('Prompt copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-text-dim">Loading...</div>;
  if (!prompt) return <div className="p-8 text-center text-text-dim">Prompt not found</div>;

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
            <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase rounded">
              {prompt.category_name}
            </span>
            <span className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase rounded">
              Verified
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-6 leading-tight">{prompt.title}</h1>

          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">AR</div>
              <span className="text-sm text-text-dim">@alex_rivera</span>
            </div>
            <div className="text-sm text-text-dim">Updated {formatDate(prompt.updated_at)}</div>
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <span>★</span>
              <span>4.9 (1.2k)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-10">
            <button 
              onClick={handleCopy}
              className="btn-primary"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
            </button>
            <button className="btn-secondary p-2.5">
              <Share2 size={20} />
            </button>
          </div>

          <div className="glass-card p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">System Prompt</span>
              <span className="text-[10px] text-text-dim">1,240 tokens</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm text-white/80 leading-relaxed bg-black/20 p-6 rounded-xl border border-white/5">
              {prompt.content}
            </pre>
            <div className="mt-8 flex items-center justify-between text-[10px] text-text-dim">
              <div className="flex gap-4">
                <div>MODEL: <span className="text-white">GPT-4o / Claude 3.5</span></div>
                <div>TEMPERATURE: <span className="text-white">0.7</span></div>
              </div>
              <button className="text-brand-primary hover:underline">Full View</button>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="flex items-center gap-2 font-bold mb-4">
              <HelpCircle size={18} className="text-brand-primary" />
              How to use
            </h3>
            <p className="text-text-dim text-sm leading-relaxed mb-6">
              {prompt.description}
            </p>
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                <BarChart3 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Pro Tip</h4>
                <p className="text-xs text-text-dim leading-relaxed">
                  For even better results, paste the first paragraph of a competitor's blog post and ask the AI to "analyze the style and improve upon the information density while maintaining the same target audience."
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-80 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Library size={16} className="text-brand-primary" />
                Related Prompts
              </h3>
              <button className="text-[10px] text-text-dim hover:text-white">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Cold Email Sequence', meta: 'Marketing • 8.4k uses' },
                { title: 'High-Conversion Ad Copy', meta: 'Ads • 12k uses' },
                { title: 'Product Descriptions', meta: 'E-commerce • 5.1k uses' },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-text-dim group-hover:bg-brand-primary/20 group-hover:text-brand-primary transition-all">
                    <Library size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium group-hover:text-brand-primary transition-colors">{p.title}</p>
                    <p className="text-[10px] text-text-dim">{p.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold text-sm mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {prompt.tags.split(',').map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 text-text-dim text-[10px] rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-all">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2">Get the Extension</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-6">
              Use your library directly inside ChatGPT, Claude, and Gemini.
            </p>
            <button className="w-full py-2.5 bg-white text-brand-primary font-bold rounded-xl text-sm hover:bg-white/90 transition-all">
              Install Free
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
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
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input-field w-full" 
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field w-full" 
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center py-3">
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : navigate('/login'))
      .then(data => setStats(data));
  }, []);

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Header title="Admin Dashboard" subtitle="Overview of your prompt library performance." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {[
          { label: 'Total Prompts', value: stats.totalPrompts, trend: '+12% this month', color: 'text-brand-primary' },
          { label: 'Total Views', value: stats.totalViews, trend: '+5.2% growth', color: 'text-green-500' },
          { label: 'Total Copies', value: stats.totalCopies, trend: 'Prompts per day', color: 'text-blue-500' },
          { label: 'System Health', value: '99.9%', trend: 'Operational', color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">{stat.label}</p>
            <h3 className={cn("text-2xl sm:text-3xl font-bold mb-2", stat.color)}>{stat.value}</h3>
            <p className="text-xs text-text-dim">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border-dim flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base">Recent Prompts</h3>
          <Link to="/admin/manage" className="text-xs text-brand-primary hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px] sm:min-w-full">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                <th className="px-4 sm:px-6 py-4">Title</th>
                <th className="px-4 sm:px-6 py-4">Category</th>
                <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Views</th>
                <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Copies</th>
                <th className="px-4 sm:px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim">
              {stats.recentPrompts.map(prompt => (
                <tr key={prompt.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 sm:px-6 py-4 font-medium text-sm">{prompt.title}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="px-2 py-1 bg-white/5 text-[10px] rounded uppercase">{prompt.category_name || 'N/A'}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm hidden sm:table-cell">{prompt.views}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm hidden sm:table-cell">{prompt.copies}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-text-dim">{formatDate(prompt.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminManagePrompts = ({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const navigate = useNavigate();

  const fetchPrompts = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/prompts', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          navigate('/login');
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) setPrompts(data);
      });
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/prompts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Prompt deleted successfully');
        fetchPrompts();
      } else {
        showToast('Failed to delete prompt', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Manage Prompts</h2>
          <p className="text-text-dim text-sm">Create, edit, and delete your library prompts.</p>
        </div>
        <Link to="/admin/editor" className="btn-primary w-full sm:w-auto justify-center">
          <Plus size={20} />
          <span>Create New Prompt</span>
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px] sm:min-w-full">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                <th className="px-4 sm:px-6 py-4">Title</th>
                <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Category</th>
                <th className="px-4 sm:px-6 py-4 hidden lg:table-cell">Date Added</th>
                <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Popularity</th>
                <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim">
              {prompts.map(prompt => (
                <tr key={prompt.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 sm:px-6 py-4">
                    <p className="font-bold text-sm">{prompt.title}</p>
                    <p className="text-xs text-text-dim truncate max-w-[150px] sm:max-w-[200px]">{prompt.description}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                    <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase rounded">
                      {prompt.category_name}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-text-dim hidden lg:table-cell">{formatDate(prompt.created_at)}</td>
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <div className="w-24 lg:w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary" style={{ width: `${Math.min(100, prompt.views / 10)}%` }} />
                    </div>
                    <p className="text-[10px] text-text-dim mt-1">{prompt.views} views</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <button 
                        onClick={() => navigate(`/admin/editor/${prompt.id}`)}
                        className="p-2 text-text-dim hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(prompt.id)}
                        className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminEditor = ({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_id: '',
    tags: '',
    is_public: true
  });

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);

    if (isEdit) {
      fetch(`/api/prompts/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            title: data.title,
            description: data.description,
            content: data.content,
            category_id: data.category_id.toString(),
            tags: data.tags,
            is_public: data.is_public === 1
          });
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEdit ? `/api/admin/prompts/${id}` : '/api/admin/prompts';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(isEdit ? 'Prompt updated successfully' : 'Prompt created successfully');
        navigate('/admin/manage');
      } else {
        showToast('Failed to save prompt', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <Header 
        title={isEdit ? "Edit Prompt" : "Prompt Editor"} 
        subtitle="Refine and optimize your AI instructions." 
        showSearch={false}
      />

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Prompt Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Creative Blog Writer v2.0"
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Category</label>
            <div className="relative">
              <select 
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
                className="input-field w-full appearance-none"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-dim pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Short Description</label>
          <input 
            type="text" 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="A brief summary of what this prompt does..."
            className="input-field w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-text-dim">Prompt Content</label>
            <span className="text-[10px] text-text-dim">MARKDOWN SUPPORTED</span>
          </div>
          <textarea 
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            className="input-field w-full h-64 sm:h-96 font-mono text-sm leading-relaxed resize-none"
            placeholder="# System Role: ... \n\n# Task: ..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Tags (comma separated)</label>
            <input 
              type="text" 
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              placeholder="React, UI, Python"
              className="input-field w-full"
            />
          </div>
          <div className="flex items-center gap-4 md:pt-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={formData.is_public}
                  onChange={e => setFormData({...formData, is_public: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-white/10 rounded-full peer peer-checked:bg-brand-primary transition-all duration-300 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-dim group-hover:text-white transition-colors">Publicly Visible</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-border-dim">
          <button 
            type="button" 
            onClick={() => navigate('/admin/manage')} 
            className="btn-secondary w-full sm:w-auto justify-center"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary w-full sm:w-auto justify-center">
            <Copy size={20} />
            <span>{isEdit ? 'Update Prompt' : 'Save Prompt'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/login';
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen flex">
      {!isLoginPage && <Sidebar isAdmin={isAdminPath} />}
      
      <main className={cn(
        "flex-1 p-6 lg:p-10 transition-all duration-300",
        !isLoginPage && "lg:ml-64"
      )}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={<HomePage showToast={showToast} />} />
            <Route path="/category/:slug" element={<HomePage showToast={showToast} />} />
            <Route path="/prompt/:id" element={<PromptDetailPage showToast={showToast} />} />
            <Route path="/login" element={<AdminLoginPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/manage" element={<AdminManagePrompts showToast={showToast} />} />
            <Route path="/admin/editor" element={<AdminEditor showToast={showToast} />} />
            <Route path="/admin/editor/:id" element={<AdminEditor showToast={showToast} />} />
          </Routes>
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={cn(
                "fixed bottom-8 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border",
                toast.type === 'success' ? "bg-bg-card border-green-500/30 text-green-500" : "bg-bg-card border-red-500/30 text-red-500"
              )}
            >
              {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 pt-8 border-t border-border-dim flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-text-dim uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>{new Date().getFullYear()} PromptKada AI. Built for the community.</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Network Stable</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
