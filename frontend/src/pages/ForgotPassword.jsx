import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import api from '../api/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const copyToken = () => {
        navigator.clipboard.writeText(result.resetToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-6 sm:py-10 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-orange-900">Projenitor</h1>
                    <p className="text-stone-500 mt-1 text-sm">Password Recovery</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
                    <div className="bg-orange-800 px-8 py-4">
                        <h2 className="text-white font-serif text-xl font-semibold">Forgot Password</h2>
                    </div>

                    <div className="p-8">
                        {!result ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <p className="text-sm text-stone-600">Enter your admin email address to receive a password reset token.</p>

                                {error && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full border border-orange-200 rounded-lg pl-10 pr-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 placeholder-stone-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-800 hover:bg-orange-900 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                                >
                                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Send Reset Token'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{result.message}</span>
                                </div>
                                {result.resetToken && (
                                    <div>
                                        <p className="text-sm text-stone-500 mb-2">Your reset token (valid for 1 hour):</p>
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 font-mono text-xs text-orange-900 break-all relative">
                                            {result.resetToken}
                                            <button
                                                onClick={copyToken}
                                                className="absolute top-2 right-2 text-orange-600 hover:text-orange-800 transition-colors"
                                                title="Copy token"
                                            >
                                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-2">⚠️ Dev mode: In production, this would be emailed to you.</p>
                                    </div>
                                )}
                                <Link
                                    to="/reset-password"
                                    className="block text-center bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    Go to Reset Password →
                                </Link>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-orange-700 hover:text-orange-900 hover:underline transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
