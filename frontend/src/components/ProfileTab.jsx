import React, { useState } from 'react';
import {
    User, Mail, Shield, Key, Camera, AlertCircle,
    CheckCircle, RefreshCw, LogOut, Pencil, ChevronRight, X
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import LogoutModal from './LogoutModal';

const ProfileTab = () => {
    const { user, setUser, logout } = useAuth();
    const { t, isBn, formatName } = useLanguage();
    const navigate = useNavigate();
    const [view, setView] = useState('profile'); // 'profile', 'edit', 'password'
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    const [form, setForm] = useState({
        name: user?.name || '',
        name_bangla: user?.name_bangla || '',
        name_english: user?.name_english || '',
        profile_image_url: user?.profile_image_url || '',
    });

    React.useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                name_bangla: user.name_bangla || '',
                name_english: user.name_english || '',
                profile_image_url: user.profile_image_url || '',
            });
        }
    }, [user]);
    const [passForm, setPassForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!form.name_bangla?.trim() && !form.name_english?.trim() && !form.name?.trim()) {
            setError('Please provide at least one name (Bangla or English)');
            setLoading(false);
            return;
        }

        const bName = form.name_bangla?.trim() || '';
        const eName = form.name_english?.trim() || '';
        const effectiveName = bName && eName ? `${bName} (${eName})` : (bName || eName || form.name?.trim() || '');

        const payload = {
            ...form,
            name: effectiveName,
            name_bangla: bName,
            name_english: eName
        };

        try {
            const res = await api.put('/auth/update-profile', payload);
            const updatedUser = { ...user, ...res.data.user };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSuccess('Profile updated successfully!');
            setTimeout(() => { setSuccess(''); setView('profile'); }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setForm({ ...form, profile_image_url: res.data.filePath });
            setSuccess('Photo uploaded! Don\'t forget to save changes.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload photo');
        } finally {
            setUploading(false);
        }
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

    return (
        <div className="max-w-2xl mx-auto animate-slide-up">
            {/* Success Toast */}
            {success && (
                <div className="fixed top-24 right-8 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">{success}</span>
                </div>
            )}

            {/* Profile Overview Card */}
            <div className="bg-white rounded-3xl border border-orange-100 shadow-xl overflow-hidden relative">
                {/* Visual Header Decoration */}
                <div className="h-24 bg-gradient-to-r from-orange-800 to-red-900" />

                <div className="px-8 pb-8">
                    {/* Avatar Section */}
                    <div className="relative -mt-12 mb-6 flex justify-center">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
                            <div className="w-28 h-28 rounded-3xl border-4 border-white overflow-hidden bg-orange-50 shadow-lg ring-1 ring-orange-100 flex items-center justify-center">
                                {uploading ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/80 animate-pulse">
                                        <RefreshCw className="w-8 h-8 text-orange-800 animate-spin mb-1" />
                                        <span className="text-[10px] font-black text-orange-800">UPLOADING</span>
                                    </div>
                                ) : form.profile_image_url ? (
                                    <img src={form.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-orange-100">
                                        <User className="w-12 h-12 text-orange-800 opacity-20" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                            <input
                                id="avatar-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-serif font-black text-stone-800">
                            {formatName(user)}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${user?.role === 'superadmin' ? 'bg-yellow-500 text-orange-950' : 'bg-orange-800 text-white'}`}>
                                {user?.role}
                            </span>
                            <span className="text-stone-400 text-sm">{user?.email}</span>
                        </div>
                    </div>

                    {/* Action List */}
                    <div className="space-y-3">
                        <button
                            onClick={() => { setView('edit'); setError(''); }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 transition-all group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-orange-800 group-hover:scale-110 transition-transform">
                                    <Pencil className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-stone-800 text-sm">{t('প্রোফাইল সম্পাদনা', 'Edit Profile')}</p>
                                    <p className="text-xs text-stone-500">{t('নাম ও ছবি পরিবর্তন করুন', 'Change name and profile image')}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => { setView('password'); setError(''); }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 transition-all group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-red-800 group-hover:scale-110 transition-transform">
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
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-all group text-left border border-red-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-red-600 group-hover:scale-110 transition-transform">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-red-600 text-sm">{t('লগ আউট', 'Sign Out')}</p>
                                    <p className="text-xs text-red-400">{t('অ্যাডমিন সেশন সমাপ্ত করুন', 'Exit your admin session')}</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Overlay for Edit/Password */}
            {(view === 'edit' || view === 'password') && (
                <div className="fixed inset-0 bg-orange-950/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
                        <div className="bg-orange-800 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-serif font-bold text-lg">
                                {view === 'edit' ? t('প্রোফাইল সম্পাদনা', 'Edit Profile') : t('পাসওয়ার্ড পরিবর্তন', 'Change Password')}
                            </h3>
                            <button
                                onClick={() => setView('profile')}
                                className="text-orange-200 hover:text-white transition-colors"
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

                            {view === 'edit' ? (
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="flex justify-center mb-6">
                                        <div className="relative group">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-100 bg-orange-50 flex items-center justify-center">
                                                {form.profile_image_url ? (
                                                    <img src={form.profile_image_url} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-10 h-10 text-orange-200" />
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5 ml-1">{t('নাম (বাংলা)', 'Name (Bangla)')}</label>
                                            <input
                                                type="text"
                                                value={form.name_bangla}
                                                onChange={(e) => setForm({ ...form, name_bangla: e.target.value })}
                                                placeholder={t('যেমন: সুপার অ্যাডমিন', 'e.g. Super Admin')}
                                                className="w-full border-2 border-orange-50 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-orange-400 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-stone-500 mb-1.5 ml-1">{t('নাম (ইংরেজি)', 'Name (English)')}</label>
                                            <input
                                                type="text"
                                                value={form.name_english}
                                                onChange={(e) => setForm({ ...form, name_english: e.target.value })}
                                                placeholder={t('যেমন: Super Admin', 'e.g. Super Admin')}
                                                className="w-full border-2 border-orange-50 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-orange-400 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1">{t('প্রোফাইল ছবির লিংক', 'Profile Image URL')}</label>
                                        <input
                                            type="url"
                                            value={form.profile_image_url}
                                            onChange={(e) => setForm({ ...form, profile_image_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full border-2 border-orange-50 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-orange-400 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <button
                                        disabled={loading}
                                        className="w-full bg-orange-800 hover:bg-orange-900 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : t('সংরক্ষণ করুন', 'Update Profile')}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1">{t('বর্তমান পাসওয়ার্ড', 'Current Password')}</label>
                                        <input
                                            type="password"
                                            value={passForm.oldPassword}
                                            onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                                            className="w-full border-2 border-orange-50 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none transition-colors"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1">{t('নতুন পাসওয়ার্ড', 'New Password')}</label>
                                        <input
                                            type="password"
                                            value={passForm.newPassword}
                                            onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                            className="w-full border-2 border-orange-50 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none transition-colors"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1">{t('নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm New Password')}</label>
                                        <input
                                            type="password"
                                            value={passForm.confirmPassword}
                                            onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                                            className="w-full border-2 border-orange-50 bg-orange-50/30 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none transition-colors"
                                            required
                                        />
                                    </div>
                                    <button
                                        disabled={loading}
                                        className="w-full bg-red-800 hover:bg-red-900 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : t('পাসওয়ার্ড সংরক্ষণ করুন', 'Save New Password')}
                                    </button>
                                </form>
                            )}
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
