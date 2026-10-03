import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { 
    Phone, Mail, User, Lock, ArrowRight, ShieldCheck, Map, 
    Eye, EyeOff, CheckCircle2, Clock, XCircle, AlertCircle, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import MemberSelector from '../components/MemberSelector';

const UserAuth = () => {
    const { t, formatName } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    // mode: 'login' | 'register' | 'check' | 'set-password'
    const [mode, setMode] = useState('login');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [memberId, setMemberId] = useState('');
    const [memberName, setMemberName] = useState('');
    const [statusInfo, setStatusInfo] = useState(null); // { status, needsPassword, message, type }
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // If navigated with state { memberId, memberName } for registration
        if (location.state?.memberId) {
            setMemberId(location.state.memberId);
            setMemberName(formatName(location.state.memberName) || location.state.memberName);
            setMode('register');
        } else if (location.state?.mode) {
            if (location.state.mode === 'initial') {
                setMode('check');
            } else {
                setMode(location.state.mode);
            }
        }
    }, [location]);

    // Clear messages on tab change
    const switchMode = (newMode) => {
        setMode(newMode);
        setErrorMessage('');
        setStatusInfo(null);
    };

    // ─── Direct Login ──────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!mobileNumber || !password) {
            setErrorMessage(t('Please enter your mobile/email and password.', 'মোবাইল/ইমেইল এবং পাসওয়ার্ড দিন।'));
            return;
        }
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await api.post('/users/login', {
                mobile_number: mobileNumber.trim(),
                password
            });
            // Defensive: res.data.token and res.data.user
            login(res.data.token, res.data.user);
            
            // Redirect based on role
            if (res.data.user.role === 'superadmin') {
                navigate('/dashboard/superadmin');
            } else if (res.data.user.role === 'admin') {
                navigate('/dashboard/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrorMessage(err.response?.data?.error || t('Invalid credentials or account inactive.', 'ভুল তথ্য বা অ্যাকাউন্ট সক্রিয় নয়।'));
        } finally {
            setLoading(false);
        }
    };

    // ─── Register Request ───────────────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!memberId) {
            setErrorMessage(t('Please select your profile from the family records.', 'বংশতালিকা থেকে আপনার প্রোফাইল নির্বাচন করুন।'));
            return;
        }
        if (!mobileNumber) {
            setErrorMessage(t('Mobile number is required.', 'মোবাইল নম্বর দেওয়া আবশ্যক।'));
            return;
        }
        setLoading(true);
        setErrorMessage('');
        try {
            await api.post('/users/register', {
                member_id: memberId,
                mobile_number: mobileNumber.trim(),
                email: email.trim() || undefined
            });
            setStatusInfo({
                type: 'pending',
                status: 'pending',
                message: t(
                    'Your account activation request has been submitted successfully! An Admin/SuperAdmin will verify and approve your request shortly.',
                    'আপনার অ্যাকাউন্ট সক্রিয়করণের আবেদন সফলভাবে জমা হয়েছে! সম্মানিত এডমিন বা সুপার এডমিন যাচাই করে শীঘ্রই অনুমোদন করবেন।'
                )
            });
            setMode('check');
        } catch (err) {
            setErrorMessage(err.response?.data?.error || t('Registration request failed.', 'আবেদন পাঠাতে সমস্যা হয়েছে।'));
        } finally {
            setLoading(false);
        }
    };

    // ─── Check Status ──────────────────────────────────────────────────────────
    const handleCheckStatus = async (e) => {
        e.preventDefault();
        if (!mobileNumber) {
            setErrorMessage(t('Please enter your registered mobile number or email.', 'আপনার নিবন্ধিত মোবাইল নম্বর বা ইমেইল দিন।'));
            return;
        }
        setLoading(true);
        setErrorMessage('');
        setStatusInfo(null);
        try {
            const res = await api.post('/users/check-status', { mobile_number: mobileNumber.trim() });
            const { status, needsPassword } = res.data;
            
            if (status === 'active') {
                setStatusInfo({
                    type: 'active',
                    status,
                    message: t('Your account is already active! Please proceed to login.', 'আপনার অ্যাকাউন্টটি ইতিমধ্যে সক্রিয় আছে! দয়া করে লগইন করুন।')
                });
            } else if (needsPassword || status === 'approved') {
                setStatusInfo({
                    type: 'approved',
                    status: 'approved',
                    needsPassword: true,
                    message: t('Congratulations! Your account request is approved. Please set your password below.', 'অভিনন্দন! আপনার আবেদনটি অনুমোদিত হয়েছে। নিচে আপনার পাসওয়ার্ড সেট করুন।')
                });
                setMode('set-password');
            } else if (status === 'pending') {
                setStatusInfo({
                    type: 'pending',
                    status: 'pending',
                    message: t('Your account request is currently pending admin review. Please check back later.', 'আপনার আবেদনটি বর্তমানে এডমিনের পর্যালোচনার অপেক্ষায় রয়েছে। অনুগ্রহ করে পরে আবার চেক করুন।')
                });
            } else if (status === 'rejected') {
                setStatusInfo({
                    type: 'rejected',
                    status: 'rejected',
                    message: t('Your account request was not approved. You can submit a new request if needed.', 'আপনার আবেদনটি অনুমোদিত হয়নি। আপনি চাইলে পুনরায় নতুন আবেদন করতে পারেন।')
                });
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setErrorMessage(t('No account or request found with this mobile number or email.', 'এই মোবাইল নম্বর বা ইমেইলে কোনো অ্যাকাউন্ট বা আবেদন পাওয়া যায়নি।'));
            } else {
                setErrorMessage(t('Error checking account status.', 'স্ট্যাটাস যাচাই করতে সমস্যা হয়েছে।'));
            }
        } finally {
            setLoading(false);
        }
    };

    // ─── Set Password ──────────────────────────────────────────────────────────
    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setErrorMessage(t('Password must be at least 6 characters.', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'));
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage(t('Passwords do not match.', 'উভয় পাসওয়ার্ড একই হতে হবে।'));
            return;
        }
        setLoading(true);
        setErrorMessage('');
        try {
            await api.post('/users/set-password', {
                mobile_number: mobileNumber.trim(),
                password
            });
            setStatusInfo({
                type: 'success',
                message: t('Password set successfully! You can now sign in with your credentials.', 'পাসওয়ার্ড সফলভাবে সেট হয়েছে! এখন আপনি লগইন করতে পারবেন।')
            });
            setMode('login');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setErrorMessage(err.response?.data?.error || t('Failed to set password.', 'পাসওয়ার্ড সেট করতে সমস্যা হয়েছে।'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden rounded-3xl">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ea580c 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            
            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                {/* Header Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-orange-800 to-red-800 rounded-2xl mx-auto flex items-center justify-center shadow-xl transform hover:rotate-6 transition-transform mb-5 border border-yellow-500/30">
                    <ShieldCheck className="w-9 h-9 text-yellow-400" />
                </div>
                
                <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-serif">
                    {mode === 'register' ? t('অ্যাকাউন্ট চালু করুন', 'Activate Your Account') : 
                     mode === 'check' ? t('আবেদনের অবস্থা যাচাই', 'Check Application Status') :
                     mode === 'set-password' ? t('পাসওয়ার্ড নির্ধারণ করুন', 'Set Account Password') :
                     t('সদস্য ও এডমিন লগইন', 'Member & Admin Login')}
                </h1>
                
                <p className="mt-1.5 text-center text-xs sm:text-sm text-stone-600">
                    {t('বাড়ৈ বংশের ইতিবৃত্ত — পারিবারিক ডাটাবেস পোর্টাল', 'Projenitor — Ancestral Family Database Portal')}
                </p>

                {/* Claiming Member Indicator */}
                {memberName && mode === 'register' && (
                    <div className="mt-3 mx-auto text-center py-1.5 px-3 bg-orange-100/90 border border-orange-300 rounded-xl text-xs font-semibold text-orange-950 inline-flex items-center gap-1.5 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                        <span>{t('যুক্ত হচ্ছে:', 'Linking to:')}</span>
                        <span className="font-bold font-serif text-orange-900">{formatName(memberName)}</span>
                    </div>
                )}
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                {/* Main Card */}
                <div className="bg-white py-7 px-5 shadow-2xl sm:rounded-3xl sm:px-8 border border-orange-200/80">
                    
                    {/* Navigation Tabs */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-orange-100/80 rounded-2xl mb-6 border border-orange-200 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className={`py-2 px-1 rounded-xl transition-all duration-200 text-center truncate ${
                                mode === 'login'
                                    ? 'bg-orange-800 text-yellow-400 shadow-md font-black'
                                    : 'text-stone-700 hover:text-orange-900 hover:bg-orange-200/50'
                            }`}
                        >
                            {t('লগইন', 'Login')}
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('register')}
                            className={`py-2 px-1 rounded-xl transition-all duration-200 text-center truncate ${
                                mode === 'register'
                                    ? 'bg-red-800 text-yellow-400 shadow-md font-black'
                                    : 'text-stone-700 hover:text-red-900 hover:bg-orange-200/50'
                            }`}
                        >
                            {t('অ্যাকাউন্ট চালু', 'Activate')}
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('check')}
                            className={`py-2 px-1 rounded-xl transition-all duration-200 text-center truncate ${
                                mode === 'check' || mode === 'set-password'
                                    ? 'bg-orange-800 text-yellow-400 shadow-md font-black'
                                    : 'text-stone-700 hover:text-orange-900 hover:bg-orange-200/50'
                            }`}
                        >
                            {t('স্ট্যাটাস', 'Status')}
                        </button>
                    </div>

                    {/* Status Info Notification Box */}
                    {statusInfo && (
                        <div className={`mb-5 p-3.5 rounded-2xl text-xs sm:text-sm font-medium border flex items-start gap-2.5 ${
                            statusInfo.type === 'approved' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                            statusInfo.type === 'active' || statusInfo.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                            statusInfo.type === 'rejected' ? 'bg-red-50 text-red-900 border-red-200' :
                            'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                            {statusInfo.type === 'approved' && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
                            {(statusInfo.type === 'active' || statusInfo.type === 'success') && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                            {statusInfo.type === 'rejected' && <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                            {statusInfo.type === 'pending' && <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                            
                            <div className="flex-1 leading-relaxed">
                                {statusInfo.message}
                                {statusInfo.type === 'active' && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => switchMode('login')}
                                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all"
                                        >
                                            {t('লগইন পেজে যান', 'Go to Login')} &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message Box */}
                    {errorMessage && (
                        <div className="mb-5 p-3 rounded-2xl bg-red-50 text-red-800 text-xs sm:text-sm font-medium border border-red-200 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* ─── Mode: LOGIN ────────────────────────────────────────── */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    {t('মোবাইল নম্বর বা ইমেইল', 'Mobile Number or Email')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 text-sm focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all bg-orange-50/30"
                                        placeholder="01XXXXXXXXX / user@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                                        {t('পাসওয়ার্ড', 'Password')}
                                    </label>
                                    <Link 
                                        to="/forgot-password" 
                                        className="text-xs text-orange-700 hover:text-orange-900 font-semibold hover:underline"
                                    >
                                        {t('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot?')}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-10 text-stone-900 text-sm focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all bg-orange-50/30"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-orange-700 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-800 hover:bg-orange-900 text-white py-3 px-4 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        <span>{t('লগইন করুন', 'Sign In')}</span>
                                        <ArrowRight className="w-4 h-4 text-yellow-400" />
                                    </>
                                )}
                            </button>

                            <div className="pt-2 text-center">
                                <p className="text-xs text-stone-500">
                                    {t('নতুন সদস্য? এখনো একাউন্ট চালু করেননি?', 'New member? Have not activated account yet?')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => switchMode('register')}
                                    className="mt-1 text-xs font-bold text-red-700 hover:text-red-900 hover:underline"
                                >
                                    {t('বংশতালিকা থেকে অ্যাকাউন্ট চালু করুন &rarr;', 'Activate account from Lineage Explorer &rarr;')}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ─── Mode: REGISTER / ACTIVATE ACCOUNT ─────────────────── */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            {memberId ? (
                                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center font-bold font-serif shadow-xs">
                                            {memberName ? (formatName(memberName) || '?').charAt(0) : <User size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-stone-500 font-medium">{t('নির্বাচিত সদস্য প্রোফাইল', 'Selected Profile')}</p>
                                            <p className="font-serif font-bold text-sm text-stone-800">{formatName(memberName)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setMemberId(''); setMemberName(''); }}
                                        className="text-xs text-red-600 hover:text-red-800 font-bold hover:underline"
                                    >
                                        {t('পরিবর্তন', 'Change')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <MemberSelector 
                                        label={t('বংশতালিকা থেকে আপনার নাম খুঁজুন *', 'Search Your Name in Lineage Tree *')}
                                        selectedMember={null}
                                        disableActive={true}
                                        onSelect={(m) => {
                                            if (m) {
                                                setMemberId(m.id);
                                                setMemberName(formatName(m));
                                            }
                                        }}
                                    />
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-stone-500 pt-1">
                                        <span>{t('অথবা খুঁজে নিন', 'Or locate via')}</span>
                                        <Link to="/explorer" className="flex items-center gap-1 text-orange-700 font-bold hover:text-orange-900 hover:underline">
                                            <Map size={13} />
                                            {t('বংশতালিকায় (Lineage Explorer)', 'Lineage Explorer')}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    {t('মোবাইল নম্বর * (বাধ্যতামূলক)', 'Mobile Number * (Required)')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all bg-orange-50/30"
                                        placeholder="01XXXXXXXXX"
                                    />
                                </div>
                                <p className="text-[11px] text-stone-500 mt-1">
                                    {t('এই নম্বরে অ্যাডমিন আপনার পরিচয় নিশ্চিত করবেন।', 'Admin will use this number for profile verification.')}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    {t('ইমেইল (ঐচ্ছিক)', 'Email Address (Optional)')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all bg-orange-50/30"
                                        placeholder="yourname@gmail.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 text-white py-3 px-4 text-sm font-black shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4 text-yellow-300" />
                                        <span>{t('আবেদন জমা দিন (Submit Request)', 'Submit Activation Request')}</span>
                                    </>
                                )}
                            </button>

                            <p className="text-[11px] text-center text-stone-500 leading-normal">
                                {t(
                                    'আবেদন পাঠানোর পর এডমিন অনুমোদন করলে আপনি পাসওয়ার্ড সেট করে অ্যাকাউন্টে প্রবেশ করতে পারবেন।',
                                    'Once approved by an Admin/SuperAdmin, you can set a password to access your account.'
                                )}
                            </p>
                        </form>
                    )}

                    {/* ─── Mode: CHECK STATUS ─────────────────────────────────── */}
                    {mode === 'check' && (
                        <form onSubmit={handleCheckStatus} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    {t('নিবন্ধিত মোবাইল নম্বর বা ইমেইল', 'Registered Mobile Number or Email')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 text-sm focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all bg-orange-50/30"
                                        placeholder="01XXXXXXXXX / your@email.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-800 hover:bg-orange-900 text-white py-3 px-4 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        <Clock className="w-4 h-4 text-yellow-400" />
                                        <span>{t('আবেদনের অবস্থা যাচাই করুন', 'Check Account Status')}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* ─── Mode: SET PASSWORD (APPROVED USERS) ───────────────── */}
                    {mode === 'set-password' && (
                        <form onSubmit={handleSetPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    {t('মোবাইল নম্বর বা ইমেইল', 'Mobile Number or Email')}
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={mobileNumber}
                                    className="block w-full rounded-xl border border-stone-200 py-2.5 px-3.5 text-stone-500 text-sm bg-stone-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    {t('নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)', 'New Password (Min. 6 chars)')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-10 text-stone-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all bg-orange-50/30"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    {t('পাসওয়ার্ড নিশ্চিত করুন', 'Confirm Password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all bg-orange-50/30"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                        <span>{t('পাসওয়ার্ড সংরক্ষণ ও চালু করুন', 'Set Password & Activate')}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Return to Home */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-xs font-semibold text-stone-500 hover:text-orange-800 transition-colors">
                        &larr; {t('মূল পাতায় ফিরে যান', 'Return to Home Page')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserAuth;
