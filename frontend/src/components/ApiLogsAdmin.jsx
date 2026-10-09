import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Activity, AlertTriangle, AlertCircle, CheckCircle2, Clock, Server, 
    RefreshCw, Trash2, Download, Search, X, ChevronRight, ChevronLeft, 
    Copy, Check, Eye, Shield, User, Globe, Code, ArrowUpDown, Filter,
    Terminal, Calendar, Zap, HardDriveDownload
} from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from './ConfirmModal';

const ApiLogsAdmin = () => {
    const { t, formatNumber, isBn } = useLanguage();

    // State
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); // 0 = off, 5, 10, 30
    
    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'error', 'success', '4xx', '5xx'
    const [methodFilter, setMethodFilter] = useState('all'); // 'all', 'GET', 'POST', 'PUT', 'DELETE'
    const [timeRange, setTimeRange] = useState('24h'); // '1h', '24h', '7d', 'all'

    // Selected log for detailed diagnostic modal
    const [selectedLog, setSelectedLog] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [clearModalOpen, setClearModalOpen] = useState(false);
    const [clearDays, setClearDays] = useState(0); // 0 = all
    const [clearing, setClearing] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch API logs
    const fetchLogs = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setRefreshing(true);
            const params = {
                page,
                limit,
                search: debouncedSearch || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                method: methodFilter !== 'all' ? methodFilter : undefined,
                timeRange: timeRange !== 'all' ? timeRange : undefined
            };

            const res = await api.get('/admin/api-logs', { params });
            if (res.data) {
                setLogs(res.data.logs || []);
                setStats(res.data.stats || null);
                if (res.data.pagination) {
                    setTotalPages(res.data.pagination.totalPages || 1);
                    setTotalCount(res.data.pagination.total || 0);
                }
            }
        } catch (err) {
            console.error('Failed to fetch API logs:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, limit, debouncedSearch, statusFilter, methodFilter, timeRange]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Auto-refresh interval
    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const timer = setInterval(() => {
            fetchLogs(true);
        }, autoRefreshInterval * 1000);
        return () => clearInterval(timer);
    }, [autoRefreshInterval, fetchLogs]);

    // Copy to clipboard helper
    const handleCopy = (text, fieldName) => {
        if (!text) return;
        const str = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
        navigator.clipboard.writeText(str);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Handle clear logs
    const handleClearLogs = async () => {
        try {
            setClearing(true);
            await api.delete('/admin/api-logs', {
                data: { olderThanDays: clearDays > 0 ? clearDays : undefined }
            });
            setClearModalOpen(false);
            fetchLogs();
        } catch (err) {
            console.error('Failed to clear logs:', err);
            alert(err.response?.data?.error || 'Failed to clear logs');
        } finally {
            setClearing(false);
        }
    };

    // Export current logs as JSON
    const handleExportJson = () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `projenitor-api-logs-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    // Helper: Method badge colors
    const getMethodBadge = (method) => {
        switch (method?.toUpperCase()) {
            case 'GET':
                return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'POST':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'PUT':
            case 'PATCH':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'DELETE':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            default:
                return 'bg-stone-100 text-stone-800 border-stone-200';
        }
    };

    // Helper: Status code badge colors
    const getStatusBadge = (code) => {
        if (code >= 200 && code < 300) {
            return 'bg-emerald-500/10 text-emerald-700 border-emerald-200 font-bold';
        }
        if (code >= 300 && code < 400) {
            return 'bg-blue-500/10 text-blue-700 border-blue-200 font-bold';
        }
        if (code >= 400 && code < 500) {
            return 'bg-amber-500/15 text-amber-800 border-amber-300 font-black';
        }
        return 'bg-rose-500/15 text-rose-800 border-rose-300 font-black animate-pulse';
    };

    // Format relative time
    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = new Date(ts);
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 15) return isBn ? 'এইমাত্র' : 'Just now';
        if (diffSec < 60) return `${diffSec}s ${isBn ? 'আগে' : 'ago'}`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ${isBn ? 'আগে' : 'ago'}`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour}h ${isBn ? 'আগে' : 'ago'}`;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString();
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* ── Top Header & Actions ── */}
            <div className="bg-white rounded-2xl shadow-xs border border-orange-100 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-800 text-white flex items-center justify-center shadow-xs">
                            <Terminal className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-stone-900">
                                {t('এপিআই লগ ও ডায়াগনস্টিক মনিটর', 'API Audit & Error Logs')}
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">
                                {t('রিয়েল-টাইম এপিআই রিকোয়েস্ট, এরর ডায়াগনস্টিকস ও রেসপন্স পর্যবেক্ষণ।', 'Track every API call, inspect status, errors, reasons & response times.')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Auto Refresh Select */}
                    <div className="flex items-center gap-1.5 bg-orange-50/70 border border-orange-200/80 rounded-xl px-2.5 py-1.5 text-xs text-stone-700">
                        <Zap size={14} className={autoRefreshInterval > 0 ? "text-amber-600 animate-pulse" : "text-stone-400"} />
                        <span className="font-medium hidden sm:inline">{t('লাইভ রিফ্রেশ:', 'Live:')}</span>
                        <select
                            value={autoRefreshInterval}
                            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                            className="bg-transparent text-xs font-bold text-orange-950 focus:outline-none cursor-pointer"
                        >
                            <option value={0}>{t('বন্ধ (Off)', 'Off')}</option>
                            <option value={5}>5s</option>
                            <option value={10}>10s</option>
                            <option value={30}>30s</option>
                        </select>
                    </div>

                    {/* Manual Refresh Button */}
                    <button
                        type="button"
                        onClick={() => fetchLogs()}
                        disabled={refreshing}
                        className="px-3 py-1.5 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-orange-900 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title={t('পুনরায় লোড করুন', 'Refresh')}
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-orange-700' : 'text-stone-500'} />
                        <span className="hidden sm:inline">{t('রিফ্রেশ', 'Refresh')}</span>
                    </button>

                    {/* Export JSON Button */}
                    <button
                        type="button"
                        onClick={handleExportJson}
                        disabled={logs.length === 0}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs disabled:opacity-40"
                        title={t('লগ ডাউনলোড করুন (JSON)', 'Export Logs (JSON)')}
                    >
                        <HardDriveDownload size={14} className="text-stone-500" />
                        <span className="hidden sm:inline">{t('এক্সপোর্ট', 'Export')}</span>
                    </button>

                    {/* Clear Logs Button */}
                    <button
                        type="button"
                        onClick={() => setClearModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100/80 text-red-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title={t('লগ মুছুন', 'Clear Logs')}
                    >
                        <Trash2 size={14} className="text-red-600" />
                        <span>{t('মুছুন', 'Clear')}</span>
                    </button>
                </div>
            </div>

            {/* ── KPI Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* Total Requests */}
                <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
                        <Activity size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider truncate">
                            {t('মোট রিকোয়েস্ট (২৪ঘ)', 'Requests (24h)')}
                        </p>
                        <p className="text-xl font-bold font-serif text-stone-900 mt-0.5">
                            {formatNumber(stats?.totalRequests ?? totalCount)}
                        </p>
                    </div>
                </div>

                {/* Success Count */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">
                            {t('সফল (2xx)', 'Success')}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xl font-bold font-serif text-emerald-900">
                                {formatNumber(stats?.successCount ?? 0)}
                            </span>
                            {stats?.totalRequests > 0 && (
                                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {(100 - (stats.errorRate || 0)).toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Total Errors */}
                <div className={`p-4 rounded-2xl border shadow-2xs flex items-center gap-3 transition-colors ${
                    (stats?.errorCount || 0) > 0 ? 'bg-red-50/60 border-red-200' : 'bg-white border-stone-200'
                }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        (stats?.errorCount || 0) > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-stone-100 text-stone-500'
                    }`}>
                        <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider truncate">
                            {t('মোট এরর', 'Total Errors')}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xl font-bold font-serif text-red-700">
                                {formatNumber(stats?.errorCount ?? 0)}
                            </span>
                            {(stats?.errorCount || 0) > 0 && (
                                <span className="text-[10px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded-full">
                                    {stats?.errorRate}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Server 500 Errors */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        (stats?.count500 || 0) > 0 ? 'bg-rose-100 text-rose-700 font-black' : 'bg-stone-100 text-stone-500'
                    }`}>
                        <Server size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
                            {t('সার্ভার এরর (500)', 'Server (500)')}
                        </p>
                        <p className={`text-xl font-bold font-serif mt-0.5 ${
                            (stats?.count500 || 0) > 0 ? 'text-rose-700 font-extrabold' : 'text-stone-800'
                        }`}>
                            {formatNumber(stats?.count500 ?? 0)}
                        </p>
                    </div>
                </div>

                {/* Avg Response Time */}
                <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-2xs flex items-center gap-3 col-span-2 lg:col-span-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Clock size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider truncate">
                            {t('গড় সময়', 'Avg Response')}
                        </p>
                        <p className="text-xl font-bold font-serif text-stone-900 mt-0.5">
                            {formatNumber(stats?.avgResponseTime ?? 0)} ms
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Filters & Search Toolbar ── */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-2xs p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('এন্ডপয়েন্ট, এরর কারণ, ব্যবহারকারী বা IP খুঁজুন...', 'Search endpoint, error reason, user or IP...')}
                            className="w-full bg-stone-50 border border-stone-200 focus:border-orange-500 focus:bg-white pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none transition-all"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Method & Time filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Method Selector */}
                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700">
                            <span className="font-bold text-stone-400 uppercase text-[10px]">{t('মেথড:', 'Method:')}</span>
                            <select
                                value={methodFilter}
                                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
                            >
                                <option value="all">{t('সব মেথড', 'All Methods')}</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
                            </select>
                        </div>

                        {/* Time Range Selector */}
                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700">
                            <Calendar size={13} className="text-stone-400" />
                            <select
                                value={timeRange}
                                onChange={(e) => { setTimeRange(e.target.value); setPage(1); }}
                                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
                            >
                                <option value="1h">{t('গত ১ ঘণ্টা', 'Last 1 Hour')}</option>
                                <option value="24h">{t('গত ২৪ ঘণ্টা', 'Last 24 Hours')}</option>
                                <option value="7d">{t('গত ৭ দিন', 'Last 7 Days')}</option>
                                <option value="30d">{t('গত ৩০ দিন', 'Last 30 Days')}</option>
                                <option value="all">{t('সর্বমোট সময়', 'All Time')}</option>
                            </select>
                        </div>

                        {/* Rows per page */}
                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700">
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
                            >
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1">
                        {t('স্ট্যাটাস ফিল্টার:', 'Status:')}
                    </span>
                    {[
                        { id: 'all', label: t('সব লগ', 'All Logs') },
                        { id: 'error', label: t('🚨 শুধুমাত্র এরর (Errors)', '🚨 Errors Only'), badge: stats?.errorCount },
                        { id: '5xx', label: t('সার্ভার এরর (5xx)', 'Server Errors (5xx)'), badge: stats?.count500 },
                        { id: '4xx', label: t('ক্লায়েন্ট এরর (4xx)', 'Client Errors (4xx)'), badge: stats?.count400 },
                        { id: 'success', label: t('সফল (2xx Success)', 'Success (2xx)'), badge: stats?.count200 }
                    ].map((pill) => {
                        const active = statusFilter === pill.id;
                        return (
                            <button
                                key={pill.id}
                                type="button"
                                onClick={() => { setStatusFilter(pill.id); setPage(1); }}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border ${
                                    active 
                                        ? 'bg-orange-800 text-white border-orange-800 shadow-2xs' 
                                        : 'bg-stone-50 hover:bg-orange-50/70 text-stone-600 border-stone-200'
                                }`}
                            >
                                <span>{pill.label}</span>
                                {pill.badge > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                        active ? 'bg-amber-400 text-stone-900' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {formatNumber(pill.badge)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Logs Table / List ── */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-8 h-8 border-3 border-orange-800 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-bold text-stone-500">{t('এপিআই লগ লোড হচ্ছে...', 'Loading API audit logs...')}</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
                            <Activity size={24} />
                        </div>
                        <h4 className="text-base font-serif font-bold text-stone-700">
                            {t('কোনো এপিআই লগ পাওয়া যায়নি', 'No API logs found')}
                        </h4>
                        <p className="text-xs text-stone-400 max-w-sm mx-auto">
                            {t('বর্তমান ফিল্টার অনুযায়ী কোনো রেকর্ড নেই। ফিল্টার পরিবর্তন করে পুনরায় দেখুন।', 'No logs match the current search or filter criteria. Try resetting filters.')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-orange-50/70 text-stone-600 border-b border-orange-100 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3 px-4">{t('স্ট্যাটাস', 'Status')}</th>
                                    <th className="py-3 px-3">{t('মেথড', 'Method')}</th>
                                    <th className="py-3 px-4">{t('এন্ডপয়েন্ট ও রিকোয়েস্ট', 'Endpoint & Request')}</th>
                                    <th className="py-3 px-4">{t('ফলাফল / এরর কারণ', 'Result / Error Reason')}</th>
                                    <th className="py-3 px-3">{t('সময়', 'Latency')}</th>
                                    <th className="py-3 px-3">{t('ইউজার / IP', 'User / IP')}</th>
                                    <th className="py-3 px-4 text-right">{t('অ্যাকশন', 'Action')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {logs.map((log) => {
                                    const isError = !log.success;
                                    return (
                                        <tr 
                                            key={log.id} 
                                            onClick={() => setSelectedLog(log)}
                                            className={`transition-colors cursor-pointer group hover:bg-orange-50/50 ${
                                                isError ? 'bg-red-50/20' : ''
                                            }`}
                                        >
                                            {/* Status Code */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] border ${getStatusBadge(log.status_code)}`}>
                                                        {isError ? <AlertCircle size={12} className="text-rose-600 shrink-0" /> : <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />}
                                                        <span>{log.status_code}</span>
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Method */}
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getMethodBadge(log.method)}`}>
                                                    {log.method}
                                                </span>
                                            </td>

                                            {/* Endpoint */}
                                            <td className="py-3 px-4 max-w-xs sm:max-w-md min-w-[200px]">
                                                <div className="font-mono text-[11px] font-bold text-stone-800 truncate group-hover:text-orange-900 transition-colors" title={log.endpoint}>
                                                    {log.endpoint}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                                                    <span>{formatTime(log.timestamp)}</span>
                                                    {log.query_params && (
                                                        <span className="font-mono text-stone-500 truncate max-w-[150px]">
                                                            ?{new URLSearchParams(log.query_params).toString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Error Reason / Result */}
                                            <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                                                {isError ? (
                                                    <div className="flex items-start gap-1.5 text-red-700 bg-red-100/60 border border-red-200/80 px-2.5 py-1 rounded-lg text-[11px]">
                                                        <AlertTriangle size={13} className="text-red-600 shrink-0 mt-0.5" />
                                                        <span className="font-semibold truncate" title={log.error_message}>
                                                            {log.error_message || 'Unknown Server Error'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-emerald-700 font-medium text-[11px] truncate">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="truncate">
                                                            {log.error_message === 'Success' ? (isBn ? 'সফল রেসপন্স' : 'Success') : log.error_message}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Latency / Response Time */}
                                            <td className="py-3 px-3 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                                                <span className={`font-bold ${
                                                    log.response_time_ms > 800 ? 'text-red-600 font-black' : 
                                                    log.response_time_ms > 300 ? 'text-amber-600' : 'text-stone-700'
                                                }`}>
                                                    {log.response_time_ms} ms
                                                </span>
                                            </td>

                                            {/* User / IP */}
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                                        {log.user_name ? log.user_name.charAt(0).toUpperCase() : <Globe size={11} className="text-stone-400" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold text-stone-800 truncate max-w-[110px]" title={log.user_name || log.user_email || 'Guest'}>
                                                            {log.user_name || log.user_email?.split('@')[0] || (isBn ? 'অতিথি' : 'Guest')}
                                                        </p>
                                                        <p className="text-[9px] font-mono text-stone-400 truncate max-w-[90px]" title={log.ip_address}>
                                                            {log.ip_address || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Action View */}
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                                    className="p-1.5 text-stone-400 group-hover:text-orange-800 hover:bg-orange-100 rounded-lg transition-all active:scale-95 cursor-pointer"
                                                    title={t('সম্পূর্ণ বিবরণ দেখুন', 'View Diagnostic Details')}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination Footer ── */}
                <div className="bg-orange-50/40 px-4 py-3 border-t border-orange-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 font-medium">
                    <div>
                        {t('মোট লগ:', 'Total logs:')} <span className="font-bold text-stone-900">{formatNumber(totalCount)}</span>
                        {totalPages > 1 && (
                            <span className="ml-2 text-stone-400">
                                ({t('পৃষ্ঠা', 'Page')} {formatNumber(page)} / {formatNumber(totalPages)})
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-stone-700 disabled:opacity-40 hover:bg-orange-50 font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} />
                            <span>{t('পূর্ববর্তী', 'Prev')}</span>
                        </button>

                        <span className="px-2 text-stone-800 font-bold">
                            {formatNumber(page)}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-stone-700 disabled:opacity-40 hover:bg-orange-50 font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <span>{t('পরবর্তী', 'Next')}</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Diagnostic Detail Modal ── */}
            {selectedLog && (
                <div 
                    className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
                    onClick={() => setSelectedLog(null)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-orange-950 p-5 sm:p-6 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
                            <div className="flex items-center gap-3 min-w-0 z-10">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border ${getMethodBadge(selectedLog.method)}`}>
                                    {selectedLog.method}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="font-mono text-sm sm:text-base font-bold text-amber-200 truncate" title={selectedLog.endpoint}>
                                        {selectedLog.endpoint}
                                    </h3>
                                    <p className="text-[11px] text-stone-300 mt-0.5">
                                        ID #{selectedLog.id} • {new Date(selectedLog.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer z-10"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Scrollable Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
                            {/* Key Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">{t('স্ট্যাটাস কোড', 'Status Code')}</span>
                                    <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                                        selectedLog.success ? 'text-emerald-700' : 'text-red-700'
                                    }`}>
                                        {selectedLog.status_code} {selectedLog.success ? '• Success' : '• Error'}
                                    </span>
                                </div>
                                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">{t('রেসপন্স সময়', 'Latency')}</span>
                                    <span className="font-mono font-bold text-sm text-stone-800">
                                        {selectedLog.response_time_ms} ms
                                    </span>
                                </div>
                                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">{t('ব্যবহারকারী', 'User')}</span>
                                    <span className="font-bold text-stone-800 truncate block" title={selectedLog.user_email || 'Guest'}>
                                        {selectedLog.user_name || selectedLog.user_email || 'Guest'}
                                    </span>
                                </div>
                                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">{t('ক্লায়েন্ট IP', 'Client IP')}</span>
                                    <span className="font-mono font-bold text-stone-800 truncate block">
                                        {selectedLog.ip_address || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Prominent Error Reason Banner (if error) */}
                            {!selectedLog.success && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-1.5 animate-in fade-in">
                                    <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                                        <AlertTriangle size={18} className="text-red-600 shrink-0" />
                                        <span>{t('এররের সুনির্দিষ্ট কারণ (Error Reason):', 'Exact Error Reason:')}</span>
                                    </div>
                                    <p className="font-mono text-red-950 text-xs sm:text-sm bg-white/90 p-3 rounded-xl border border-red-100 whitespace-pre-wrap break-words font-semibold">
                                        {selectedLog.error_message || 'Unspecified Error'}
                                    </p>
                                    {selectedLog.error_stack && (
                                        <div className="mt-2">
                                            <span className="text-[10px] font-bold uppercase text-red-700 block mb-1">Stack Trace:</span>
                                            <pre className="p-3 bg-stone-900 text-rose-300 rounded-xl font-mono text-[10px] overflow-x-auto max-h-40 custom-scrollbar">
                                                {selectedLog.error_stack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Client & Device Details */}
                            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-2">
                                <h4 className="font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                    <Shield size={14} className="text-orange-800" />
                                    <span>{t('ক্লায়েন্ট ও ডিভাইসের বিবরণ', 'Client & Authentication Context')}</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                        <span className="text-stone-400 block">{t('ব্যবহারকারীর ভূমিকা (Role):', 'User Role:')}</span>
                                        <span className="font-bold text-stone-800 uppercase text-[10px] bg-orange-100 text-orange-900 px-2 py-0.5 rounded inline-block mt-0.5">
                                            {selectedLog.user_role || 'guest'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-stone-400 block">{t('ইউজার আইডি:', 'User ID:')}</span>
                                        <span className="font-bold text-stone-800">{selectedLog.user_id ? `#${selectedLog.user_id}` : 'Unauthenticated'}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-stone-400 block">{t('ইউজার এজেন্ট (User Agent):', 'User Agent:')}</span>
                                        <span className="font-mono text-stone-700 break-words">{selectedLog.user_agent || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Query Parameters (if any) */}
                            {selectedLog.query_params && Object.keys(selectedLog.query_params).length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                            <Code size={13} className="text-orange-800" />
                                            <span>{t('কুয়েরি প্যারামিটার (Query Parameters)', 'Query Parameters')}</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(selectedLog.query_params, 'query')}
                                            className="text-orange-800 hover:text-orange-950 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                                        >
                                            {copiedField === 'query' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            <span>{copiedField === 'query' ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    </div>
                                    <pre className="p-3 bg-stone-900 text-amber-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36 custom-scrollbar">
                                        {JSON.stringify(selectedLog.query_params, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Request Body (Payload) */}
                            {selectedLog.request_body && Object.keys(selectedLog.request_body).length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                            <Code size={13} className="text-orange-800" />
                                            <span>{t('রিকোয়েস্ট বডি (Request Body - Sanitized)', 'Request Body (Sanitized)')}</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(selectedLog.request_body, 'body')}
                                            className="text-orange-800 hover:text-orange-950 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                                        >
                                            {copiedField === 'body' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            <span>{copiedField === 'body' ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    </div>
                                    <pre className="p-3 bg-stone-900 text-sky-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                                        {JSON.stringify(selectedLog.request_body, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Response Body (Payload) */}
                            {selectedLog.response_body && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                            <Code size={13} className="text-emerald-700" />
                                            <span>{t('রেসপন্স ডেটা (Response Body)', 'Response Data')}</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(selectedLog.response_body, 'response')}
                                            className="text-orange-800 hover:text-orange-950 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                                        >
                                            {copiedField === 'response' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            <span>{copiedField === 'response' ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    </div>
                                    <pre className="p-3 bg-stone-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                                        {JSON.stringify(selectedLog.response_body, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-stone-50 p-4 border-t border-stone-200 flex items-center justify-between shrink-0">
                            <button
                                type="button"
                                onClick={() => handleCopy(selectedLog, 'all')}
                                className="px-3.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl font-bold text-stone-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                            >
                                {copiedField === 'all' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                <span>{copiedField === 'all' ? t('কপি হয়েছে!', 'Copied Full Log!') : t('সম্পূর্ণ লগ কপি করুন', 'Copy Full Log JSON')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="px-5 py-1.5 bg-orange-800 hover:bg-orange-900 text-white rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-xs"
                            >
                                {t('বন্ধ করুন', 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Clear Logs Modal ── */}
            {clearModalOpen && (
                <div 
                    className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setClearModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-base text-stone-900">
                                    {t('এপিআই লগ মুছে ফেলার নিশ্চিতকরণ', 'Clear API Audit Logs')}
                                </h3>
                                <p className="text-xs text-stone-500">
                                    {t('আপনি কি লগগুলো চিরতরে মুছে ফেলতে চান?', 'Choose which logs to purge from the database.')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="block text-xs font-bold text-stone-700">
                                {t('মুছে ফেলার অপশন নির্বাচন করুন:', 'Select deletion scope:')}
                            </label>
                            <div className="space-y-2 text-xs">
                                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="clearOption" 
                                        checked={clearDays === 0} 
                                        onChange={() => setClearDays(0)} 
                                        className="text-orange-800 focus:ring-orange-800 cursor-pointer"
                                    />
                                    <span className="font-bold text-red-700">{t('সব লগ মুছে ফেলুন (Delete All Logs)', 'Delete all logs completely')}</span>
                                </label>
                                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="clearOption" 
                                        checked={clearDays === 7} 
                                        onChange={() => setClearDays(7)} 
                                        className="text-orange-800 focus:ring-orange-800 cursor-pointer"
                                    />
                                    <span className="font-medium text-stone-800">{t('৭ দিনের পুরোনো লগ মুছুন', 'Delete logs older than 7 days')}</span>
                                </label>
                                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="clearOption" 
                                        checked={clearDays === 30} 
                                        onChange={() => setClearDays(30)} 
                                        className="text-orange-800 focus:ring-orange-800 cursor-pointer"
                                    />
                                    <span className="font-medium text-stone-800">{t('৩০ দিনের পুরোনো লগ মুছুন', 'Delete logs older than 30 days')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => setClearModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer"
                            >
                                {t('বাতিল', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleClearLogs}
                                disabled={clearing}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {clearing && <RefreshCw size={13} className="animate-spin" />}
                                <span>{t('নিশ্চিত মুছুন', 'Confirm Delete')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiLogsAdmin;
