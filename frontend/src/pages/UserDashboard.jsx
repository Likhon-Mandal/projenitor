import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
    ShieldAlert, LogOut, CheckCircle, Mail, Clock, ShieldCheck, 
    ArrowRight, User, Phone, Sparkles, AlertCircle, LayoutDashboard,
    Pencil, MapPin, Home, Briefcase, GraduationCap, Droplet, RefreshCw, Calendar, Key
} from 'lucide-react';
import api from '../api/api';
import MemberForm from '../components/MemberForm';
import BrilliantStudentRequestModal from '../components/BrilliantStudentRequestModal';

const UserDashboard = () => {
    const { user, logout, isAdmin, isSuperAdmin, login, token, refreshProfile } = useAuth();
    const { t, formatName, formatAchievement } = useLanguage();
    
    const [profile, setProfile] = useState(null);
    const [memberData, setMemberData] = useState(null);
    const [loadingMember, setLoadingMember] = useState(false);
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
    
    const [requestEmail, setRequestEmail] = useState('');
    const [adminRequest, setAdminRequest] = useState(null); // { hasRequest, request }
    const [studentRequests, setStudentRequests] = useState([]);
    const [loadingStudentRequests, setLoadingStudentRequests] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState(null); // { type: 'success' | 'error', text }

    // Fetch user profile, admin request status, and brilliant student requests
    const fetchData = async () => {
        setLoadingProfile(true);
        setLoadingStudentRequests(true);
        try {
            const [profileRes, requestRes, studentRes] = await Promise.allSettled([
                api.get('/users/profile'),
                api.get('/users/admin-request-status'),
                api.get('/brilliant-students/my-requests')
            ]);

            if (studentRes.status === 'fulfilled') {
                setStudentRequests(studentRes.value.data || []);
            }

            let activeMemberId = user?.member_id;

            if (profileRes.status === 'fulfilled') {
                const prof = profileRes.value.data;
                setProfile(prof);
                if (prof?.member_id) {
                    activeMemberId = prof.member_id;
                }
                if (prof?.role && prof.role !== user?.role) {
                    refreshProfile?.();
                }
            }
            if (requestRes.status === 'fulfilled') {
                setAdminRequest(requestRes.value.data);
            }

            // Fetch linked member data from main database
            if (activeMemberId) {
                setLoadingMember(true);
                try {
                    const memberRes = await api.get(`/members/${activeMemberId}`);
                    setMemberData(memberRes.data);
                } catch (mErr) {
                    console.error('Error fetching linked member details:', mErr);
                } finally {
                    setLoadingMember(false);
                }
            }
        } catch (err) {
            console.error('Error fetching user dashboard data:', err);
        } finally {
            setLoadingProfile(false);
            setLoadingStudentRequests(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.member_id]);

    // Handle Member Save from MemberForm
    const handleMemberSaved = async () => {
        setIsMemberFormOpen(false);
        setFeedbackMessage({
            type: 'success',
            text: t(
                'আপনার প্রোফাইল ও মূল ডেটাবেজের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!',
                'Your profile and main database records have been successfully updated!'
            )
        });

        const activeMemberId = memberData?.id || profile?.member_id || user?.member_id;
        if (activeMemberId) {
            try {
                const memRes = await api.get(`/members/${activeMemberId}`);
                setMemberData(memRes.data);
            } catch (err) {
                console.error('Failed to re-fetch member details:', err);
            }
        }

        // Re-fetch profile & refresh AuthContext so navigation icons/names update immediately
        try {
            const [profRes, meRes] = await Promise.allSettled([
                api.get('/users/profile'),
                api.get('/auth/me')
            ]);

            if (profRes.status === 'fulfilled') {
                setProfile(profRes.value.data);
            }

            if (meRes.status === 'fulfilled' && meRes.value.data?.user) {
                const updatedUser = { ...(user || {}), ...meRes.value.data.user };
                if (token) {
                    login(token, updatedUser);
                }
            }
        } catch (e) {
            console.error('Error syncing auth state after member update:', e);
        }

        setTimeout(() => setFeedbackMessage(null), 5000);
    };

    // Determine effective user email
    const registeredEmail = memberData?.email || profile?.email || user?.email || '';
    const hasRegisteredEmail = Boolean(registeredEmail && registeredEmail.trim().length > 0);

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handlePreSubmit = (e) => {
        e.preventDefault();
        const emailToSend = hasRegisteredEmail ? registeredEmail : requestEmail.trim();

        if (!emailToSend) {
            setFeedbackMessage({
                type: 'error',
                text: t('অনুগ্রহ করে একটি সঠিক ইমেইল প্রদান করুন।', 'Please enter a valid email address.')
            });
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        setShowConfirmModal(false);
        const emailToSend = hasRegisteredEmail ? registeredEmail : requestEmail.trim();

        if (!emailToSend) {
            setFeedbackMessage({
                type: 'error',
                text: t('অনুগ্রহ করে একটি সঠিক ইমেইল প্রদান করুন।', 'Please enter a valid email address.')
            });
            return;
        }

        setSubmitting(true);
        setFeedbackMessage(null);
        try {
            const res = await api.post('/users/request-admin', { email: emailToSend });
            
            // If email was updated, update user state
            if (!hasRegisteredEmail && res.data.email) {
                const updatedUser = { ...(user || {}), email: res.data.email };
                if (token) {
                    login(token, updatedUser);
                }
                if (profile) {
                    setProfile({ ...profile, email: res.data.email });
                }
            }

            setFeedbackMessage({
                type: 'success',
                text: t(
                    'আপনার এডমিন পদের আবেদনটি সফলভাবে সুপারএডমিনের কাছে পাঠানো হয়েছে!',
                    'Your application for the Admin role has been successfully submitted to the SuperAdmin!'
                )
            });

            // Refresh status
            setAdminRequest({
                hasRequest: true,
                request: {
                    email: emailToSend,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }
            });
            setRequestEmail('');
        } catch (err) {
            console.error('Request admin error:', err);
            setFeedbackMessage({
                type: 'error',
                text: err.response?.data?.error || t('এডমিন পদের আবেদন পাঠাতে সমস্যা হয়েছে।', 'Failed to send admin request.')
            });
        } finally {
            setSubmitting(false);
        }
    };

    const displayName = formatName(memberData || profile || user) || t('সম্মানিত সদস্য', 'Honorable Member');
    const displayPhoto = memberData?.profile_image_url || profile?.profile_image_url || user?.profile_image_url;
    const displayPhone = memberData?.contact_number || profile?.mobile_number || user?.mobile_number;
    const activeMemberId = memberData?.id || profile?.member_id || user?.member_id;

    return (
        <div className="min-h-[85vh] bg-orange-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ea580c 1px, transparent 0)', backgroundSize: '28px 28px' }}></div>

            <div className="max-w-3xl w-full relative z-10 space-y-6">
                
                {/* ─── Top Header Card ────────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-orange-200/80 transition-all hover:shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                        {/* Profile Image & Basic Info */}
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <div className="relative">
                                {displayPhoto ? (
                                    <img
                                        src={displayPhoto}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 shadow-md ring-2 ring-orange-200"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-orange-700 flex items-center justify-center text-orange-950 font-black text-3xl font-serif shadow-md border-4 border-yellow-400">
                                        {(displayName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs" title={t('ভেরিফাইড সদস্য', 'Verified Member')}>
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200 mb-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                                    <span>{t('সদস্য পোর্টাল', 'Member Portal')}</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 truncate">
                                    {displayName}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-2 text-xs text-stone-600 font-medium">
                                    {displayPhone && (
                                        <div className="flex flex-wrap items-center gap-1.5 font-mono">
                                            <span className="flex items-center gap-1 text-orange-700 mr-0.5">
                                                <Phone className="w-3.5 h-3.5" />
                                            </span>
                                            {String(displayPhone).split(/[,;\/\n\r]+/).map((num, i) => {
                                                const cleanNum = num.trim();
                                                if (!cleanNum) return null;
                                                return (
                                                    <a key={i} href={`tel:${cleanNum}`} className="bg-orange-50 hover:bg-orange-100 hover:text-orange-950 px-2 py-0.5 rounded-lg border border-orange-200/70 transition">
                                                        {cleanNum}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {registeredEmail && (
                                        <span className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 font-mono">
                                            <Mail className="w-3.5 h-3.5 text-orange-700" />
                                            {registeredEmail}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Header Action Buttons: Edit Profile & Change Password */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 shrink-0">
                            {activeMemberId && (
                                <button
                                    onClick={() => setIsMemberFormOpen(true)}
                                    className="inline-flex items-center gap-2 bg-orange-800 hover:bg-orange-900 text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                                    title={t('প্রোফাইল সম্পাদনা', 'Edit Profile')}
                                >
                                    <Pencil className="w-4 h-4 text-yellow-400" />
                                    <span>{t('প্রোফাইল সম্পাদনা', 'Edit Profile')}</span>
                                </button>
                            )}
                            <Link
                                to="/change-password"
                                className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 text-stone-700 hover:text-orange-950 border border-stone-200 hover:border-orange-300 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                                title={t('পাসওয়ার্ড পরিবর্তন', 'Change Password')}
                            >
                                <Key className="w-4 h-4 text-orange-700" />
                                <span>{t('পাসওয়ার্ড পরিবর্তন', 'Change Password')}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ─── Feedback Message (Success / Error) ─────────────────── */}
                {feedbackMessage && (
                    <div className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium border flex items-start sm:items-center gap-3 shadow-md animate-fade-in w-full max-w-full overflow-hidden ${
                        feedbackMessage.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                            : 'bg-red-50 text-red-900 border-red-300'
                    }`}>
                        {feedbackMessage.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
                        )}
                        <span className="flex-1 min-w-0 break-words leading-relaxed">{feedbackMessage.text}</span>
                    </div>
                )}

                {/* ─── Main Database Linked Profile Details Card ───────────── */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-orange-100 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-serif font-black text-stone-900">
                                    {t('মূল ডেটাবেজের সদস্য বিবরণ', 'Linked Member Profile Details')}
                                </h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    {t('সংযুক্ত ও সিঙ্কড', 'Synced')}
                                </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                                {t('বংশতালিকায় সংরক্ষিত আপনার পারিবারিক, ঠিকানা ও ব্যক্তিগত তথ্যাবলী', 'Your ancestral lineage records, family members and personal details')}
                            </p>
                        </div>

                        {activeMemberId && (
                            <button
                                onClick={() => setIsMemberFormOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-900 bg-orange-100 hover:bg-orange-200 border border-orange-200 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                            >
                                <Pencil className="w-3.5 h-3.5 text-orange-700" />
                                <span>{t('তথ্য সংশোধন করুন', 'Update Record')}</span>
                            </button>
                        )}
                    </div>

                    {loadingMember ? (
                        <div className="p-10 text-center bg-orange-50/50 rounded-2xl border border-orange-100">
                            <RefreshCw className="w-7 h-7 animate-spin text-orange-800 mx-auto mb-2" />
                            <span className="text-xs text-stone-500 font-medium">{t('মূল ডেটাবেজ থেকে তথ্য লোড হচ্ছে...', 'Loading member records from database...')}</span>
                        </div>
                    ) : memberData ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { label: t('পিতা', 'Father'), value: memberData?.father_name || memberData?.father_name_bangla, icon: User },
                                { label: t('মাতা', 'Mother'), value: memberData?.mother_name || memberData?.mother_name_bangla, icon: User },
                                { label: t('গ্রাম', 'Village'), value: memberData?.village, icon: MapPin },
                                { label: t('বাড়ি', 'Home'), value: memberData?.home_name, icon: Home },
                                { label: t('রক্তের গ্রুপ', 'Blood Group'), value: memberData?.blood_group, icon: Droplet },
                                { label: t('পেশা', 'Occupation'), value: memberData?.occupation, icon: Briefcase },
                                { label: t('কর্মস্থল', 'Workplace'), value: memberData?.workplace, icon: Briefcase },
                                { label: t('শিক্ষাগত যোগ্যতা', 'Education'), value: memberData?.education, icon: GraduationCap },
                                { label: t('বর্তমান ঠিকানা', 'Present Address'), value: memberData?.present_address, icon: MapPin },
                                { label: t('স্থায়ী ঠিকানা', 'Permanent Address'), value: memberData?.permanent_address, icon: MapPin },
                                { label: t('বংশধারা পর্যায়', 'Generation Level'), value: memberData?.level ? `${t('ধাপ', 'Level')} ${memberData.level}` : null, icon: Sparkles },
                                { label: t('জন্ম তারিখ', 'Birth Date'), value: memberData?.birth_date ? new Date(memberData.birth_date).toLocaleDateString() : null, icon: Calendar },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-stone-50 hover:bg-orange-50/70 p-3.5 rounded-2xl border border-stone-200/60 transition-colors">
                                    <div className="flex items-center gap-1.5 text-stone-400 mb-1">
                                        <item.icon className="w-3.5 h-3.5 text-orange-800 shrink-0" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                                    </div>
                                    <p className="text-xs font-bold text-stone-800 truncate" title={item.value || '—'}>
                                        {item.value || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                            {t('কোনো সদস্য তথ্য পাওয়া যায়নি।', 'No member profile record linked yet.')}
                        </div>
                    )}

                    {/* Quick Link to Lineage Tree */}
                    {activeMemberId && (
                        <div className="pt-2">
                            <Link
                                to={`/member/${activeMemberId}`}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/70 hover:bg-orange-100/90 text-orange-900 border border-orange-200/80 transition-all font-bold text-xs sm:text-sm group"
                            >
                                <span className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-orange-800" />
                                    <span>{t('বংশলতিকায় আমার সম্পূর্ণ পারিবারিক প্রোফাইল দেখুন', 'Explore Full Family Profile in Lineage Tree')}</span>
                                </span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* ─── Brilliant Student Recognition Section ──────────────────── */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-200 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-orange-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 text-orange-800 rounded-2xl shrink-0">
                                <GraduationCap className="w-6 h-6 text-orange-800" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
                                        {t('কৃতি শিক্ষার্থী সম্মাননা আবেদন', 'Brilliant Student Recognition Requests')}
                                    </h3>
                                    {studentRequests.length > 0 && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                            {studentRequests.length}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-stone-500">
                                    {t('নিজের বা পরিবারের যেকোনো সদস্যের জন্য কৃতি শিক্ষার্থী স্বীকৃতির আবেদন ও বর্তমান অবস্থা', 'Nominate academic achievers and track recognition status')}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsStudentModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-orange-800 hover:bg-orange-900 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                            <GraduationCap size={16} className="text-yellow-400" />
                            <span>{t('+ নতুন আবেদন করুন', '+ Submit New Application')}</span>
                        </button>
                    </div>

                    {/* Applications List */}
                    {loadingStudentRequests ? (
                        <div className="p-6 text-center text-xs text-stone-400 animate-pulse">
                            {t('আবেদনসমূহ লোড হচ্ছে...', 'Loading applications...')}
                        </div>
                    ) : studentRequests.length > 0 ? (
                        <div className="space-y-3 max-h-[420px] sm:max-h-[440px] overflow-y-auto pr-1 sm:pr-1.5 custom-scrollbar">
                            {studentRequests.map(req => (
                                <div key={req.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 hover:bg-orange-50/40 hover:border-orange-300 transition-all duration-200">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif font-bold text-sm text-stone-900">
                                                {formatName({
                                                    full_name: req.member_name,
                                                    name_bangla: req.member_name_bangla,
                                                    name_english: req.member_name_english
                                                })}
                                            </span>
                                            <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                                {formatAchievement(req.achievement_type)}
                                            </span>
                                        </div>
                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                            'bg-amber-100 text-amber-800 border border-amber-200'
                                        }`}>
                                            {req.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                            {req.status === 'pending' && <Clock className="w-3 h-3" />}
                                            {req.status === 'approved' && t('অনুমোদিত (বিশিষ্ট ব্যক্তিত্বে অন্তর্ভুক্ত)', 'Approved (In Eminent Figures)')}
                                            {req.status === 'pending' && t('পর্যালোচনাধীন', 'Under Review')}
                                            {req.status === 'rejected' && t('প্রত্যাখ্যাত', 'Rejected')}
                                        </span>
                                    </div>

                                    <div className="text-xs text-stone-600 space-y-1">
                                        <p><span className="text-stone-400">{t('প্রতিষ্ঠান:', 'Institution:')}</span> {req.institution} {req.exam_year ? `(${req.exam_year})` : ''}</p>
                                        {req.subject_department && <p><span className="text-stone-400">{t('বিষয় / বিভাগ:', 'Subject / Dept:')}</span> {req.subject_department}</p>}
                                        {req.result_grade && <p><span className="text-stone-400">{t('ফলাফল:', 'Result:')}</span> {req.result_grade}</p>}
                                        {req.admin_note && (
                                            <div className="mt-2 p-2 bg-amber-50 rounded-xl text-amber-900 border border-amber-200 text-xs">
                                                <span className="font-bold">{t('এডমিন মতামত:', 'Admin Note:')}</span> {req.admin_note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/40">
                            <p className="text-xs sm:text-sm text-stone-600 mb-2">
                                {t(
                                    'আপনি এখনো কোনো কৃতি শিক্ষার্থীর স্বীকৃতির আবেদন করেননি।',
                                    'You have not submitted any brilliant student recognition applications yet.'
                                )}
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsStudentModalOpen(true)}
                                className="text-xs font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                            >
                                {t('নিজের জন্য বা পরিবারের অন্য কারো জন্য এখনই আবেদন করুন →', 'Apply now for yourself or another family member →')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── Admin Role Application Section ────────────────────── */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-200 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-orange-100 text-orange-800 rounded-2xl shrink-0">
                            <ShieldAlert className="w-6 h-6 text-orange-700" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
                                {t('এডমিন পদের জন্য আবেদন', 'Request for Admin Role')}
                            </h3>
                            <p className="text-xs text-stone-500">
                                {t('বংশতালিকার তথ্য সংযোজন ও সম্পাদনার সুযোগ', 'Permission to contribute & update ancestral records')}
                            </p>
                        </div>
                    </div>

                    {/* Case 1: User is already an admin or superadmin */}
                    {(isAdmin || profile?.role === 'admin' || profile?.role === 'superadmin') ? (
                        <div className="mt-4 p-5 bg-yellow-50/80 border border-yellow-300 rounded-2xl text-center">
                            <Sparkles className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <h4 className="font-bold text-stone-800 text-base">
                                {t('আপনি ইতিমধ্যে একজন এডমিন!', 'You are already an Admin!')}
                            </h4>
                            <p className="text-xs text-stone-600 mt-1 mb-4">
                                {t('আপনার কাছে তথ্য ব্যবস্থাপনা ও ড্যাশবোর্ডে প্রবেশাধিকার রয়েছে।', 'You have full access to manage records and access the dashboard.')}
                            </p>
                            <Link
                                to={isSuperAdmin ? '/dashboard/superadmin' : '/dashboard/admin'}
                                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-orange-950 font-black text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>{t('এডমিন ড্যাশবোর্ডে যান', 'Go to Admin Dashboard')}</span>
                            </Link>
                        </div>
                    ) : adminRequest?.hasRequest && adminRequest.request?.status === 'pending' ? (
                        /* Case 2: Request is already pending review */
                        <div className="mt-4 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl w-full max-w-full overflow-hidden">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-bold text-amber-950 text-sm sm:text-base">
                                            {t('আবেদন পর্যালোচনায় রয়েছে', 'Application Under Review')}
                                        </h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                                            {t('বিবেচনাধীন', 'Pending')}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-stone-700 mt-1 leading-relaxed break-words">
                                        {t(
                                            'আপনার এডমিন পদের আবেদনটি বর্তমানে সুপারএডমিনের অনুমোদনের অপেক্ষায় রয়েছে। সুপারএডমিন আপনার প্রোফাইল ও তথ্যাদি যাচাই করে অনুমোদন করবেন।',
                                            'Your admin role application is currently awaiting SuperAdmin approval. The SuperAdmin will verify your profile and grant access.'
                                        )}
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-amber-800 font-medium">
                                        <Mail className="w-3.5 h-3.5 shrink-0" />
                                        <span className="shrink-0">{t('আবেদনে প্রদত্ত ইমেইল:', 'Submitted Email:')}</span>
                                        <span className="font-bold text-amber-950 break-all">{adminRequest.request.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Case 3: Can submit a new request */
                        <div className="mt-4 space-y-4">
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                                {t(
                                    'বংশতালিকায় নতুন সদস্য, পরিবার, বিশিষ্ট ব্যক্তি বা বিজ্ঞপ্তি যুক্ত করতে আপনি এডমিন পদের জন্য আবেদন পাঠাতে পারেন। আবেদনটি সরাসরি সুপারএডমিনের কাছে যাবে।',
                                    'To add or edit lineage records, family members, or notices, you can submit an application for an Admin role. Your application will be sent directly to the SuperAdmin.'
                                )}
                            </p>

                            <form onSubmit={handlePreSubmit} className="space-y-4 pt-1">
                                {hasRegisteredEmail ? (
                                    /* ── User ALREADY gave email earlier: NO re-entering! ── */
                                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl w-full max-w-full overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-800 shrink-0">
                                                    <Mail className="w-5 h-5 text-orange-700" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                                                        {t('নিবন্ধিত ইমেইল (স্বয়ংক্রিয়ভাবে সংগৃহীত)', 'Registered Email (Auto-fetched)')}
                                                    </p>
                                                    <p className="font-bold text-stone-900 text-sm sm:text-base break-all">
                                                        {registeredEmail}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="self-start sm:self-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                <span>{t('ভেরিফাইড', 'Verified')}</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                                            {t(
                                                'নতুন করে ইমেইল দেওয়ার প্রয়োজন নেই। এই ইমেইলটি সুপারএডমিনের কাছে আপনার আবেদনের সাথে পাঠানো হবে।',
                                                'No need to enter your email again. This email will be automatically sent to the SuperAdmin with your application.'
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    /* ── User did NOT give email earlier: REQUIRED input! ── */
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                            {t('ইমেইল অ্যাড্রেস * (বাধ্যতামূলক)', 'Email Address * (Required)')}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={requestEmail}
                                                onChange={(e) => setRequestEmail(e.target.value)}
                                                className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 text-sm focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all bg-orange-50/30"
                                                placeholder="yourname@gmail.com"
                                            />
                                        </div>
                                        <p className="text-[11px] text-stone-500 mt-1">
                                            {t(
                                                'এডমিন পদের জন্য আপনার সাথে যোগাযোগের একটি কার্যকর ইমেইল প্রদান করা আবশ্যক।',
                                                'A valid contact email is required to process and approve your admin role request.'
                                            )}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-800 hover:bg-orange-900 text-white py-3 px-4 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            <ShieldAlert className="w-4 h-4 text-yellow-400" />
                                            <span>
                                                {hasRegisteredEmail 
                                                    ? t('এডমিন পদের জন্য আবেদন পাঠান', 'Submit Admin Role Request')
                                                    : t('ইমেইল প্রদান করে আবেদন জমা দিন', 'Submit Request with Email')}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-yellow-400" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ─── Bottom Sign Out Button ─────────────────────────────── */}
                <div className="pt-2">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 text-red-700 font-bold bg-white border border-red-200 py-3 rounded-2xl hover:bg-red-50 transition-colors shadow-xs cursor-pointer active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{t('অ্যাকাউন্ট থেকে লগআউট করুন', 'Sign Out from Account')}</span>
                    </button>
                </div>
            </div>

            {/* ─── Member Form Modal ────────────────────────────────────── */}
            {activeMemberId && (
                <MemberForm
                    isOpen={isMemberFormOpen}
                    onClose={() => setIsMemberFormOpen(false)}
                    initialData={memberData || { id: activeMemberId }}
                    onSuccess={handleMemberSaved}
                />
            )}

            {/* ─── Brilliant Student Request Modal ───────────────────────── */}
            <BrilliantStudentRequestModal
                isOpen={isStudentModalOpen}
                onClose={() => setIsStudentModalOpen(false)}
                onSuccess={() => fetchData()}
                initialMember={memberData}
            />

            {/* ─── Admin Request Confirmation Modal ──────────────────────── */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center border border-orange-100 animate-zoom-in">
                        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 border border-orange-200">
                            <ShieldAlert className="w-7 h-7 text-orange-800" />
                        </div>
                        <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                            {t('এডমিন পদের আবেদন নিশ্চিতকরণ', 'Confirm Admin Application')}
                        </h3>
                        <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                            {t(
                                'আপনি কি নিশ্চিত যে আপনি এডমিন পদের জন্য আবেদন পাঠাতে চান? আপনার আবেদনটি যাচাই ও অনুমোদনের জন্য সরাসরি সুপারএডমিনের কাছে পাঠানো হবে।',
                                'Are you sure you want to apply for the Admin role? Your request will be sent directly to the SuperAdmin for review and approval.'
                            )}
                        </p>
                        <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3 mb-6 text-left flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-orange-700 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                                    {t('আবেদনের সাথে প্রেরিত ইমেইল', 'Email sent with application')}
                                </span>
                                <span className="text-xs sm:text-sm font-mono font-bold text-stone-800 break-all">
                                    {hasRegisteredEmail ? registeredEmail : requestEmail.trim()}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={submitting}
                                className="flex-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                            >
                                {t('বাতিল', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSubmit}
                                disabled={submitting}
                                className="flex-1 bg-orange-800 hover:bg-orange-900 text-white rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {submitting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                    <span>{t('হ্যাঁ, আবেদন পাঠান', 'Yes, Submit Request')}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
