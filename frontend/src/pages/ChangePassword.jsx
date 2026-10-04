import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const ChangePassword = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const dashboardLink = user?.role === 'superadmin'
        ? '/superadmin-dashboard'
        : (user?.role === 'admin' ? '/admin-dashboard' : (user ? '/user-dashboard' : '/'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            setError(t('নতুন পাসওয়ার্ড দুটি মিলছে না।', 'New passwords do not match.'));
            return;
        }
        if (form.newPassword.length < 6) {
            setError(t('নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।', 'New password must be at least 6 characters.'));
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/change-password', {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            setSuccess(true);
            setTimeout(() => {
                logout();
                navigate(user?.role === 'superadmin' || user?.role === 'admin' ? '/login' : '/user-auth');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.error || t('পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে।', 'Password change failed.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-6 sm:py-10 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-orange-900 tracking-tight">Projenitor</h1>
                    <p className="text-stone-500 mt-1 text-sm">{t('আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন', 'Change Your Account Password')}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="bg-orange-800 px-8 py-5">
                        <h2 className="text-white font-serif text-xl font-semibold flex items-center gap-2.5">
                            <Lock className="w-5 h-5 text-yellow-400" /> {t('পাসওয়ার্ড পরিবর্তন', 'Change Password')}
                        </h2>
                    </div>

                    <div className="p-8">
                        {success ? (
                            <div className="text-center space-y-4 py-4">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                                <p className="text-green-700 font-semibold text-lg">{t('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', 'Password changed successfully!')}</p>
                                <p className="text-stone-500 text-sm">{t('আপনাকে লগআউট করা হচ্ছে। নতুন পাসওয়ার্ড দিয়ে আবার লগইন করুন...', 'Logging you out. Please login with your new password...')}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl animate-shake">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                        {t('বর্তমান পাসওয়ার্ড', 'Current Password')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showOld ? 'text' : 'password'}
                                            name="oldPassword"
                                            value={form.oldPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full border border-orange-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50/50 placeholder-stone-400 pr-10 transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOld(!showOld)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-700 transition-colors p-1"
                                        >
                                            {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                        {t('নতুন পাসওয়ার্ড', 'New Password')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            name="newPassword"
                                            value={form.newPassword}
                                            onChange={handleChange}
                                            placeholder={t('•••••••• (কমপক্ষে ৬ অক্ষর)', '•••••••• (Min 6 characters)')}
                                            className="w-full border border-orange-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50/50 placeholder-stone-400 pr-10 transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-700 transition-colors p-1"
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                        {t('নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm New Password')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            placeholder={t('নতুন পাসওয়ার্ড পুনরায় লিখুন', 'Repeat new password')}
                                            className="w-full border border-orange-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50/50 placeholder-stone-400 pr-10 transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-700 transition-colors p-1"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-800 hover:bg-orange-900 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                                >
                                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : t('পাসওয়ার্ড পরিবর্তন করুন', 'Change Password')}
                                </button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <Link to={dashboardLink} className="text-sm font-medium text-orange-800 hover:text-orange-950 transition-colors hover:underline">
                                ← {t('ড্যাশবোর্ডে ফিরে যান', 'Back to Dashboard')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
