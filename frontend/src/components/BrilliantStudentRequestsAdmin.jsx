import React, { useState, useEffect } from 'react';
import { 
    GraduationCap, Check, X, Eye, FileText, Clock, AlertCircle, 
    CheckCircle2, XCircle, Search, Filter, RefreshCw, Trash2,
    Building2, BookOpen, Calendar, Award, User, Mail, Phone, ExternalLink
} from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import Profile from '../pages/Profile';
import ConfirmModal from './ConfirmModal';

const BrilliantStudentRequestsAdmin = () => {
    const { t, isBn, formatName, formatNumber } = useLanguage();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
    const [searchQuery, setSearchQuery] = useState('');

    // Action dialog states
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        action: 'approve', // 'approve' | 'reject'
        request: null,
        adminNote: '',
        customTitle: '',
        submitting: false
    });

    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        requestId: null
    });

    // Profile modal inspection (search section profile card)
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    // Submitter account inspection modal (for non-member accounts)
    const [submitterModal, setSubmitterModal] = useState({
        isOpen: false,
        submitter: null
    });

    // Document image preview
    const [docPreview, setDocPreview] = useState(null); // url

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/brilliant-students/admin/requests');
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch brilliant student requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Filtered requests
    const filteredRequests = requests.filter(req => {
        if (statusFilter !== 'all' && req.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const candidateMatch = 
            (req.member_name && req.member_name.toLowerCase().includes(q)) ||
            (req.member_name_bangla && req.member_name_bangla.toLowerCase().includes(q)) ||
            (req.member_name_english && req.member_name_english.toLowerCase().includes(q)) ||
            (req.member_village && req.member_village.toLowerCase().includes(q));
        const applicantMatch = 
            (req.applicant_name && req.applicant_name.toLowerCase().includes(q)) ||
            (req.applicant_email && req.applicant_email.toLowerCase().includes(q)) ||
            (req.applicant_phone && req.applicant_phone.includes(q));
        const instMatch = 
            (req.institution && req.institution.toLowerCase().includes(q)) ||
            (req.achievement_type && req.achievement_type.toLowerCase().includes(q)) ||
            (req.subject_department && req.subject_department.toLowerCase().includes(q));
        return candidateMatch || applicantMatch || instMatch;
    });

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;

    const handleOpenAction = (req, action) => {
        // Pre-compose title for approval
        let defaultTitle = '';
        if (action === 'approve') {
            const parts = [];
            if (req.subject_department) {
                parts.push(`${req.achievement_type} (${req.subject_department})`);
            } else if (req.result_grade) {
                parts.push(`${req.achievement_type} (${req.result_grade})`);
            } else {
                parts.push(req.achievement_type);
            }
            if (req.institution) parts.push(req.institution);
            if (req.exam_year) parts.push(`(${req.exam_year})`);
            defaultTitle = parts.join(' - ');
        }

        setActionModal({
            isOpen: true,
            action,
            request: req,
            adminNote: action === 'approve' ? 'যোগ্য বিবেচিত হওয়ায় অনুমোদন করা হলো।' : '',
            customTitle: defaultTitle,
            submitting: false
        });
    };

    const handleConfirmAction = async () => {
        if (!actionModal.request) return;
        try {
            setActionModal(prev => ({ ...prev, submitting: true }));
            await api.put(`/brilliant-students/admin/requests/${actionModal.request.id}`, {
                action: actionModal.action,
                admin_note: actionModal.adminNote,
                custom_title: actionModal.customTitle
            });
            setActionModal({ isOpen: false, action: 'approve', request: null, adminNote: '', customTitle: '', submitting: false });
            fetchRequests();
        } catch (err) {
            console.error('Action error:', err);
            alert(err.response?.data?.error || 'Failed to process request');
            setActionModal(prev => ({ ...prev, submitting: false }));
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.requestId) return;
        try {
            await api.delete(`/brilliant-students/admin/requests/${deleteConfirm.requestId}`);
            setDeleteConfirm({ isOpen: false, requestId: null });
            fetchRequests();
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.response?.data?.error || 'Failed to delete request');
        }
    };

    const handleViewMember = (req) => {
        if (req.member_id) {
            setSelectedMemberId(req.member_id);
        }
    };

    const handleViewApplicant = (req) => {
        const applicantMemberId = req.applicant_resolved_member_id || req.applicant_member_id;
        if (applicantMemberId) {
            setSelectedMemberId(applicantMemberId);
        } else {
            setSubmitterModal({
                isOpen: true,
                submitter: {
                    name: req.applicant_name,
                    email: req.applicant_email,
                    phone: req.applicant_phone,
                    role: req.applicant_role,
                    userId: req.applicant_user_id
                }
            });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header and Controls */}
            <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-serif font-bold text-stone-800 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-orange-800" />
                        <span>{t('কৃতি শিক্ষার্থী স্বীকৃতির আবেদনসমূহ', 'Brilliant Student Recognition Requests')}</span>
                        {pendingCount > 0 && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                <span>{formatNumber(pendingCount)} {t('নতুন পর্যালোচনাধীন', 'Pending Requests')}</span>
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                        {t('সদস্য বা এডমিনদের প্রেরিত কৃতি শিক্ষার্থী মনোনয়ন যাচাই করে বিশিষ্ট ব্যক্তিত্ব তালিকায় অনুমোদন দিন।', 'Review and approve academic recognition requests to honor brilliant students.')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="px-3.5 py-2 rounded-xl bg-orange-50 text-orange-800 hover:bg-orange-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>{t('রিফ্রেশ', 'Refresh')}</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs and Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Status Badges */}
                <div className="flex items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
                    {[
                        { id: 'all', label: t('সবগুলো', 'All'), count: requests.length },
                        { id: 'pending', label: t('পর্যালোচনাধীন', 'Pending'), count: pendingCount, color: 'text-amber-800 bg-amber-100' },
                        { id: 'approved', label: t('অনুমোদিত', 'Approved'), count: approvedCount, color: 'text-emerald-800 bg-emerald-100' },
                        { id: 'rejected', label: t('প্রত্যাখ্যাত', 'Rejected'), count: rejectedCount, color: 'text-red-800 bg-red-100' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                statusFilter === tab.id
                                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80'
                                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab.color || 'bg-stone-200 text-stone-700'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('শিক্ষার্থী, প্রতিষ্ঠান বা আবেদনকারী...', 'Search student, school, requester...')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
                    />
                </div>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="bg-white rounded-3xl p-16 text-center text-stone-400 border border-stone-100 shadow-sm animate-pulse">
                    {t('আবেদনসমূহ লোড হচ্ছে...', 'Loading requests...')}
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center text-stone-400 border border-stone-100 shadow-sm flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center mb-3">
                        <GraduationCap size={28} />
                    </div>
                    <h3 className="text-base font-bold text-stone-700">{t('কোনো আবেদন পাওয়া যায়নি', 'No requests found')}</h3>
                    <p className="text-xs text-stone-400 max-w-sm mt-1">
                        {statusFilter === 'pending' 
                            ? t('বর্তমানে কোনো নতুন আবেদন পর্যালোচনাধীন নেই।', 'No pending requests at the moment.')
                            : t('এই ফিল্টারের সাথে মিলে এমন কোনো আবেদন নেই।', 'No requests match the selected filter.')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3.5">
                    {filteredRequests.map(req => {
                        const isSelfNomination = req.applicant_member_id === req.member_id || (!req.applicant_member_id && req.applicant_name === req.member_name);

                        return (
                            <div 
                                key={req.id}
                                className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md overflow-hidden ${
                                    req.status === 'pending'
                                        ? 'border-amber-200 ring-1 ring-amber-100/80'
                                        : req.status === 'approved'
                                        ? 'border-emerald-200'
                                        : 'border-stone-200'
                                }`}
                            >
                                {/* Top Bar: Status, Date, Quick Badge & Actions */}
                                <div className={`px-3.5 py-1.5 sm:px-4 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b ${
                                    req.status === 'pending'
                                        ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                                        : req.status === 'approved'
                                        ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                                        : 'bg-stone-50 border-stone-200 text-stone-700'
                                }`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                                            req.status === 'pending'
                                                ? 'bg-amber-200/90 text-amber-950 border border-amber-300'
                                                : req.status === 'approved'
                                                ? 'bg-emerald-200/90 text-emerald-950 border border-emerald-300'
                                                : 'bg-red-100 text-red-900 border border-red-200'
                                        }`}>
                                            {req.status === 'pending' && <Clock size={11} className="animate-spin text-amber-800" />}
                                            {req.status === 'approved' && <CheckCircle2 size={11} className="text-emerald-700" />}
                                            {req.status === 'rejected' && <XCircle size={11} className="text-red-700" />}
                                            <span>
                                                {req.status === 'pending' && t('পর্যালোচনাধীন', 'Pending Review')}
                                                {req.status === 'approved' && t('অনুমোদিত (বিশিষ্ট ব্যক্তিত্বে অন্তর্ভুক্ত)', 'Approved (In Eminent Figures)')}
                                                {req.status === 'rejected' && t('প্রত্যাখ্যাত', 'Rejected')}
                                            </span>
                                        </span>

                                        <span className="text-stone-300">•</span>
                                        <span className="text-stone-500 font-mono text-[11px]">
                                            {new Date(req.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>

                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            isSelfNomination ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-stone-100 text-stone-700 border border-stone-200'
                                        }`}>
                                            {isSelfNomination ? t('নিজের জন্য আবেদন', 'Self Application') : t('অন্যের জন্য মনোনয়ন', 'Nomination for Other')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setDeleteConfirm({ isOpen: true, requestId: req.id })}
                                            className="text-stone-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                            title={t('আবেদন রেকর্ড মুছে ফেলুন', 'Delete Record')}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Main Grid: Left (Candidate + Submitter), Right (Details + Documents + Actions) */}
                                <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                                    
                                    {/* Left Column: Nominated Candidate & Submitter Profiles */}
                                    <div className="lg:col-span-5 flex flex-col gap-2 justify-between">
                                        {/* Candidate Student Card (Clickable) */}
                                        <div 
                                            onClick={() => handleViewMember(req)}
                                            className="group p-2.5 rounded-xl border border-orange-200/90 bg-gradient-to-r from-orange-50/60 via-amber-50/30 to-white hover:border-orange-400 hover:shadow-2xs transition-all cursor-pointer"
                                            title={t('কৃতি শিক্ষার্থীর সম্পূর্ণ প্রোফাইল দেখুন', 'Click to view candidate student profile')}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[9px] uppercase font-black tracking-wider text-orange-900 bg-orange-200/80 px-1.5 py-0.5 rounded">
                                                    {t('কৃতি শিক্ষার্থী (মনোনীত)', 'Candidate Nominee')}
                                                </span>
                                                <span className="text-[10px] font-bold text-orange-800 group-hover:text-orange-950 flex items-center gap-1 group-hover:underline">
                                                    <ExternalLink size={10} />
                                                    <span>{t('প্রোফাইল দেখুন', 'View Profile')}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                <div className="w-11 h-11 rounded-full overflow-hidden bg-white border-2 border-orange-300 shadow-2xs shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                    {req.member_profile_image ? (
                                                        <img src={req.member_profile_image} alt={req.member_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-serif font-bold text-lg text-orange-800">{req.member_name?.charAt(0) || 'S'}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-serif font-bold text-sm text-stone-900 leading-tight truncate group-hover:text-orange-900 transition-colors">
                                                        {formatName({
                                                            full_name: req.member_name,
                                                            name_bangla: req.member_name_bangla,
                                                            name_english: req.member_name_english
                                                        })}
                                                    </h4>
                                                    {req.member_father_name && (
                                                        <p className="text-[11px] text-stone-600 truncate mt-0.5">
                                                            {t('পিতা', 'Father')}: {formatName({ full_name: req.member_father_name, name_bangla: req.member_father_name_bangla, name_english: req.member_father_name_english })}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                                        {req.member_village ? `${t('গ্রাম', 'Village')}: ${req.member_village}` : ''}
                                                        {req.member_level ? ` • Lvl ${req.member_level}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submitter Card (NOW CLICKABLE!) */}
                                        <div 
                                            onClick={() => handleViewApplicant(req)}
                                            className="group p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-amber-50/60 hover:border-amber-300 hover:shadow-2xs transition-all cursor-pointer"
                                            title={t('আবেদনকারীর প্রোফাইল দেখুন', 'Click to view submitter profile')}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[9px] uppercase font-black tracking-wider text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded">
                                                    {t('আবেদনকারী', 'Request Submitter')}
                                                </span>
                                                <span className="text-[10px] font-bold text-stone-600 group-hover:text-orange-900 flex items-center gap-1 group-hover:underline">
                                                    <ExternalLink size={10} />
                                                    <span>{t('প্রোফাইল দেখুন', 'View Profile')}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 border border-orange-200 text-orange-800 font-bold text-xs shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                    {req.applicant_profile_image ? (
                                                        <img src={req.applicant_profile_image} alt={req.applicant_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{(formatName({ full_name: req.applicant_name, name_bangla: req.applicant_member_name_bangla, name_english: req.applicant_member_name_english }) || '?').charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-bold text-xs text-stone-900 truncate group-hover:text-orange-900 transition-colors">
                                                            {formatName({ full_name: req.applicant_name, name_bangla: req.applicant_member_name_bangla, name_english: req.applicant_member_name_english }) || req.applicant_name || t('সদস্য', 'Member')}
                                                        </p>
                                                        <span className="text-[9px] font-semibold text-stone-500 bg-stone-200/70 px-1 rounded shrink-0">
                                                            {req.applicant_role || 'user'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                                        {req.applicant_email && <span>{req.applicant_email}</span>}
                                                        {req.applicant_phone && <span> • {req.applicant_phone}</span>}
                                                    </p>
                                                    {(req.applicant_member_village || req.applicant_member_father_name) && (
                                                        <p className="text-[10px] text-stone-400 truncate mt-0.5">
                                                            {req.applicant_member_village && `${t('গ্রাম', 'Village')}: ${req.applicant_member_village}`}
                                                            {req.applicant_member_father_name && ` • ${t('পিতা', 'Father')}: ${formatName({ full_name: req.applicant_member_father_name, name_bangla: req.applicant_member_father_name_bangla, name_english: req.applicant_member_father_name_english })}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Achievement Details, Documents & Action Buttons */}
                                    <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5">
                                        <div className="space-y-2">
                                            {/* Achievement Badges Row */}
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="bg-orange-800 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
                                                    <GraduationCap size={12} />
                                                    {req.achievement_type}
                                                </span>

                                                {req.result_grade && (
                                                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                                        {req.result_grade}
                                                    </span>
                                                )}

                                                {req.exam_year && (
                                                    <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {t('সাল', 'Year')}: {req.exam_year}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Institution & Subject in a Compact 2-column Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div className="bg-stone-50/80 p-2 rounded-lg border border-stone-200/70">
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 block mb-0.5">
                                                        {t('শিক্ষা প্রতিষ্ঠান / বিশ্ববিদ্যালয়', 'Institution / University')}
                                                    </span>
                                                    <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5 truncate">
                                                        <Building2 size={12} className="text-orange-700 shrink-0" />
                                                        <span className="truncate">{req.institution}</span>
                                                    </p>
                                                </div>

                                                <div className="bg-stone-50/80 p-2 rounded-lg border border-stone-200/70">
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 block mb-0.5">
                                                        {t('বিভাগ / বিষয়', 'Subject / Department')}
                                                    </span>
                                                    <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5 truncate">
                                                        <BookOpen size={12} className="text-orange-700 shrink-0" />
                                                        <span className="truncate">{req.subject_department || '—'}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Optional Remarks */}
                                            {req.description && (
                                                <div className="bg-stone-50/60 p-2 rounded-lg border border-stone-200/50 text-xs text-stone-600 italic line-clamp-2">
                                                    "{req.description}"
                                                </div>
                                            )}

                                            {/* Admin Note if reviewed */}
                                            {req.admin_note && (
                                                <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200 text-xs text-amber-900">
                                                    <span className="font-bold">{t('এডমিন মন্তব্য', 'Admin Note')}:</span> {req.admin_note}
                                                </div>
                                            )}

                                            {/* Attached Documents Row */}
                                            {(() => {
                                                let attachedList = [];
                                                if (Array.isArray(req.documents) && req.documents.length > 0) {
                                                    attachedList = req.documents;
                                                } else if (req.document_url) {
                                                    attachedList = [{
                                                        url: req.document_url,
                                                        type: req.document_type || (req.document_url.toLowerCase().endsWith('.pdf') ? 'document' : 'photo'),
                                                        name: t('প্রমাণপত্র', 'Proof Document')
                                                    }];
                                                }

                                                if (attachedList.length === 0) return null;

                                                return (
                                                    <div className="p-2 bg-stone-50/80 rounded-xl border border-stone-200/80 flex items-center gap-2.5 flex-wrap">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 flex items-center gap-1 shrink-0">
                                                            <FileText size={12} className="text-orange-700" />
                                                            {t('প্রমাণপত্র', 'Docs')} ({attachedList.length}):
                                                        </span>

                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {attachedList.map((doc, idx) => {
                                                                const isPdf = doc.type === 'document' || doc.url?.toLowerCase().endsWith('.pdf');
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            if (isPdf) {
                                                                                window.open(doc.url, '_blank');
                                                                            } else {
                                                                                setDocPreview(doc.url);
                                                                            }
                                                                        }}
                                                                        className="group relative flex flex-col items-center justify-center rounded-lg overflow-hidden border border-stone-200 bg-white hover:border-orange-500 hover:shadow-xs transition-all p-0.5 w-11 h-13 sm:w-12 sm:h-14 cursor-pointer shrink-0"
                                                                        title={doc.name || `Document ${idx + 1}`}
                                                                    >
                                                                        {isPdf ? (
                                                                            <div className="w-full h-full bg-gradient-to-b from-red-50 to-orange-50 rounded flex flex-col items-center justify-between p-1">
                                                                                <span className="bg-red-600 text-white font-black text-[7px] px-1 rounded">PDF</span>
                                                                                <FileText size={15} className="text-red-600 group-hover:scale-110 transition-transform" />
                                                                                <span className="text-[7px] text-stone-600 font-semibold truncate max-w-full">
                                                                                    #{idx + 1}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-full h-full rounded overflow-hidden relative">
                                                                                <img src={doc.url} alt={doc.name || `Doc ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                                <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                                    <Eye size={11} />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Actions Bar */}
                                        {req.status === 'pending' ? (
                                            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => handleOpenAction(req, 'reject')}
                                                    className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                >
                                                    <X size={13} />
                                                    <span>{t('প্রত্যাখ্যান করুন', 'Reject')}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleOpenAction(req, 'approve')}
                                                    className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-2xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Check size={13} />
                                                    <span>{t('অনুমোদন ও তালিকায় যুক্ত করুন', 'Approve & Add to Eminent')}</span>
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Approve / Reject Modal Dialog */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-orange-100 animate-zoom-in font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                                {actionModal.action === 'approve' ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <span>{t('আবেদন অনুমোদন নিশ্চিতকরণ', 'Confirm Request Approval')}</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span>{t('আবেদন প্রত্যাখ্যান নিশ্চিতকরণ', 'Confirm Request Rejection')}</span>
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                                className="text-stone-400 hover:text-stone-600 p-1 rounded-full cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
                            {actionModal.action === 'approve' ? (
                                isBn 
                                    ? `আপনি কি "${formatName(actionModal.request)}"-এর কৃতি শিক্ষার্থী আবেদন অনুমোদন করতে চান? অনুমোদন করলে তিনি অবিলম্বে 'বিশিষ্ট ব্যক্তিবর্গ' পাতায় কৃতি শিক্ষার্থী হিসেবে যুক্ত হবেন এবং তার প্রোফাইলে এই স্বীকৃতি প্রদর্শিত হবে।`
                                    : `Do you want to approve the brilliant student request for "${formatName(actionModal.request)}"? Upon approval, they will be listed under Eminent Figures as a Brilliant Student.`
                            ) : (
                                isBn
                                    ? `আপনি কি "${formatName(actionModal.request)}"-এর আবেদন প্রত্যাখ্যান করতে চান?`
                                    : `Are you sure you want to reject this request for "${formatName(actionModal.request)}"?`
                            )}
                        </p>

                        {/* If approve: allow editing custom title */}
                        {actionModal.action === 'approve' && (
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    {t('স্বীকৃতি শিরোনাম (ট্যাগ / বিবরণী)', 'Recognition Title / Badge Text')}
                                </label>
                                <input
                                    type="text"
                                    value={actionModal.customTitle}
                                    onChange={e => setActionModal(prev => ({ ...prev, customTitle: e.target.value }))}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                                />
                                <span className="text-[11px] text-stone-400 mt-1 block">
                                    {t('প্রোফাইল ও বিশিষ্ট ব্যক্তিবর্গ পাতায় এটি প্রদর্শিত হবে', 'This title will be displayed on their profile and eminent figures page')}
                                </span>
                            </div>
                        )}

                        {/* Admin note */}
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                {t('এডমিনের মন্তব্য / কারণ', 'Admin Feedback Note')}
                            </label>
                            <textarea
                                value={actionModal.adminNote}
                                onChange={e => setActionModal(prev => ({ ...prev, adminNote: e.target.value }))}
                                rows={2}
                                placeholder={actionModal.action === 'approve' ? t('যেমন: তথ্য যাচাই করে অনুমোদন দেওয়া হলো।', 'e.g. Verified and approved.') : t('যেমন: সনদপত্র স্পষ্ট নয়, পুনরায় আবেদন করুন।', 'e.g. Certificate illegible, please reapply.')}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                                disabled={actionModal.submitting}
                                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold cursor-pointer"
                            >
                                {t('বাতিল', 'Cancel')}
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmAction}
                                disabled={actionModal.submitting}
                                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                                    actionModal.action === 'approve'
                                        ? 'bg-emerald-700 hover:bg-emerald-800'
                                        : 'bg-red-700 hover:bg-red-800'
                                }`}
                            >
                                {actionModal.submitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : actionModal.action === 'approve' ? (
                                    <>
                                        <Check size={14} />
                                        <span>{t('অনুমোদন সম্পন্ন করুন', 'Confirm Approval')}</span>
                                    </>
                                ) : (
                                    <>
                                        <X size={14} />
                                        <span>{t('প্রত্যাখ্যান করুন', 'Confirm Rejection')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search-style Profile Modal for full inspection */}
            {selectedMemberId && (
                <Profile
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                />
            )}

            {/* Submitter User Details Modal (if not linked to a tree member) */}
            {submitterModal.isOpen && (
                <div 
                    className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in"
                    onClick={() => setSubmitterModal({ isOpen: false, submitter: null })}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 relative animate-zoom-in font-sans"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSubmitterModal({ isOpen: false, submitter: null })}
                            className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-base border border-orange-200 shrink-0">
                                {submitterModal.submitter?.name?.charAt(0) || <User size={18} />}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-stone-900 text-sm truncate">
                                    {submitterModal.submitter?.name || t('আবেদনকারী', 'Submitter')}
                                </h3>
                                <span className="text-[10px] font-semibold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 inline-block mt-0.5">
                                    {submitterModal.submitter?.role || 'user'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/80 mb-4">
                            {submitterModal.submitter?.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={13} className="text-orange-700 shrink-0" />
                                    <span className="truncate">{submitterModal.submitter.email}</span>
                                </div>
                            )}
                            {submitterModal.submitter?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={13} className="text-orange-700 shrink-0" />
                                    <span>{submitterModal.submitter.phone}</span>
                                </div>
                            )}
                            <div className="text-stone-400 text-[10px] pt-1.5 border-t border-stone-200 flex justify-between items-center">
                                <span>{t('অ্যাকাউন্ট ধরন', 'Account Type')}: {submitterModal.submitter?.role || 'user'}</span>
                                {submitterModal.submitter?.userId && (
                                    <span className="font-mono text-[9px] truncate max-w-[120px]">
                                        ID: {submitterModal.submitter.userId.substring(0, 8)}...
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setSubmitterModal({ isOpen: false, submitter: null })}
                                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                {t('বন্ধ করুন', 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Image Lightbox */}
            {docPreview && (
                <div 
                    className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in"
                    onClick={() => setDocPreview(null)}
                >
                    <div 
                        className="relative max-w-3xl max-h-[88vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl p-2 animate-zoom-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setDocPreview(null)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center cursor-pointer transition-colors shadow-md border border-stone-700"
                        >
                            <X size={18} />
                        </button>
                        <img 
                            src={docPreview} 
                            alt="Document Preview" 
                            className="max-h-[82vh] w-auto mx-auto object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, requestId: null })}
                onConfirm={handleDelete}
                title={t('আবেদন মুছে ফেলা নিশ্চিতকরণ', 'Confirm Request Deletion')}
                message={t('আপনি কি নিশ্চিত যে এই আবেদন রেকর্ডটি মুছে ফেলতে চান?', 'Are you sure you want to delete this request record?')}
                confirmText={t('মুছে ফেলুন', 'Delete')}
                requireCheckbox={false}
            />
        </div>
    );
};

export default BrilliantStudentRequestsAdmin;
