import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ArchiveRestore, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    message, 
    title, 
    confirmText,
    requireCheckbox = false,
    checkboxLabel,
    isPermanent = false
}) => {
    const { t } = useLanguage();
    const [acknowledged, setAcknowledged] = useState(false);

    const defaultTitle = t('মুছে ফেলা নিশ্চিত করুন', 'Confirm Deletion');
    const defaultConfirmText = t('মুছে ফেলুন', 'Delete');
    const defaultCheckboxLabel = t(
        'আমি বুঝতে পেরেছি যে এই প্রক্রিয়াটি কোনোভাবেই আর ফিরিয়ে আনা সম্ভব নয়।',
        'I understand that this action cannot be undone.'
    );

    const modalTitle = title || defaultTitle;
    const actionText = confirmText || defaultConfirmText;
    const finalCheckboxLabel = checkboxLabel || defaultCheckboxLabel;

    useEffect(() => {
        if (isOpen) {
            setAcknowledged(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isRestore = confirmText === 'Restore';
    const isDestructive = !isRestore;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200 border border-stone-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
                        isRestore 
                            ? 'bg-green-100 text-green-700' 
                            : isPermanent 
                                ? 'bg-red-100 text-red-700 ring-8 ring-red-50' 
                                : 'bg-red-100 text-red-600'
                    }`}>
                        {isRestore ? (
                            <ArchiveRestore size={32} />
                        ) : isPermanent ? (
                            <ShieldAlert size={34} />
                        ) : (
                            <AlertTriangle size={32} />
                        )}
                    </div>

                    <h2 className={`text-xl sm:text-2xl font-serif font-bold mb-2 ${
                        isPermanent ? 'text-red-950' : 'text-stone-900'
                    }`}>
                        {modalTitle}
                    </h2>

                    <div className="text-stone-600 text-sm mb-6 leading-relaxed px-2 text-left sm:text-center">
                        {message}
                    </div>

                    {/* Sure reminder: Mandatory confirmation checkbox for permanent deletion */}
                    {requireCheckbox && (
                        <label className="w-full flex items-start gap-3 text-left text-xs sm:text-sm text-red-950 bg-red-50/90 p-3.5 rounded-2xl border border-red-200/90 cursor-pointer select-none mb-6 transition-all hover:bg-red-100/70">
                            <input 
                                type="checkbox" 
                                checked={acknowledged} 
                                onChange={e => setAcknowledged(e.target.checked)} 
                                className="mt-0.5 rounded text-red-700 focus:ring-red-600 w-4 h-4 cursor-pointer accent-red-700" 
                            />
                            <span className="font-medium font-sans">
                                {finalCheckboxLabel}
                            </span>
                        </label>
                    )}

                    <div className="flex gap-3 w-full">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-stone-100 text-stone-800 font-medium rounded-xl hover:bg-stone-200 transition-colors active:scale-95 text-sm cursor-pointer"
                        >
                            {t('বাতিল', 'Cancel')}
                        </button>
                        <button
                            type="button"
                            disabled={requireCheckbox && !acknowledged}
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-3 px-4 text-white font-medium rounded-xl shadow-md transition-all active:scale-95 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${
                                isRestore
                                    ? 'bg-green-700 hover:bg-green-800 shadow-green-700/20'
                                    : isPermanent
                                        ? 'bg-red-700 hover:bg-red-800 shadow-red-700/20 font-bold'
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                            }`}
                        >
                            {actionText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
