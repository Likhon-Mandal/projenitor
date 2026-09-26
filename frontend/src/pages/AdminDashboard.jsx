import React, { useState, useEffect } from 'react';
import { Users, Home, MapPin, Calendar, Bell, Star, Shield, LogOut, Key, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import ProfileTab from '../components/ProfileTab';
import DashboardCharts from '../components/DashboardCharts';

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

    const statCards = [
        { icon: Users, label: 'Total Members', value: stats?.totalMembers, color: 'bg-orange-700' },
        { icon: Home, label: 'Total Homes', value: stats?.totalHomes, color: 'bg-red-800' },
        { icon: MapPin, label: 'Villages', value: stats?.totalVillages, color: 'bg-yellow-600' },
        { icon: Calendar, label: 'Events', value: stats?.totalEvents, color: 'bg-emerald-700' },
        { icon: Bell, label: 'Notices', value: stats?.totalNotices, color: 'bg-indigo-700' },
        { icon: Star, label: 'Eminent Figures', value: stats?.totalEminentFigures, color: 'bg-purple-700' },
    ];

    return (
        <div className="min-h-screen bg-orange-50">


            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-serif font-bold text-stone-800">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-stone-500 text-sm mt-1">Here's a snapshot of the Projenitor system.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-white border border-orange-100 rounded-xl p-1.5 shadow-sm w-fit">
                    {['overview', 'profile'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-orange-800 text-white shadow-sm' : 'text-stone-600 hover:text-orange-800 hover:bg-orange-50'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-serif font-semibold text-stone-700">System Overview</h2>
                            <button onClick={fetchStats} className="flex items-center gap-1 text-sm text-orange-700 hover:text-orange-900 transition-colors">
                                <RefreshCw className="w-4 h-4" /> Refresh
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
                                You have Admin access. To manage admin accounts, contact a SuperAdmin.
                            </p>
                        </div>
                    </>
                )}

                {activeTab === 'profile' && <ProfileTab />}
            </div>
        </div>
    );
};

export default AdminDashboard;
