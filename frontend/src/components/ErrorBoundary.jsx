import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.href = window.location.pathname;
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-orange-50/90 border border-orange-200/90 rounded-3xl p-6 sm:p-8 max-w-lg shadow-sm">
                        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-700 shadow-2xs">
                            <AlertTriangle size={28} />
                        </div>
                        <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-800 mb-2">
                            কিছু একটা অপ্রত্যাশিত সমস্যা হয়েছে / Something went wrong
                        </h2>
                        <p className="text-stone-600 text-xs sm:text-sm mb-4 leading-relaxed">
                            পৃষ্ঠাটি লোড করার সময় একটি ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন বা রিলোড দিন।
                        </p>

                        {this.state.error && (
                            <details className="text-left text-[11px] font-mono text-red-800 bg-red-50/80 p-2.5 rounded-xl border border-red-200/80 mb-5 overflow-auto max-h-32">
                                <summary className="cursor-pointer font-sans font-semibold text-red-700 select-none outline-none">
                                    ত্রুটির বিস্তারিত তথ্য (Error details)
                                </summary>
                                <p className="mt-1.5 whitespace-pre-wrap break-words">
                                    {this.state.error.message || String(this.state.error)}
                                </p>
                            </details>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={this.handleReload}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-800 hover:bg-orange-900 text-white rounded-xl font-medium text-xs sm:text-sm shadow transition-all active:scale-95 cursor-pointer"
                            >
                                <RefreshCw size={15} /> Reload Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                            >
                                মূল পাতা (Home)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
