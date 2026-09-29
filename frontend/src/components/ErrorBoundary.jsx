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
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-orange-50/80 border border-orange-200 rounded-3xl p-8 max-w-lg shadow-sm">
                        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-700">
                            <AlertTriangle size={28} />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-stone-800 mb-2">
                            কিছু একটা অপ্রত্যাশিত সমস্যা হয়েছে / Something went wrong
                        </h2>
                        <p className="text-stone-600 text-sm mb-6">
                            পৃষ্ঠাটি লোড করার সময় একটি ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে রিলোড দিন।
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-800 hover:bg-orange-900 text-white rounded-xl font-medium shadow transition-all active:scale-95"
                        >
                            <RefreshCw size={16} /> Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
