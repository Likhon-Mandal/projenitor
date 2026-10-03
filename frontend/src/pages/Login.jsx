import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError('Please enter both email and password.');
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
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-6 sm:py-10 px-4">
            <div className="w-full max-w-md">
                {/* Logo Card */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-800 mb-4 shadow-lg ring-2 ring-yellow-400/40">
                        <Shield className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-orange-900">Projenitor</h1>
                    <p className="text-stone-500 mt-1 font-sans text-sm">Admin Portal — Sign in to continue</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
                    {/* Header strip */}
                    <div className="bg-orange-800 px-8 py-4">
                        <h2 className="text-white font-serif text-xl font-semibold">Sign In</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="admin@example.com"
                                className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-orange-50 placeholder-stone-400"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-orange-50 placeholder-stone-400 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-700 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-orange-700 hover:text-orange-900 hover:underline transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-800 hover:bg-orange-900 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 space-y-2">
                    <Link
                        to="/user-auth"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-800 hover:text-orange-950 transition-colors"
                    >
                        <span>&larr; সাধারণ সদস্য লগইন বা একাউন্ট সক্রিয় করুন (Member Login / Activate)</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
