import React from 'react';
import { LogOut, X, AlertCircle } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-orange-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in">
                <div className="bg-red-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <LogOut className="w-5 h-5" />
                        <span className="font-serif font-bold">Sign Out</span>
                    </div>
                    <button onClick={onClose} className="text-red-200 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-800 mb-2">Are you sure?</h3>
                    <p className="text-stone-500 text-sm mb-8">
                        You are about to end your administrative session. You can always sign back in later.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-6 py-3 rounded-xl bg-red-800 text-white font-bold hover:bg-red-900 transition-all shadow-lg shadow-red-900/20 active:scale-95"
                        >
                            Yes, Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
