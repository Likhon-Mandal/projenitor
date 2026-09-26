import React, { useState, useEffect } from 'react';
import { Users, Home, MapPin, Calendar, Bell, Star, Shield, Plus, Pencil, Trash2, X, Eye, EyeOff, LogOut, Key, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import ProfileTab from '../components/ProfileTab';
import DashboardCharts from '../components/DashboardCharts';

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-orange-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow group`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-[11px] text-stone-500 font-sans uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-stone-800 font-serif">{value ?? '—'}</p>
        </div>
    </div>
);

// ── Admin Form Modal ────────────────────────────────────────────────────────────
const AdminModal = ({ admin, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: admin?.name || '',
        email: admin?.email || '',
        password: '',
        role: admin?.role || 'admin',
    });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (admin) {
                await api.put(`/admin/admins/${admin.id}`, form);
            } else {
                if (!form.password) { setError('Password is required for new admins.'); setLoading(false); return; }
                await api.post('/admin/admins', form);
            }
            onSave();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-orange-800 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-serif text-lg font-semibold">{admin ? 'Edit Admin' : 'Create New Admin'}</h3>
                    <button onClick={onClose} className="text-orange-200 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" /><span>{error}</span>
                        </div>
                    )}
                    {[
                        { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Admin name' },
                        { label: 'Email', name: 'email', type: 'email', placeholder: 'admin@email.com' },
                    ].map(({ label, name, type, placeholder }) => (
                        <div key={name}>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
                            <input type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} required className="w-full border border-orange-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Password {admin && <span className="text-stone-400 text-xs">(leave blank to keep current)</span>}</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder={admin ? 'New password (optional)' : 'Min. 6 characters'} required={!admin} className="w-full border border-orange-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 pr-10" />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-700">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Role</label>
                        <select name="role" value={form.role} onChange={handleChange} className="w-full border border-orange-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50">
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg py-2 text-sm font-medium transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 bg-orange-800 hover:bg-orange-900 text-white rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : (admin ? 'Save Changes' : 'Create Admin')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Dashboard ──────────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [modal, setModal] = useState(null); // null | { type: 'create' | 'edit', admin?: {} }
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            // Fetch stats and chart data independently
            const statsPromise = api.get('/admin/stats').then(res => setStats(res.data)).catch(err => console.error('Stats fetch error:', err));
            const chartPromise = api.get('/admin/chart-data').then(res => setChartData(res.data)).catch(err => console.error('Chart fetch error:', err));

            await Promise.all([statsPromise, chartPromise]);
        } catch (err) {
            console.error('Stats error:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchAdmins = async () => {
        setAdminsLoading(true);
        try {
            const res = await api.get('/admin/admins');
            setAdmins(res.data);
        } catch (err) {
            console.error('Admins error:', err);
        } finally {
            setAdminsLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { if (activeTab === 'admins') fetchAdmins(); }, [activeTab]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/admins/${id}`);
            fetchAdmins();
            setDeleteConfirm(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const statCards = [
        { icon: Users, label: 'Total Members', value: stats?.totalMembers, color: 'bg-orange-700' },
        { icon: Home, label: 'Total Homes', value: stats?.totalHomes, color: 'bg-red-800' },
        { icon: MapPin, label: 'Villages', value: stats?.totalVillages, color: 'bg-yellow-600' },
        { icon: Calendar, label: 'Events', value: stats?.totalEvents, color: 'bg-emerald-700' },
        { icon: Bell, label: 'Notices', value: stats?.totalNotices, color: 'bg-indigo-700' },
        { icon: Star, label: 'Eminent Figures', value: stats?.totalEminentFigures, color: 'bg-purple-700' },
        { icon: Shield, label: 'Admin Users', value: stats?.totalAdmins, color: 'bg-stone-700' },
    ];

    return (
        <div className="min-h-screen bg-orange-50">


            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-serif font-bold text-stone-800">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-stone-500 text-sm mt-1">Here's what's happening across Projenitor.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-white border border-orange-100 rounded-xl p-1.5 shadow-sm w-fit">
                    {['overview', 'admins', 'profile'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-orange-800 text-white shadow-sm' : 'text-stone-600 hover:text-orange-800 hover:bg-orange-50'}`}>
                            {tab === 'admins' ? 'Admin Management' : tab}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-serif font-semibold text-stone-700">System Overview</h2>
                            <button onClick={fetchStats} className="flex items-center gap-1 text-sm text-orange-700 hover:text-orange-900 transition-colors">
                                <RefreshCw className="w-4 h-4" /> Refresh
                            </button>
                        </div>
                        {statsLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[...Array(7)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-orange-100" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {statCards.map((card) => <StatCard key={card.label} {...card} />)}
                            </div>
                        )}

                        <DashboardCharts data={chartData} />
                    </div>
                )}

                {/* Admins Tab */}
                {activeTab === 'admins' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-serif font-semibold text-stone-700">Admin Management</h2>
                            <button onClick={() => setModal({ type: 'create' })} className="flex items-center gap-2 bg-orange-800 hover:bg-orange-900 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md active:scale-95">
                                <Plus className="w-4 h-4" /> Add Admin
                            </button>
                        </div>
                        {adminsLoading ? (
                            <div className="bg-white rounded-xl border border-orange-100 p-8 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-800 border-t-transparent mx-auto" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-orange-50 border-b border-orange-100">
                                            <tr>
                                                {['Name', 'Email', 'Role', 'Created', 'Actions'].map((h) => (
                                                    <th key={h} className="text-left px-5 py-3 text-stone-600 font-semibold">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {admins.map((admin) => (
                                                <tr key={admin.id} className="border-b border-orange-50 hover:bg-orange-50/50 transition-colors">
                                                    <td className="px-5 py-3 font-medium text-stone-800">{admin.name}</td>
                                                    <td className="px-5 py-3 text-stone-600">{admin.email}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${admin.role === 'superadmin' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                                                            {admin.role === 'superadmin' ? <Shield className="w-3 h-3" /> : <Shield className="w-3 h-3 opacity-60" />}
                                                            {admin.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-stone-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => setModal({ type: 'edit', admin })} className="p-1.5 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors" title="Edit">
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(admin)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {admins.length === 0 && (
                                                <tr><td colSpan={5} className="px-5 py-8 text-center text-stone-400">No admins found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <ProfileTab />
                )}
            </div>

            {/* Modals */}
            {modal && (
                <AdminModal
                    admin={modal.admin}
                    onClose={() => setModal(null)}
                    onSave={() => { setModal(null); fetchAdmins(); fetchStats(); }}
                />
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-600" />
                        </div>
                        <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1">Delete Admin?</h3>
                        <p className="text-stone-500 text-sm mb-6">Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg py-2 text-sm font-medium transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
