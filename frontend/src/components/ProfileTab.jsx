import React, { useState, useEffect } from 'react';
import {
    User, Mail, Shield, Key, Camera, AlertCircle,
    CheckCircle, RefreshCw, LogOut, Pencil, ChevronRight, X,
    MapPin, Home, Briefcase, GraduationCap, Phone, Droplet, Calendar, Sparkles
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import LogoutModal from './LogoutModal';
import MemberForm from './MemberForm';

const ProfileTab = () => {
    const { user, login, token, logout } = useAuth();
    const { t, formatName } = useLanguage();
    const navigate = useNavigate();
    
    const [view, setView] = useState('profile'); // 'profile' | 'password'
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
    const [memberData, setMemberData] = useState(null);
    const [loadingMember, setLoadingMember] = useState(false);

    const [passForm, setPassForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchMemberData = async () => {
        let memberId = user?.member_id;
        if (!memberId) {
            try {
                const meRes = await api.get('/auth/me');
                if (meRes.data?.user?.member_id) {
                    memberId = meRes.data.user.member_id;
                    const updated = { ...user, ...meRes.data.user };
                    if (token) login(token, updated);
                }
            } catch (e) {
                console.error('Error resolving admin member ID:', e);
            }
        }
        if (!memberId) return;

        setLoadingMember(true);
        try {
            const res = await api.get(`/members/${memberId}`);
            setMemberData(res.data);
        } catch (err) {
            console.error('Error fetching member details for profile tab:', err);
        } finally {
            setLoadingMember(false);
        }
    };

    useEffect(() => {
        fetchMemberData();
    }, [user?.member_id]);

    const handleMemberSaved = async () => {
        setIsMemberFormOpen(false);
        setSuccess(t('সফলভাবে সদস্য প্রোফাইল আপডেট করা হয়েছে!', 'Member profile updated successfully!'));
        await fetchMemberData();
        try {
            const meRes = await api.get('/auth/me');
            if (meRes.data?.user) {
                const updated = { ...user, ...meRes.data.user };
                if (token) login(token, updated);
            }
        } catch (e) {
            console.error('Failed to sync auth user:', e);
        }
        setTimeout(() => setSuccess(''), 3000);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/change-password', {
                oldPassword: passForm.oldPassword,
                newPassword: passForm.newPassword,
            });
            setSuccess('Password changed successfully!');
            setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => { setSuccess(''); setView('profile'); }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmLogout = () => {
        logout();
        setLogoutModalOpen(false);
        navigate('/');
    };

    const displayPhoto = memberData?.profile_image_url || user?.profile_image_url;
    const displayName = formatName(memberData || user);
    const displayPhone = memberData?.contact_number || user?.mobile_number;
    const displayEmail = memberData?.email || user?.email;

    return (
        <div className="max-w-3xl mx-auto animate-slide-up space-y-6">
            {/* Success Toast */}
            {success && (
                <div className="fixed top-24 right-8 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-bounce">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">{success}</span>
                </div>
            )}

            {/* Profile Overview Card */}
            <div className="bg-white rounded-3xl border border-orange-100 shadow-xl overflow-hidden relative">
                {/* Visual Header Decoration */}
                <div className="h-28 bg-gradient-to-r from-orange-800 via-orange-900 to-red-950 relative">
                    <div className="absolute top-3 right-4 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/30 text-yellow-300 backdrop-blur-sm border border-yellow-400/30">
                            <Sparkles className="w-3 h-3 text-yellow-400" />
                            {user?.role === 'superadmin' ? t('সুপারএডমিন', 'Super Admin') : t('এডমিন', 'Admin')}
                        </span>
                    </div>
                </div>

                <div className="px-6 sm:px-8 pb-8">
                    {/* Avatar & User Info Row */}
                    <div className="relative mb-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                            {/* Avatar (only the avatar overlaps the dark banner) */}
                            <div className="-mt-14 sm:-mt-16 w-28 h-28 rounded-3xl border-4 border-white overflow-hidden bg-orange-100 shadow-xl ring-2 ring-orange-200/80 flex items-center justify-center shrink-0">
                                {displayPhoto ? (
                                    <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-800 text-white font-serif font-black text-3xl">
                                        {(displayName || 'A').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Name & Contact Info - Clean, crisp, completely on the white card */}
                            <div className="pt-2 sm:pt-4">
                                <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight">
                                    {displayName}
                                </h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-2 text-xs text-stone-600 font-medium">
                                    {displayPhone && (
                                        <div className="flex flex-wrap items-center gap-1.5 font-mono">
                                            <Phone className="w-3.5 h-3.5 text-orange-700 shrink-0 mr-0.5" />
                                            {String(displayPhone).split(/[,;\/\n\r]+/).map((num, i) => {
                                                const cleanNum = num.trim();
                                                if (!cleanNum) return null;
                                                return (
                                                    <a key={i} href={`tel:${cleanNum}`} className="hover:text-orange-950 hover:bg-orange-100 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/70 transition">
                                                        {cleanNum}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {displayEmail && (
                                        <span className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 font-mono">
                                            <Mail className="w-3.5 h-3.5 text-orange-700" />
                                            {displayEmail}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Edit Profile Button */}
                        <div className="pt-2 sm:pt-4">
                            <button
                                onClick={() => setIsMemberFormOpen(true)}
                                className="inline-flex items-center gap-2 bg-orange-800 hover:bg-orange-900 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
                                title={t('প্রোফাইল সম্পাদনা', 'Edit Profile')}
                            >
                                <Pencil className="w-4 h-4 text-yellow-400" />
                                <span>{t('প্রোফাইল সম্পাদনা', 'Edit Profile')}</span>
                            </button>
                        </div>
                    </div>

                    {/* ─── Main Database Linked Profile Details ─────────────── */}
                    <div className="mt-6 border-t border-orange-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-serif font-bold text-stone-800 flex items-center gap-2">
                                    <span>{t('মূল ডেটাবেজের সদস্য বিবরণ', 'Linked Member Profile Details')}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                                        {t('সিঙ্কড', 'Synced')}
                                    </span>
                                </h3>
                                <p className="text-xs text-stone-500">
                                    {t('বংশতালিকায় সংরক্ষিত আপনার পারিবারিক ও ব্যক্তিগত তথ্য', 'Your ancestral and personal records from the main database')}
                                </p>
                            </div>
                        </div>

                        {loadingMember ? (
                            <div className="p-8 text-center bg-orange-50/50 rounded-2xl">
                                <RefreshCw className="w-6 h-6 animate-spin text-orange-800 mx-auto mb-2" />
                                <span className="text-xs text-stone-500">{t('তথ্য লোড হচ্ছে...', 'Loading details...')}</span>
                            </div>
                        ) : (
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
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-stone-50 hover:bg-orange-50/60 p-3 rounded-2xl border border-stone-100 transition-colors">
                                        <div className="flex items-center gap-2 text-stone-400 mb-1">
                                            <item.icon className="w-3.5 h-3.5 text-orange-800" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                                        </div>
                                        <p className="text-xs font-bold text-stone-800 truncate" title={item.value || '—'}>
                                            {item.value || '—'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action List */}
                    <div className="mt-6 border-t border-orange-100 pt-6 space-y-3">
                        <button
                            onClick={() => setIsMemberFormOpen(true)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50/80 hover:bg-orange-100 transition-all group text-left cursor-pointer border border-orange-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs text-orange-800 group-hover:scale-110 transition-transform">
                                    <Pencil className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-stone-800 text-sm">{t('মূল সদস্য প্রোফাইল সম্পাদনা', 'Edit Member Profile')}</p>
                                    <p className="text-xs text-stone-500">{t('পারিবারিক ও ব্যক্তিগত সকল তথ্য হালনাগাদ করুন', 'Update all ancestral and personal database records')}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => { setView('password'); setError(''); }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50/80 hover:bg-orange-100 transition-all group text-left cursor-pointer border border-orange-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs text-red-800 group-hover:scale-110 transition-transform">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-stone-800 text-sm">{t('নিরাপত্তা', 'Security')}</p>
                                    <p className="text-xs text-stone-500">{t('পাসওয়ার্ড পরিবর্তন করুন', 'Update your account password')}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="h-px bg-orange-100 my-4" />

                        <button
                            onClick={() => setLogoutModalOpen(true)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-all group text-left border border-red-100 cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs text-red-600 group-hover:scale-110 transition-transform">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-red-600 text-sm">{t('লগ আউট', 'Sign Out')}</p>
                                    <p className="text-xs text-red-400">{t('অ্যাডমিন সেশন সমাপ্ত করুন', 'Exit your session')}</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Member Edit Form Modal */}
            <MemberForm
                isOpen={isMemberFormOpen}
                onClose={() => setIsMemberFormOpen(false)}
                initialData={memberData || { id: user?.member_id }}
                onSuccess={handleMemberSaved}
            />

            {/* Modal Overlay for Password */}
            {view === 'password' && (
                <div className="fixed inset-0 bg-orange-950/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
                        <div className="bg-orange-800 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-serif font-bold text-lg">
                                {t('পাসওয়ার্ড পরিবর্তন', 'Change Password')}
                            </h3>
                            <button
                                onClick={() => setView('profile')}
                                className="text-orange-200 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                    <AlertCircle className="w-4 h-4" /><span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5 ml-1">{t('বর্তমান পাসওয়ার্ড', 'Current Password')}</label>
                                    <input
                                        type="password"
                                        value={passForm.oldPassword}
                                        onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                                        className="w-full border-2 border-orange-100 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5 ml-1">{t('নতুন পাসওয়ার্ড', 'New Password')}</label>
                                    <input
                                        type="password"
                                        value={passForm.newPassword}
                                        onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                        className="w-full border-2 border-orange-100 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none transition-colors"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5 ml-1">{t('নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm New Password')}</label>
                                    <input
                                        type="password"
                                        value={passForm.confirmPassword}
                                        onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                                        className="w-full border-2 border-orange-100 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none transition-colors"
                                        required
                                    />
                                </div>
                                <button
                                    disabled={loading}
                                    className="w-full bg-red-800 hover:bg-red-900 text-white font-black py-3.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : t('পাসওয়ার্ড সংরক্ষণ করুন', 'Save New Password')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation */}
            <LogoutModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={handleConfirmLogout}
            />
        </div>
    );
};

export default ProfileTab;
