import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { BellRing, LayoutDashboard, LogOut, Moon, Search, SunMedium, UserCircle2, Users, PlusCircle, CheckCircle2, PhoneCall, Sparkles } from 'lucide-react';

const api = axios.create({ baseURL: '/api', withCredentials: true });

const statusOptions = ['New', 'Contacted', 'Converted'];

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('crm_token');
  return token ? children : <Navigate to="/login" replace />;
};

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('crm_token', res.data.token);
      onLogin();
      navigate('/');
      toast.success('Welcome back, admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.25),_transparent_30%),linear-gradient(135deg,#020617,#111827)] p-4 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-6"><Sparkles size={18} /> Mini CRM</div>
          <h1 className="text-3xl font-semibold">Client Lead Management System</h1>
          <p className="mt-3 text-slate-300">Run your pipeline with modern analytics, secure admin access, and beautiful lead workflows.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Lead CRUD with status tracking</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Smart search, filters, and pagination</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Notes and follow-ups</div>
          </div>
        </div>
        <div className="p-8 md:p-10 bg-slate-950/60">
          <h2 className="text-xl font-semibold">Secure Admin Login</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 outline-none" placeholder="Email" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 outline-none" placeholder="Password" />
            <button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium hover:bg-indigo-500 disabled:opacity-70">{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', status: 'New', source: '', value: '', priority: 'Medium', followUpDate: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', { headers: { Authorization: `Bearer ${localStorage.getItem('crm_token')}` }, params: { search, status, page, limit: 6 } });
      setLeads(res.data.leads);
      setPages(res.data.pages);
      const total = res.data.total;
      setStats({
        total,
        new: res.data.leads.filter((l) => l.status === 'New').length,
        contacted: res.data.leads.filter((l) => l.status === 'Contacted').length,
        converted: res.data.leads.filter((l) => l.status === 'Converted').length,
      });
    } catch {
      toast.error('Unable to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, status, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leads', { ...form, value: Number(form.value) || 0 }, { headers: { Authorization: `Bearer ${localStorage.getItem('crm_token')}` } });
      toast.success('Lead created');
      setForm({ name: '', email: '', company: '', phone: '', status: 'New', source: '', value: '', priority: 'Medium', followUpDate: '' });
      fetchData();
    } catch {
      toast.error('Could not create lead');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/leads/${id}`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('crm_token')}` } });
      toast.success('Status updated');
      fetchData();
    } catch {
      toast.error('Status update failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/leads/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('crm_token')}` } });
      toast.success('Lead removed');
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
  };

  const cards = useMemo(() => [
    { title: 'Total Leads', value: stats.total, icon: Users },
    { title: 'New', value: stats.new, icon: Sparkles },
    { title: 'Contacted', value: stats.contacted, icon: PhoneCall },
    { title: 'Converted', value: stats.converted, icon: CheckCircle2 },
  ], [stats]);

  return (
    <div className={theme === 'dark' ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'}>
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-400">Enterprise CRM</p>
            <h1 className="text-2xl font-semibold">Lead Operations Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full border border-white/10 bg-slate-900/70 p-3">
              {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => { localStorage.removeItem('crm_token'); navigate('/login'); }} className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 p-5 shadow-lg backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-300">{card.title}</p>
                <card.icon className="text-indigo-300" size={18} />
              </div>
              <div className="text-3xl font-semibold">{card.value}</div>
            </motion.div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl backdrop-blur">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Lead Pipeline</h2>
                <p className="text-sm text-slate-400">Track opportunities and follow-up activity.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/70 px-3 py-2">
                <Search size={16} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent outline-none" placeholder="Search leads" />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2">
                <option value="">All Status</option>
                {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              {loading ? <div className="text-sm text-slate-400">Loading leads...</div> : leads.map((lead) => (
                <motion.div key={lead._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs text-indigo-300">{lead.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{lead.company} • {lead.email}</p>
                      <p className="mt-1 text-sm text-slate-400">Value: ${lead.value}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select value={lead.status} onChange={(e) => handleStatusChange(lead._id, e.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm">
                        {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <button onClick={() => handleDelete(lead._id)} className="rounded-lg bg-rose-500/20 px-2 py-1 text-sm text-rose-300">Delete</button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                    <span>Follow-up: {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'Not set'}</span>
                    <span>{lead.notes?.length || 0} notes</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40">Prev</button>
                <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-slate-900/70 p-4 shadow-xl backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2"><PlusCircle className="text-emerald-400" /> <h2 className="text-xl font-semibold">Create Lead</h2></div>
              <form onSubmit={handleCreate} className="space-y-3">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2" placeholder="Lead name" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2" placeholder="Email" />
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2" placeholder="Company" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2" placeholder="Phone" />
                <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} type="number" className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2" placeholder="Deal value" />
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                  {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2" placeholder="Source" />
                <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2" />
                <button className="w-full rounded-xl bg-emerald-500 px-3 py-2 font-medium hover:bg-emerald-400">Save Lead</button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl backdrop-blur">
              <div className="mb-3 flex items-center gap-2"><BellRing size={18} className="text-amber-400" /> <h2 className="text-xl font-semibold">Workflow Tips</h2></div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Prioritize high-value leads first.</li>
                <li>• Log notes after every follow-up.</li>
                <li>• Move leads smoothly from New to Contacted to Converted.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('crm_token')));

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
