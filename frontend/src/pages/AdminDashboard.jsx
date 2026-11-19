import React, { useState, useEffect } from 'react';
import { Users, Home, MapPin, Calendar, Bell, Star, Key, GraduationCap, LayoutGrid, Shield, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import api from '../api/api';
import ProfileTab from '../components/ProfileTab';
import DashboardCharts from '../components/DashboardCharts';
import UserManagement from '../components/UserManagement';
import BrilliantStudentRequestsAdmin from '../components/BrilliantStudentRequestsAdmin';
import { DashboardStyles, DashboardHero, StatTile, StatTileSkeleton, DashTabs, SectionHeader } from '../components/DashboardUI';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { t, formatNumber, formatName } = useLanguage();
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

    const pendingStudentRequests = stats?.pendingStudentRequests || 0;
    const pendingUserAccounts = stats?.pendingUserAccounts || 0;
    const totalAdminPending = (stats?.totalPendingNotifications !== undefined && stats.totalPendingNotifications > 0)
        ? stats.totalPendingNotifications
        : (pendingStudentRequests + pendingUserAccounts);

    const statCards = [
        { icon: Users, label: t('মোট সদস্য', 'Total Members'), value: stats?.totalMembers !== undefined ? formatNumber(stats.totalMembers) : null },
        { icon: Home, label: t('মোট বাড়ি', 'Total Homes'), value: stats?.totalHomes !== undefined ? formatNumber(stats.totalHomes) : null },
        { icon: MapPin, label: t('গ্রামসমূহ', 'Villages'), value: stats?.totalVillages !== undefined ? formatNumber(stats.totalVillages) : null },
        { icon: Calendar, label: t('অনুষ্ঠানসমূহ', 'Events'), value: stats?.totalEvents !== undefined ? formatNumber(stats.totalEvents) : null },
        { icon: Bell, label: t('বিজ্ঞপ্তিসমূহ', 'Notices'), value: stats?.totalNotices !== undefined ? formatNumber(stats.totalNotices) : null },
        { icon: Star, label: t('বিশিষ্ট ব্যক্তিবর্গ', 'Eminent Figures'), value: stats?.totalEminentFigures !== undefined ? formatNumber(stats.totalEminentFigures) : null },
    ];

    const tabs = [
        { id: 'overview', label: t('সারসংক্ষেপ', 'Overview'), icon: LayoutGrid },
        { id: 'brilliant-requests', label: t('কৃতি শিক্ষার্থী আবেদন', 'Student Requests'), icon: GraduationCap, badge: pendingStudentRequests },
        { id: 'users', label: t('ব্যবহারকারী পরিচালনা', 'User Accounts'), icon: Users, badge: pendingUserAccounts },
        { id: 'profile', label: t('প্রোফাইল ও নিরাপত্তা', 'Profile & Security'), icon: Key },
    ];

    const quickActions = [
        { show: pendingUserAccounts > 0, onClick: () => setActiveTab('users'), icon: Users, label: t('অ্যাকাউন্ট আবেদন দেখুন', 'Review account requests'), count: pendingUserAccounts },
        { show: pendingStudentRequests > 0, onClick: () => setActiveTab('brilliant-requests'), icon: GraduationCap, label: t('শিক্ষার্থী আবেদন দেখুন', 'Review student requests'), count: pendingStudentRequests },
    ].filter((a) => a.show);

    return (
        <div className="font-sans max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <DashboardStyles />

            <DashboardHero
                name={formatName(user) || user?.name || t('এডমিন', 'Admin')}
                avatarUrl={user?.profile_image_url}
                roleLabel={t('এডমিন', 'Admin')}
                subtitle={t('বংশতালিকা সিস্টেমের সংক্ষিপ্ত পরিসংখ্যান ও তথ্যচিত্র।', "Here's a snapshot of the Projenitor system.")}
                pendingCount={totalAdminPending}
                onRefresh={fetchStats}
                refreshing={loading}
            >
                <div className="grid grid-cols-2 gap-2">
                    <Link to="/admin" className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-yellow-400 text-orange-950 text-xs sm:text-sm font-black shadow-sm active:scale-95 transition-transform">
                        <Shield className="w-4 h-4" />{t('তথ্য ব্যবস্থাপনা', 'Data Panel')}
                    </Link>
                    <Link to="/explorer" className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-bold active:scale-95 transition-transform">
                        <MapPin className="w-4 h-4" />{t('বংশতালিকা', 'Lineage')}
                    </Link>
                </div>
            </DashboardHero>

            <DashTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'overview' && (
                <div className="db-rise space-y-4 sm:space-y-6">
                    {quickActions.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {quickActions.map(({ onClick, icon: Icon, label, count }) => (
                                <button key={label} type="button" onClick={onClick}
                                    className="min-h-[52px] flex items-center gap-3 px-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left active:scale-[0.98] transition-transform">
                                    <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><Icon className="w-[18px] h-[18px]" /></span>
                                    <span className="flex-1 text-sm font-bold text-amber-950">{label}</span>
                                    <span className="min-w-[24px] h-6 px-2 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center">{formatNumber(count)}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <section>
                        <SectionHeader title={t('সিস্টেম সারসংক্ষেপ', 'System Overview')} />
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                            {loading && !stats
                                ? <StatTileSkeleton count={6} />
                                : statCards.map((card, i) => <StatTile key={card.label} index={i} {...card} />)}
                        </div>
                    </section>

                    <DashboardCharts data={chartData} />

                    <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-4">
                        <Info className="w-5 h-5 text-orange-700 shrink-0 mt-0.5" />
                        <p className="text-orange-900 text-xs sm:text-sm font-medium leading-relaxed">
                            {t('আপনার কাছে এডমিন অ্যাক্সেস রয়েছে। অন্যান্য এডমিন অ্যাকাউন্ট পরিচালনা করতে সুপারএডমিনের সাথে যোগাযোগ করুন।', 'You have Admin access. To manage admin accounts, contact a SuperAdmin.')}
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'brilliant-requests' && <div className="db-rise"><BrilliantStudentRequestsAdmin /></div>}

            {activeTab === 'users' && <div className="db-rise"><UserManagement /></div>}

            {activeTab === 'profile' && <div className="db-rise"><ProfileTab /></div>}
        </div>
    );
};

export default AdminDashboard;
