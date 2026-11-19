import React, { useState, useEffect } from 'react';
import { Users, Home, MapPin, Calendar, Bell, Star, Shield, ShieldAlert, Plus, Pencil, Trash2, X, Eye, EyeOff, Key, RefreshCw, AlertCircle, GraduationCap, Terminal, LayoutGrid, Check, Mail, Phone, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import ProfileTab from '../components/ProfileTab';
import DashboardCharts from '../components/DashboardCharts';
import UserManagement from '../components/UserManagement';
import Profile from './Profile';
import BrilliantStudentRequestsAdmin from '../components/BrilliantStudentRequestsAdmin';
import ConfirmModal from '../components/ConfirmModal';
import ApiLogsAdmin from '../components/ApiLogsAdmin';
import { DashboardStyles, DashboardHero, StatTile, StatTileSkeleton, DashTabs, SectionHeader, StatusBadge, EmptyState, Avatar } from '../components/DashboardUI';

// ── Admin Form Modal ────────────────────────────────────────────────────────────
const AdminModal = ({ admin, onClose, onSave }) => {
    const { t } = useLanguage();
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
                if (!form.password) {
                    setError(t('নতুন এডমিনের জন্য পাসওয়ার্ড আবশ্যক।', 'Password is required for new admins.'));
                    setLoading(false);
                    return;
                }
                await api.post('/admin/admins', form);
            }
            onSave();
        } catch (err) {
            setError(err.response?.data?.error || t('কার্যক্রম সম্পন্ন করা যায়নি', 'Operation failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 app-sheet bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-orange-800 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-serif text-lg font-semibold">
                        {admin ? t('এডমিন সম্পাদনা', 'Edit Admin') : t('নতুন এডমিন তৈরি', 'Create New Admin')}
                    </h3>
                    <button onClick={onClose} className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-orange-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" aria-label={t('বন্ধ করুন', 'Close')}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
                        </div>
                    )}
                    {[
                        { label: t('পূর্ণ নাম', 'Full Name'), name: 'name', type: 'text', placeholder: t('এডমিনের নাম', 'Admin name') },
                        { label: t('ইমেইল', 'Email'), name: 'email', type: 'email', placeholder: 'admin@email.com' },
                    ].map(({ label, name, type, placeholder }) => (
                        <div key={name}>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
                            <input type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} required className="w-full border border-orange-200 rounded-xl px-4 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            {t('পাসওয়ার্ড', 'Password')} {admin && <span className="text-stone-400 text-xs">({t('অপরিবর্তিত রাখতে ফাঁকা রাখুন', 'leave blank to keep current')})</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={admin ? t('নতুন পাসওয়ার্ড (ঐচ্ছিক)', 'New password (optional)') : t('কমপক্ষে ৬ অক্ষর', 'Min. 6 characters')}
                                required={!admin}
                                className="w-full border border-orange-200 rounded-xl px-4 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 pr-11"
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-700 cursor-pointer">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('ভূমিকা', 'Role')}</label>
                        <select 
                            name="role" 
                            value={form.role} 
                            onChange={handleChange} 
                            disabled={admin?.role === 'superadmin'}
                            className={`w-full border border-orange-200 rounded-xl px-4 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${admin?.role === 'superadmin' ? 'bg-orange-100/60 text-stone-500 cursor-not-allowed' : 'bg-orange-50'}`}
                        >
                            <option value="admin">{t('এডমিন', 'Admin')}</option>
                            <option value="superadmin">{t('সুপারএডমিন', 'Super Admin')}</option>
                        </select>
                        {admin?.role === 'superadmin' && (
                            <p className="text-[11px] text-amber-700 mt-1">
                                {t('সুপারএডমিন পদ স্থায়ী এবং পরিবর্তনযোগ্য নয়।', 'SuperAdmin role is permanent and cannot be downgraded.')}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl py-2.5 min-h-[44px] text-sm font-medium transition-colors cursor-pointer">
                            {t('বাতিল', 'Cancel')}
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 bg-orange-800 hover:bg-orange-900 text-white rounded-xl py-2.5 min-h-[44px] text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : (admin ? t('সংরক্ষণ করুন', 'Save Changes') : t('এডমিন তৈরি করুন', 'Create Admin'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Dashboard ──────────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const { t, formatNumber, formatName, isBn } = useLanguage();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [adminRequests, setAdminRequests] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [modal, setModal] = useState(null); // null | { type: 'create' | 'edit', admin?: {} }
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [selectedProfileMemberId, setSelectedProfileMemberId] = useState(null);
    const [adminActionModal, setAdminActionModal] = useState({
        isOpen: false,
        id: null,
        action: null,
        title: '',
        message: '',
        type: 'approve',
        confirmText: ''
    });

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

    const fetchAdminRequests = async () => {
        setRequestsLoading(true);
        try {
            const res = await api.get('/admin/admin-requests');
            setAdminRequests(res.data);
        } catch (err) {
            console.error('Admin requests error:', err);
        } finally {
            setRequestsLoading(false);
        }
    };

    const promptAdminRequestAction = (reqItem, action) => {
        const isApprove = action === 'approve';
        const memberDisplayName = formatName({
            full_name: reqItem.member_name,
            name_bangla: reqItem.member_name_bangla,
            name_english: reqItem.member_name_english
        }) || reqItem.member_name || t('সদস্য', 'Member');

        setAdminActionModal({
            isOpen: true,
            id: reqItem.id,
            action,
            type: isApprove ? 'approve' : 'reject',
            title: isApprove 
                ? t('এডমিন আবেদন অনুমোদন নিশ্চিতকরণ', 'Confirm Admin Role Approval')
                : t('এডমিন আবেদন প্রত্যাখ্যান নিশ্চিতকরণ', 'Confirm Admin Role Rejection'),
            message: isApprove
                ? (isBn 
                    ? `আপনি কি নিশ্চিত যে "${memberDisplayName}"-কে অ্যাডমিন হিসেবে অনুমোদন করতে চান? অনুমোদনের পর তিনি প্রশাসনিক ড্যাশবোর্ড ও নিয়ন্ত্রণ ব্যবহার করতে পারবেন।`
                    : `Are you sure you want to approve "${memberDisplayName}" as an Admin? Once approved, they will have administrative dashboard access.`)
                : (isBn 
                    ? `আপনি কি নিশ্চিত যে "${memberDisplayName}"-এর এডমিন আবেদনটি প্রত্যাখ্যান করতে চান?`
                    : `Are you sure you want to reject the admin request for "${memberDisplayName}"?`),
            confirmText: isApprove ? t('অনুমোদন করুন', 'Approve') : t('প্রত্যাখ্যান করুন', 'Reject')
        });
    };

    const handleConfirmAdminAction = async () => {
        if (!adminActionModal.id || !adminActionModal.action) return;
        try {
            await api.put(`/admin/admin-requests/${adminActionModal.id}`, { action: adminActionModal.action });
            fetchAdminRequests();
            fetchAdmins();
        } catch (err) {
            alert(err.response?.data?.error || (adminActionModal.action === 'approve' ? t('অনুমোদন ব্যর্থ হয়েছে', 'Failed to approve request') : t('প্রত্যাখ্যান ব্যর্থ হয়েছে', 'Failed to reject request')));
        }
    };

    useEffect(() => { 
        fetchStats();
        fetchAdminRequests(); 
    }, []);

    useEffect(() => { 
        if (activeTab === 'admins') {
            fetchAdmins();
            fetchAdminRequests();
        }
    }, [activeTab]);

    const handleDelete = async (id) => {
        if (deleteConfirm?.role === 'superadmin') {
            alert(t('সুপারএডমিন একাউন্ট সুরক্ষিত এবং ডিলিট করা সম্ভব নয়।', 'SuperAdmin accounts are protected and cannot be deleted.'));
            setDeleteConfirm(null);
            return;
        }
        const isSelf = user && (
            deleteConfirm?.id === user.id ||
            (deleteConfirm?.email && user.email && deleteConfirm.email.toLowerCase() === user.email.toLowerCase()) ||
            (deleteConfirm?.member_id && user.member_id && deleteConfirm.member_id === user.member_id)
        );
        if (isSelf) {
            alert(t('আপনি নিজের একাউন্ট ডিলিট বা পদ অপসারণ করতে পারবেন না।', 'You cannot delete or remove your own account.'));
            setDeleteConfirm(null);
            return;
        }
        try {
            await api.delete(`/admin/admins/${id}`);
            fetchAdmins();
            setDeleteConfirm(null);
        } catch (err) {
            alert(err.response?.data?.error || t('পদ অপসারণ ব্যর্থ হয়েছে', 'Delete failed'));
        }
    };

    const statCards = [
        { icon: Users, label: t('মোট সদস্য', 'Total Members'), value: formatNumber(stats?.totalMembers) },
        { icon: Home, label: t('মোট বাড়ি', 'Total Homes'), value: formatNumber(stats?.totalHomes) },
        { icon: MapPin, label: t('গ্রাম', 'Villages'), value: formatNumber(stats?.totalVillages) },
        { icon: Calendar, label: t('অনুষ্ঠানসমূহ', 'Events'), value: formatNumber(stats?.totalEvents) },
        { icon: Bell, label: t('নোটিশ', 'Notices'), value: formatNumber(stats?.totalNotices) },
        { icon: Star, label: t('বিশিষ্ট ব্যক্তিবর্গ', 'Eminent Figures'), value: formatNumber(stats?.totalEminentFigures) },
        { icon: Shield, label: t('এডমিন ব্যবহারকারী', 'Admin Users'), value: formatNumber(stats?.totalAdmins) },
    ];

    const pendingStudentRequests = stats?.pendingStudentRequests || 0;
    const pendingUserAccounts = stats?.pendingUserAccounts || 0;
    const pendingAdminRequests = adminRequests.filter(r => r.status === 'pending').length || stats?.pendingAdminRequests || 0;
    const totalAdminPending = (stats?.totalPendingNotifications !== undefined && stats.totalPendingNotifications > 0)
        ? stats.totalPendingNotifications
        : (pendingStudentRequests + pendingUserAccounts + pendingAdminRequests);

    const tabs = [
        { id: 'overview', label: t('সারসংক্ষেপ', 'Overview'), icon: LayoutGrid },
        { 
            id: 'brilliant-requests', 
            label: t('কৃতি শিক্ষার্থী আবেদন', 'Student Requests'), 
            icon: GraduationCap,
            badge: pendingStudentRequests 
        },
        { 
            id: 'users', 
            label: t('ব্যবহারকারী পরিচালনা', 'User Accounts'),
            icon: Users,
            badge: pendingUserAccounts 
        },
        { 
            id: 'admins', 
            label: t('এডমিন পরিচালনা', 'Admin Management'),
            icon: Shield,
            badge: pendingAdminRequests 
        },
        { 
            id: 'api-logs', 
            label: t('এপিআই অডিট ও লগ', 'API Logs & Monitor'), 
            icon: Terminal 
        },
        { id: 'profile', label: t('প্রোফাইল ও নিরাপত্তা', 'Profile & Security'), icon: Key }
    ];

    return (
        <div className="font-sans">
            <DashboardStyles />
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                <DashboardHero
                    name={formatName(user) || user?.name || t('সুপারএডমিন', 'Super Admin')}
                    avatarUrl={user?.profile_image_url}
                    roleLabel={t('সুপারএডমিন', 'Super Admin')}
                    subtitle={t('প্রোজেনিটর সিস্টেমের সার্বিক চিত্র ও পরিসংখ্যান।', "Here's what's happening across Projenitor.")}
                    pendingCount={totalAdminPending}
                    onRefresh={() => { fetchStats(); fetchAdminRequests(); }}
                    refreshing={statsLoading}
                >
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'users', icon: UserCheck, label: t('অ্যাকাউন্ট', 'Accounts'), count: pendingUserAccounts },
                            { id: 'brilliant-requests', icon: GraduationCap, label: t('শিক্ষার্থী', 'Students'), count: pendingStudentRequests },
                            { id: 'admins', icon: Shield, label: t('এডমিন', 'Admins'), count: pendingAdminRequests },
                        ].map(({ id, icon: Icon, label, count }) => (
                            <button key={id} type="button" onClick={() => setActiveTab(id)}
                                className="relative min-h-[56px] flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] sm:text-xs font-bold active:scale-95 transition-all">
                                <Icon className="w-[18px] h-[18px] text-yellow-300" />
                                <span>{label}</span>
                                {count > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-yellow-400 text-orange-950 text-[10px] font-black flex items-center justify-center shadow">
                                        {formatNumber(count)}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </DashboardHero>

                <DashTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="db-rise space-y-4 sm:space-y-6">
                        <section>
                            <SectionHeader title={t('সিস্টেম সারসংক্ষেপ', 'System Overview')} />
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                                {statsLoading && !stats
                                    ? <StatTileSkeleton count={7} />
                                    : statCards.map((card, i) => <StatTile key={card.label} index={i} {...card} />)}
                            </div>
                        </section>

                        <DashboardCharts data={chartData} />
                    </div>
                )}

                {/* Admins Tab */}
                {activeTab === 'admins' && (
                    <div className="db-rise">
                        {/* ─── Pending Admin Role Requests from Members ───────────── */}
                        <div className="mb-8">
                            <SectionHeader
                                icon={UserCheck}
                                title={t('সদস্যদের এডমিন পদের আবেদনসমূহ', 'Admin Role Requests from Members')}
                                subtitle={t('বংশতালিকায় তথ্য সংযোজন ও সম্পাদনার অনুমতি চেয়ে পাঠানো আবেদন', 'Requests sent by members to add and edit genealogical records')}
                                count={adminRequests.filter(r => r.status === 'pending').length}
                                action={
                                    <button onClick={fetchAdminRequests} className="w-10 h-10 rounded-xl border border-orange-200 bg-white text-orange-700 hover:bg-orange-50 flex items-center justify-center active:scale-95 transition cursor-pointer" title={t('রিফ্রেশ', 'Refresh Requests')} aria-label={t('রিফ্রেশ', 'Refresh Requests')}>
                                        <RefreshCw className={`w-4 h-4 ${requestsLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                }
                            />

                            {requestsLoading ? (
                                <div className="bg-white rounded-xl border border-orange-100 p-6 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-orange-800 border-t-transparent mx-auto" />
                                </div>
                            ) : adminRequests.length === 0 ? (
                                <EmptyState icon={UserCheck} title={t('কোনো এডমিন আবেদন জমা পড়েনি।', 'No admin requests submitted yet.')} />
                            ) : (
                                <>
                                {/* Phone: request cards */}
                                <div className="md:hidden space-y-2.5">
                                    {adminRequests.map((req) => {
                                        const reqDisplayName = formatName({
                                            full_name: req.member_name,
                                            name_bangla: req.member_name_bangla,
                                            name_english: req.member_name_english,
                                            ...req
                                        }) || req.member_name || t('সদস্য', 'Member');
                                        return (
                                            <div key={req.id} className={`bg-white rounded-2xl border p-3.5 shadow-sm ${req.status === 'pending' ? 'border-amber-200' : 'border-orange-100'}`}>
                                                <div className="flex items-start gap-3">
                                                    <button type="button" disabled={!req.member_id} onClick={() => req.member_id && setSelectedProfileMemberId(req.member_id)} className="shrink-0 active:scale-95 transition-transform disabled:cursor-default">
                                                        <Avatar src={req.profile_image_url} name={reqDisplayName} size="w-11 h-11" />
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-serif font-bold text-stone-900 leading-tight">{reqDisplayName}</p>
                                                            <StatusBadge status={req.status} />
                                                        </div>
                                                        <p className="mt-1 text-xs text-stone-500 flex items-center gap-1 min-w-0"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{req.email}</span></p>
                                                        {req.mobile_number && <p className="text-xs text-stone-500 flex items-center gap-1"><Phone className="w-3 h-3" />{req.mobile_number}</p>}
                                                        <p className="text-[11px] text-stone-400 mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                {req.status === 'pending' && (
                                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                                        <button onClick={() => promptAdminRequestAction(req, 'reject')} className="min-h-[42px] rounded-xl border border-red-200 text-red-700 bg-red-50 text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer">
                                                            <X className="w-4 h-4" />{t('প্রত্যাখ্যান', 'Reject')}
                                                        </button>
                                                        <button onClick={() => promptAdminRequestAction(req, 'approve')} className="min-h-[42px] rounded-xl bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer">
                                                            <Check className="w-4 h-4" />{t('অনুমোদন', 'Approve')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="hidden md:block bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden mb-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-orange-50 border-b border-orange-100 text-xs uppercase tracking-wider text-stone-600">
                                                <tr>
                                                    <th className="text-left px-5 py-3 font-semibold">{t('আবেদনকারী সদস্য', 'Applicant')}</th>
                                                    <th className="text-left px-5 py-3 font-semibold">{t('ইমেইল', 'Email')}</th>
                                                    <th className="text-left px-5 py-3 font-semibold">{t('মোবাইল', 'Mobile')}</th>
                                                    <th className="text-left px-5 py-3 font-semibold">{t('তারিখ', 'Date')}</th>
                                                    <th className="text-left px-5 py-3 font-semibold">{t('স্ট্যাটাস', 'Status')}</th>
                                                    <th className="text-center px-5 py-3 font-semibold">{t('অ্যাকশন', 'Actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-orange-50">
                                                {adminRequests.map((req) => {
                                                    const reqDisplayName = formatName({
                                                        full_name: req.member_name,
                                                        name_bangla: req.member_name_bangla,
                                                        name_english: req.member_name_english,
                                                        ...req
                                                    }) || req.member_name || t('সদস্য', 'Member');

                                                    return (
                                                    <tr key={req.id} className="hover:bg-orange-50/40 transition-colors">
                                                        <td className="px-5 py-3 font-medium text-stone-800">
                                                            <button
                                                                type="button"
                                                                disabled={!req.member_id}
                                                                onClick={() => {
                                                                    if (req.member_id) {
                                                                        setSelectedProfileMemberId(req.member_id);
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-2.5 text-left group transition-all duration-200 ${
                                                                    req.member_id 
                                                                        ? 'cursor-pointer hover:opacity-95' 
                                                                        : 'cursor-default'
                                                                }`}
                                                                title={req.member_id ? t('প্রোফাইল কার্ড দেখুন', 'View Profile Card') : undefined}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-orange-100 ring-2 ring-transparent group-hover:ring-orange-400 overflow-hidden flex items-center justify-center font-bold text-xs text-orange-800 shrink-0 transition-all duration-200 group-hover:scale-105 shadow-xs">
                                                                    {req.profile_image_url ? (
                                                                        <img src={req.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        (reqDisplayName || '?').charAt(0)
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-semibold text-stone-800 group-hover:text-orange-900 group-hover:underline underline-offset-2 transition-colors truncate">
                                                                        {reqDisplayName}
                                                                    </span>
                                                                    {req.member_id && (
                                                                        <span className="text-[10px] text-stone-400 group-hover:text-orange-700 transition-colors font-mono">
                                                                            {t('প্রোফাইল দেখুন →', 'View Profile →')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        </td>
                                                        <td className="px-5 py-3 text-stone-600 font-mono text-xs">{req.email}</td>
                                                        <td className="px-5 py-3 text-stone-600 font-mono text-xs">{req.mobile_number || '—'}</td>
                                                        <td className="px-5 py-3 text-stone-500 text-xs">{new Date(req.created_at).toLocaleDateString()}</td>
                                                        <td className="px-5 py-3">
                                                            <StatusBadge status={req.status} />
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            {req.status === 'pending' ? (
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <button
                                                                        onClick={() => promptAdminRequestAction(req, 'approve')}
                                                                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                                                                        title={t('অনুমোদন করুন', 'Approve as Admin')}
                                                                    >
                                                                        {t('অনুমোদন', 'Approve')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => promptAdminRequestAction(req, 'reject')}
                                                                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                                                                        title={t('প্রত্যাখ্যান করুন', 'Reject')}
                                                                    >
                                                                        {t('প্রত্যাখ্যান', 'Reject')}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-stone-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>

                        {/* ─── Existing Admins Section ────────────────────────────── */}
                        <div className="mt-6 sm:mt-8">
                        <SectionHeader
                            icon={Shield}
                            title={t('এডমিন পরিচালনা', 'Admin Management')}
                            subtitle={t('বর্তমান সিস্টেম এডমিনদের তালিকা ও নতুন এডমিন সংযোজন', 'List of current system admins and adding new admins')}
                            action={
                                <button onClick={() => setModal({ type: 'create' })} className="min-h-[40px] flex items-center gap-1.5 bg-gradient-to-r from-orange-700 to-red-800 text-white text-sm font-bold px-3.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition cursor-pointer">
                                    <Plus className="w-4 h-4" /><span className="hidden sm:inline">{t('নতুন এডমিন যোগ করুন', 'Add Admin')}</span><span className="sm:hidden">{t('যোগ করুন', 'Add')}</span>
                                </button>
                            }
                        />
                        </div>
                        {adminsLoading ? (
                            <div className="bg-white rounded-xl border border-orange-100 p-8 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-800 border-t-transparent mx-auto" />
                            </div>
                        ) : (
                            <>
                            {/* Phone: admin cards */}
                            <div className="md:hidden space-y-2.5">
                                {admins.length === 0 && <EmptyState icon={Shield} title={t('কোনো এডমিন পাওয়া যায়নি।', 'No admins found.')} />}
                                {admins.map((admin) => {
                                    const isTargetSuperAdmin = admin.role === 'superadmin';
                                    const isSelf = user && (
                                        admin.id === user.id ||
                                        (admin.email && user.email && admin.email.toLowerCase() === user.email.toLowerCase()) ||
                                        (admin.member_id && user.member_id && admin.member_id === user.member_id)
                                    );
                                    const adminName = formatName(admin.name || admin);
                                    return (
                                        <div key={admin.id} className="bg-white rounded-2xl border border-orange-100 p-3.5 shadow-sm flex items-center gap-3">
                                            <button type="button" disabled={!admin.member_id} onClick={() => admin.member_id && setSelectedProfileMemberId(admin.member_id)} className="shrink-0 active:scale-95 transition-transform disabled:cursor-default">
                                                <Avatar src={admin.profile_image_url} name={adminName} size="w-11 h-11" />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-serif font-bold text-stone-900 leading-tight truncate">{adminName}</p>
                                                <p className="text-xs text-stone-500 truncate">{admin.email}</p>
                                                <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${isTargetSuperAdmin ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-orange-100 text-orange-800'}`}>
                                                    <Shield className="w-3 h-3" />{isTargetSuperAdmin ? t('সুপারএডমিন', 'SuperAdmin') : t('এডমিন', 'Admin')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => setModal({ type: 'edit', admin })} className="w-10 h-10 rounded-xl text-orange-700 bg-orange-50 hover:bg-orange-100 flex items-center justify-center active:scale-95 transition cursor-pointer" title={t('সম্পাদনা', 'Edit')} aria-label={t('সম্পাদনা', 'Edit')}>
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {isTargetSuperAdmin ? (
                                                    <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center" title={t('সুরক্ষিত', 'Protected')}><Shield className="w-4 h-4" /></span>
                                                ) : isSelf ? (
                                                    <span className="px-2 text-xs text-stone-400 italic">{t('আপনি', 'You')}</span>
                                                ) : (
                                                    <button onClick={() => setDeleteConfirm(admin)} className="w-10 h-10 rounded-xl text-red-700 bg-red-50 hover:bg-red-100 flex items-center justify-center active:scale-95 transition cursor-pointer" title={t('এডমিন পদ অপসারণ করুন (মেম্বারে রূপান্তর)', 'Remove Admin Role (Demote to Member)')} aria-label={t('এডমিন পদ অপসারণ', 'Remove Admin Role')}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="hidden md:block bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-orange-50 border-b border-orange-100">
                                            <tr>
                                                <th className="text-left px-5 py-3 text-stone-600 font-semibold">{t('নাম', 'Name')}</th>
                                                <th className="text-left px-5 py-3 text-stone-600 font-semibold">{t('ইমেইল', 'Email')}</th>
                                                <th className="text-left px-5 py-3 text-stone-600 font-semibold">{t('ভূমিকা', 'Role')}</th>
                                                <th className="text-left px-5 py-3 text-stone-600 font-semibold">{t('তৈরির তারিখ', 'Created Date')}</th>
                                                <th className="text-left px-5 py-3 text-stone-600 font-semibold">{t('অ্যাকশন', 'Actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {admins.map((admin) => {
                                                const isTargetSuperAdmin = admin.role === 'superadmin';
                                                const isSelf = user && (
                                                    admin.id === user.id ||
                                                    (admin.email && user.email && admin.email.toLowerCase() === user.email.toLowerCase()) ||
                                                    (admin.member_id && user.member_id && admin.member_id === user.member_id)
                                                );

                                                return (
                                                    <tr key={admin.id} className="border-b border-orange-50 hover:bg-orange-50/50 transition-colors">
                                                        <td className="px-5 py-3 font-medium text-stone-800">
                                                            {admin.member_id ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedProfileMemberId(admin.member_id)}
                                                                    className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-95 transition-all duration-200"
                                                                    title={t('প্রোফাইল কার্ড দেখুন', 'View Profile Card')}
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-orange-100 ring-2 ring-transparent group-hover:ring-orange-400 overflow-hidden flex items-center justify-center font-bold text-xs text-orange-800 shrink-0 transition-all duration-200 group-hover:scale-105 shadow-xs">
                                                                        {admin.profile_image_url ? (
                                                                            <img src={admin.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            (formatName(admin.name || admin) || '?').charAt(0)
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="font-semibold text-stone-800 group-hover:text-orange-900 group-hover:underline underline-offset-2 transition-colors truncate">
                                                                            {formatName(admin.name || admin)}
                                                                        </span>
                                                                        <span className="text-[10px] text-stone-400 group-hover:text-orange-700 transition-colors font-mono">
                                                                            {t('প্রোফাইল দেখুন →', 'View Profile →')}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center font-bold text-xs text-stone-600 shrink-0">
                                                                        {(formatName(admin.name || admin) || '?').charAt(0)}
                                                                    </div>
                                                                    <span className="font-semibold text-stone-800 truncate">
                                                                        {formatName(admin.name || admin)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-stone-600">{admin.email}</td>
                                                        <td className="px-5 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${admin.role === 'superadmin' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-orange-100 text-orange-800'}`}>
                                                                {admin.role === 'superadmin' ? <Shield className="w-3 h-3 text-yellow-700" /> : <Shield className="w-3 h-3 opacity-60" />}
                                                                {admin.role === 'superadmin' ? t('সুপারএডমিন', 'SuperAdmin') : t('এডমিন', 'Admin')}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-stone-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => setModal({ type: 'edit', admin })} className="p-1.5 text-orange-700 hover:bg-orange-100 rounded-lg transition-all hover:scale-105 cursor-pointer" title={t('সম্পাদনা', 'Edit')}>
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                {isTargetSuperAdmin ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 select-none shadow-2xs" title={t('সুপারএডমিন একাউন্ট সুরক্ষিত এবং ডিলিট করা সম্ভব নয়', 'SuperAdmin accounts are protected and cannot be deleted')}>
                                                                        <Shield className="w-3 h-3 text-amber-700" />
                                                                        {t('সুরক্ষিত', 'Protected')}
                                                                    </span>
                                                                ) : isSelf ? (
                                                                    <span className="text-xs text-stone-400 italic px-2 py-1 select-none font-medium">
                                                                        {t('আপনি', 'You')}
                                                                    </span>
                                                                ) : (
                                                                    <button onClick={() => setDeleteConfirm(admin)} className="p-1.5 text-orange-700 hover:text-red-700 hover:bg-orange-100/70 rounded-lg transition-all hover:scale-105 cursor-pointer" title={t('এডমিন পদ অপসারণ করুন (মেম্বারে রূপান্তর)', 'Remove Admin Role (Demote to Member)')}>
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {admins.length === 0 && (
                                                <tr><td colSpan={5} className="px-5 py-8 text-center text-stone-400">{t('কোনো এডমিন পাওয়া যায়নি।', 'No admins found.')}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            </>
                        )}
                    </div>
                )}

                {/* Brilliant Student Requests Tab */}
                {activeTab === 'brilliant-requests' && (
                    <div className="db-rise"><BrilliantStudentRequestsAdmin /></div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="db-rise"><ProfileTab /></div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="db-rise"><UserManagement /></div>
                )}

                {/* API Logs & Monitor Tab */}
                {activeTab === 'api-logs' && (
                    <div className="db-rise"><ApiLogsAdmin /></div>
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
                <div className="fixed inset-0 app-sheet bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center border border-orange-100">
                        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 border border-orange-200">
                            <ShieldAlert className="w-7 h-7 text-orange-800" />
                        </div>
                        <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                            {t('এডমিন পদ অপসারণ করবেন?', 'Remove Admin Role?')}
                        </h3>
                        <p className="text-stone-600 text-sm leading-relaxed mb-6">
                            {t(
                                `আপনি কি নিশ্চিত যে আপনি ${formatName(deleteConfirm.name || deleteConfirm)}-এর এডমিন পদ অপসারণ করতে চান? তার একাউন্ট সাধারণ সদস্য (Member) হিসেবে বহাল থাকবে। লগইন তথ্য ও বংশতালিকার মূল প্রোফাইল সম্পূর্ণ অক্ষত ও সুরক্ষিত থাকবে।`,
                                `Are you sure you want to remove admin privileges from ${formatName(deleteConfirm.name || deleteConfirm)}? Their account will become a normal user (Member). Their login credentials and main genealogical profile will remain completely safe.`
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer">
                                {t('বাতিল', 'Cancel')}
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 bg-orange-800 hover:bg-orange-900 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors shadow-md hover:shadow-lg cursor-pointer">
                                {t('পদ অপসারণ', 'Remove Role')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search-style Profile Modal for full inspection */}
            {selectedProfileMemberId && (
                <Profile
                    memberId={selectedProfileMemberId}
                    onClose={() => setSelectedProfileMemberId(null)}
                />
            )}

            {/* Centered Modal for Admin Role Request Approval / Rejection */}
            <ConfirmModal
                isOpen={adminActionModal.isOpen}
                onClose={() => setAdminActionModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAdminAction}
                title={adminActionModal.title}
                message={adminActionModal.message}
                confirmText={adminActionModal.confirmText}
                type={adminActionModal.type}
            />
        </div>
    );
};

export default SuperAdminDashboard;
