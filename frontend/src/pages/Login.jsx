import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, ShieldCheck, Mail, Lock, ArrowLeft, Users, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const LoginStyles = () => (
    <style>{`
        @keyframes lg-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes lg-shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
        @keyframes lg-glow { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .25; transform: scale(1.12); } }
        .lg-rise { animation: lg-rise .55s cubic-bezier(.2,.8,.2,1) both; }
        .lg-shake { animation: lg-shake .45s ease-in-out; }
        .lg-glow { animation: lg-glow 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .lg-rise, .lg-shake, .lg-glow { animation: none !important; } }
    `}</style>
);

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useLanguage();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [error, setError] = useState('');
    const [errorKey, setErrorKey] = useState(0);
    const [loading, setLoading] = useState(false);

    const showError = (msg) => { setError(msg); setErrorKey((k) => k + 1); };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            showError(t('ইমেইল ও পাসওয়ার্ড দুটোই লিখুন।', 'Please enter both email and password.'));
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            login(res.data.token, res.data.user);
            if (res.data.user.role === 'superadmin') {
                navigate('/dashboard/superadmin');
            } else if (res.data.user.role === 'admin') {
                navigate('/dashboard/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            showError(err.response?.data?.error || t('লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'Login failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const fieldBase = 'w-full h-12 rounded-2xl border bg-stone-50 pl-11 text-[15px] text-stone-800 placeholder-stone-400 transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/15 focus:border-orange-400';

    return (
        <div className="min-h-[78vh] flex items-center justify-center py-6 sm:py-12 px-1 sm:px-4">
            <LoginStyles />
            <div className="w-full max-w-md">
                {/* Emblem & title */}
                <div className="lg-rise text-center mb-6 sm:mb-8">
                    <div className="relative inline-flex mb-4">
                        <span className="lg-glow absolute -inset-3 rounded-[28px] bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 blur-xl" />
                        <span className="relative w-20 h-20 rounded-[24px] p-1 bg-gradient-to-br from-yellow-400 via-orange-600 to-red-800 shadow-xl shadow-orange-900/25">
                            <span className="w-full h-full rounded-[20px] bg-orange-950 flex items-center justify-center overflow-hidden">
                                <img src="/pwa-icon.svg" alt="" className="w-full h-full object-cover" />
                            </span>
                        </span>
                        <span className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-yellow-400 border-[3px] border-background flex items-center justify-center shadow-md">
                            <ShieldCheck className="w-4 h-4 text-red-900" strokeWidth={2.5} />
                        </span>
                    </div>
                    <h1 className="text-[26px] sm:text-3xl font-serif font-black text-stone-900 leading-tight">
                        {t('প্রশাসক প্রবেশদ্বার', 'Admin Portal')}
                    </h1>
                    <p className="text-stone-500 mt-1.5 text-sm">
                        {t('বাড়ৈ বংশের ইতিবৃত্ত — তথ্য ব্যবস্থাপনায় প্রবেশ করুন', 'Barai lineage records — sign in to manage')}
                    </p>
                </div>

                {/* Card */}
                <div className="lg-rise bg-white rounded-3xl shadow-xl shadow-orange-950/10 border border-orange-100 overflow-hidden" style={{ animationDelay: '80ms' }}>
                    <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-700" />

                    <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4" noValidate>
                        {error && (
                            <div key={errorKey} role="alert" className="lg-shake flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-2xl">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="admin-email" className="block text-sm font-semibold text-stone-700 mb-1.5">
                                {t('ইমেইল ঠিকানা', 'Email address')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400 pointer-events-none" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    name="email"
                                    inputMode="email"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="admin@example.com"
                                    className={`${fieldBase} pr-4 ${error && !form.email ? 'border-red-300' : 'border-stone-200'}`}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="admin-password" className="block text-sm font-semibold text-stone-700">
                                    {t('পাসওয়ার্ড', 'Password')}
                                </label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-orange-700 hover:text-orange-900 hover:underline">
                                    {t('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot password?')}
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400 pointer-events-none" />
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock'))}
                                    onBlur={() => setCapsLock(false)}
                                    placeholder="••••••••"
                                    className={`${fieldBase} pr-12 ${error && !form.password ? 'border-red-300' : 'border-stone-200'}`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-orange-700 hover:bg-orange-50 transition-colors"
                                    aria-label={showPassword ? t('পাসওয়ার্ড লুকান', 'Hide password') : t('পাসওয়ার্ড দেখুন', 'Show password')}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                                </button>
                            </div>
                            {capsLock && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                    <KeyRound className="w-3.5 h-3.5" />
                                    {t('ক্যাপস লক চালু আছে', 'Caps Lock is on')}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-1 rounded-2xl bg-gradient-to-r from-orange-700 via-red-700 to-red-800 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait transition-all"
                        >
                            {loading ? (
                                <>
                                    <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    {t('প্রবেশ করা হচ্ছে…', 'Signing in…')}
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-[18px] h-[18px]" />
                                    {t('প্রবেশ করুন', 'Sign in')}
                                </>
                            )}
                        </button>

                        <p className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {t('শুধুমাত্র অনুমোদিত প্রশাসকদের জন্য', 'For authorised administrators only')}
                        </p>
                    </form>
                </div>

                {/* Member sign-in */}
                <div className="lg-rise mt-5" style={{ animationDelay: '160ms' }}>
                    <div className="flex items-center gap-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        <span className="h-px flex-1 bg-stone-200" />
                        {t('সদস্য?', 'A member?')}
                        <span className="h-px flex-1 bg-stone-200" />
                    </div>
                    <Link
                        to="/user-auth"
                        className="w-full h-12 rounded-2xl border border-orange-200 bg-white/70 hover:bg-orange-50 text-orange-800 font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <Users className="w-4 h-4" />
                        {t('সদস্য লগইন বা অ্যাকাউন্ট চালু করুন', 'Member login or activate account')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
