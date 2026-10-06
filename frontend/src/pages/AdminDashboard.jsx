import React, { useState, useEffect } from 'react';
import { Users, Home, MapPin, Calendar, Bell, Star, Shield, LogOut, Key, RefreshCw, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import ProfileTab from '../components/ProfileTab';
import DashboardCharts from '../components/DashboardCharts';
import UserManagement from '../components/UserManagement';
import BrilliantStudentRequestsAdmin from '../components/BrilliantStudentRequestsAdmin';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-[11px] text-stone-500 font-sans uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-stone-800 font-serif">{value ?? '—'}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const { t, formatNumber } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Fetch stats and chart data independently
            const statsPromise = api.get('/admin/stats').then(res => setStats(res.data)).catch(err => console.error('Stats fetch error:', err));
            const chartPromise = api.get('/admin/chart-data').then(res => setChartData(res.data)).catch(err => console.error('Chart fetch error:', err));

            await Promise.all([statsPromise, chartPromise]);
        } catch (err) {
            console.error('Stats error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const pendingStudentRequests = stats?.pendingStudentRequests || 0;
    const pendingUserAccounts = stats?.pendingUserAccounts || 0;
    const totalAdminPending = (stats?.totalPendingNotifications !== undefined && stats.totalPendingNotifications > 0)
        ? stats.totalPendingNotifications
        : (pendingStudentRequests + pendingUserAccounts);

    const statCards = [
        { icon: Users, label: t('মোট সদস্য', 'Total Members'), value: stats?.totalMembers !== undefined ? formatNumber(stats.totalMembers) : null, color: 'bg-orange-700' },
        { icon: Home, label: t('মোট বাড়ি', 'Total Homes'), value: stats?.totalHomes !== undefined ? formatNumber(stats.totalHomes) : null, color: 'bg-red-800' },
        { icon: MapPin, label: t('গ্রামসমূহ', 'Villages'), value: stats?.totalVillages !== undefined ? formatNumber(stats.totalVillages) : null, color: 'bg-yellow-600' },
        { icon: Calendar, label: t('অনুষ্ঠানসমূহ', 'Events'), value: stats?.totalEvents !== undefined ? formatNumber(stats.totalEvents) : null, color: 'bg-emerald-700' },
        { icon: Bell, label: t('বিজ্ঞপ্তিসমূহ', 'Notices'), value: stats?.totalNotices !== undefined ? formatNumber(stats.totalNotices) : null, color: 'bg-indigo-700' },
        { icon: Star, label: t('বিশিষ্ট ব্যক্তিবর্গ', 'Eminent Figures'), value: stats?.totalEminentFigures !== undefined ? formatNumber(stats.totalEminentFigures) : null, color: 'bg-purple-700' },
    ];

    const tabs = [
        { id: 'overview', label: t('সারসংক্ষেপ', 'Overview') },
        { 
            id: 'brilliant-requests', 
            label: t('কৃতি শিক্ষার্থী আবেদন', 'Student Requests'), 
            icon: GraduationCap,
            badge: pendingStudentRequests 
        },
        { 
            id: 'users', 
            label: t('ব্যবহারকারী পরিচালনা', 'User Accounts'),
            badge: pendingUserAccounts 
        },
        { id: 'profile', label: t('প্রোফাইল ও নিরাপত্তা', 'Profile & Security') }
    ];

    return (
        <div className="min-h-screen bg-orange-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-serif font-bold text-stone-800">
                            {t('স্বাগতম,', 'Welcome back,')} {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        {totalAdminPending > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                                <span>{formatNumber(totalAdminPending)} {t('টি নতুন আবেদন', 'Pending Requests')}</span>
                            </span>
                        )}
                    </div>
                    <p className="text-stone-500 text-sm mt-1">
                        {t('বংশতালিকা সিস্টেমের সংক্ষিপ্ত পরিসংখ্যান ও তথ্যচিত্র।', "Here's a snapshot of the Projenitor system.")}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-white border border-orange-100 rounded-xl p-1.5 shadow-sm w-fit flex-wrap">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === tab.id 
                                    ? 'bg-orange-800 text-white shadow-sm' 
                                    : 'text-stone-600 hover:text-orange-800 hover:bg-orange-50'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.badge > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                    activeTab === tab.id ? 'bg-amber-400 text-stone-900' : 'bg-red-600 text-white animate-pulse'
                                }`}>
                                    {formatNumber(tab.badge)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-serif font-semibold text-stone-700">
                                {t('সিস্টেম সারসংক্ষেপ', 'System Overview')}
                            </h2>
                            <button onClick={fetchStats} className="flex items-center gap-1 text-sm text-orange-700 hover:text-orange-900 transition-colors cursor-pointer">
                                <RefreshCw className="w-4 h-4" /> {t('রিফ্রেশ', 'Refresh')}
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-orange-100" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {statCards.map((card) => <StatCard key={card.label} {...card} />)}
                            </div>
                        )}

                        <DashboardCharts data={chartData} />

                        <div className="mt-8 bg-orange-100 border border-orange-200 rounded-xl p-5 text-center">
                            <p className="text-orange-800 text-sm font-medium">
                                {t('আপনার কাছে এডমিন অ্যাক্সেস রয়েছে। অন্যান্য এডমিন অ্যাকাউন্ট পরিচালনা করতে সুপারএডমিনের সাথে যোগাযোগ করুন।', 'You have Admin access. To manage admin accounts, contact a SuperAdmin.')}
                            </p>
                        </div>
                    </>
                )}

                {activeTab === 'brilliant-requests' && <BrilliantStudentRequestsAdmin />}

                {activeTab === 'users' && <UserManagement />}

                {activeTab === 'profile' && <ProfileTab />}
            </div>
        </div>
    );
};

export default AdminDashboard;
