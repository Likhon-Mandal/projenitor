import React, { useState, useEffect } from 'react';
import { 
    Trash2, 
    AlertCircle, 
    RefreshCw, 
    ArchiveRestore, 
    Users, 
    Home, 
    MapPin, 
    Compass, 
    Building, 
    Globe, 
    Flag, 
    CheckCircle2,
    ShieldAlert,
    Flame
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const RecycleBin = () => {
    const { language, isBn, t, formatName } = useLanguage();
    const { user, isSuperAdmin } = useAuth();
    const [deletedData, setDeletedData] = useState({
        members: [],
        countries: [],
        divisions: [],
        districts: [],
        upazilas: [],
        villages: [],
        homes: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successAlert, setSuccessAlert] = useState(null);
    const [errorAlert, setErrorAlert] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        action: null, 
        item: null, 
        table: null, 
        title: '', 
        message: '', 
        confirmText: '', 
        requireCheckbox: false, 
        checkboxLabel: '',
        isPermanent: false 
    });

    const fetchRecycleBin = async () => {
        try {
            setLoading(true);
            const res = await api.get('/system/recycle-bin');
            setDeletedData(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecycleBin();
    }, []);

    const handleConfirmAction = async () => {
        const { action, item, table } = confirmModal;

        try {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));

            if ((action === 'permanent-delete' || action === 'empty-all') && !isSuperAdmin) {
                setErrorAlert(t('কেবলমাত্র সুপার অ্যাডমিন স্থায়ীভাবে ডাটা মুছে ফেলতে পারেন।', 'Only Super Admin can permanently delete items.'));
                return;
            }

            if (action === 'restore') {
                const res = await api.put(`/system/restore/${table}/${item.id}`);
                setSuccessAlert(res.data?.message || t('আইটেম সফলভাবে পুনরুদ্ধার করা হয়েছে', 'Item restored successfully'));
                setTimeout(() => setSuccessAlert(null), 6000);
            } else if (action === 'permanent-delete') {
                const res = await api.delete(`/system/permanent/${table}/${item.id}`);
                setSuccessAlert(res.data?.message || t('আইটেম ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে', 'Item permanently deleted'));
                setTimeout(() => setSuccessAlert(null), 6000);
            } else if (action === 'empty-all') {
                const res = await api.delete('/system/empty');
                setSuccessAlert(res.data?.message || t('রিসাইকেল বিন সম্পূর্ণ খালি করা হয়েছে', 'Recycle bin emptied'));
                setTimeout(() => setSuccessAlert(null), 6000);
            }

            fetchRecycleBin();
        } catch (err) {
            setErrorAlert(err.response?.data?.error || err.message);
            setTimeout(() => setErrorAlert(null), 7000);
        }
    };

    // 1. Trigger Restore
    const triggerRestore = (item, table) => {
        const isMember = table === 'members';
        const displayName = item.name || item.full_name || t('নির্বাচিত আইটেম', 'Selected Item');
        const subCount = item.subtree_count || 1;

        let message = '';
        if (isMember) {
            message = subCount > 1
                ? t(
                    `আপনি কি "${displayName}"-কে পুনরুদ্ধার করতে চান? এই মূল সদস্যকে পুনরুদ্ধার করলে তাঁর অধীনস্থ সকল সন্তান, নাতি-নাতনি এবং পত্নী (পরিবারের মোট ${subCount} জন সদস্য) স্বয়ংক্রিয়ভাবে একসাথে পুনরুদ্ধার করা হবে।`,
                    `Do you want to restore "${displayName}"? Restoring this root member will automatically restore all children, grandchildren, and spouse (${subCount} family members in total).`
                  )
                : t(
                    `আপনি কি "${displayName}"-কে পুনরুদ্ধার করতে চান? এই সদস্য সক্রিয় তালিকায় ফিরে আসবে।`,
                    `Do you want to restore "${displayName}"? This member will return to the active list.`
                  );
        } else {
            message = t(
                `আপনি কি "${displayName}" পুনরুদ্ধার করতে চান? এই ভৌগোলিক এলাকার অধীনস্থ সমস্ত উপ-এলাকা এবং পরিবারসমূহ স্বয়ংক্রিয়ভাবে একসাথে পুনরুদ্ধার হবে।`,
                `Do you want to restore "${displayName}"? All sub-areas, households, and family members under this area will be restored automatically.`
            );
        }

        setConfirmModal({
            isOpen: true,
            action: 'restore',
            item,
            table,
            title: isMember ? t('সদস্য পুনরুদ্ধার করবেন?', 'Restore Member?') : t('পুনরুদ্ধার নিশ্চিতকরণ', 'Confirm Restoration'),
            message,
            confirmText: t('পুনরুদ্ধার করুন', 'Restore'),
            requireCheckbox: false,
            isPermanent: false
        });
    };

    // 2. Trigger Permanent Delete (With Sure Reminder)
    const triggerPermanentDelete = (item, table) => {
        if (!isSuperAdmin) {
            setErrorAlert(t('কেবলমাত্র সুপার অ্যাডমিন স্থায়ীভাবে ডাটা মুছে ফেলতে পারেন।', 'Only Super Admin can permanently delete items.'));
            return;
        }
        const isMember = table === 'members';
        const displayName = item.name || item.full_name || t('নির্বাচিত আইটেম', 'Selected Item');
        const subCount = item.subtree_count || 1;

        let message = '';
        if (isMember) {
            message = subCount > 1
                ? t(
                    `সতর্কবার্তা: আপনি "${displayName}"-কে স্থায়ীভাবে মুছে ফেলতে চলেছেন। এর সাথে পরিবারের আরও ${subCount - 1} জন সদস্য (মোট ${subCount} জন) ডাটাবেস থেকে চিরতরে মুছে যাবে। এই কাজটি সম্পন্ন হলে কোনোভাবেই তা আর ফিরিয়ে আনা সম্ভব হবে না।`,
                    `Warning: You are about to permanently delete "${displayName}". An additional ${subCount - 1} family members (${subCount} total) will be permanently deleted from the database. This action cannot be undone.`
                  )
                : t(
                    `সতর্কবার্তা: আপনি "${displayName}"-কে ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলতে চলেছেন। এই কাজটি সম্পন্ন হলে কোনোভাবেই এই সদস্যকে আর পুনরুদ্ধার করা যাবে না।`,
                    `Warning: You are about to permanently delete "${displayName}". This member cannot be recovered once deleted.`
                  );
        } else {
            message = t(
                `সতর্কবার্তা: "${displayName}" স্থায়ীভাবে মুছে ফেললে এর অধীনস্থ সমস্ত উপ-এলাকা, বাড়ি এবং বসবাসরত পরিবারসমূহ ডাটাবেস থেকে চিরতরে মুছে যাবে। এই তথ্য আর কখনো পুনরুদ্ধার করা সম্ভব হবে না।`,
                `Warning: Permanently deleting "${displayName}" will permanently delete all sub-areas, homes, and households residing within it. This data cannot be recovered.`
            );
        }

        setConfirmModal({
            isOpen: true,
            action: 'permanent-delete',
            item,
            table,
            title: t('⚠️ স্থায়ীভাবে মুছে ফেলার সতর্কতা', '⚠️ Permanent Deletion Warning'),
            message,
            confirmText: t('স্থায়ীভাবে মুছুন', 'Permanently Delete'),
            requireCheckbox: false,
            checkboxLabel: '',
            isPermanent: true
        });
    };

    // 3. Trigger Empty All Recycle Bin
    const triggerEmptyAll = () => {
        if (!isSuperAdmin) {
            setErrorAlert(t('কেবলমাত্র সুপার অ্যাডমিন স্থায়ীভাবে ডাটা মুছে ফেলতে পারেন।', 'Only Super Admin can permanently delete items.'));
            return;
        }
        const total = calculateTotalItems();
        setConfirmModal({
            isOpen: true,
            action: 'empty-all',
            item: null,
            table: null,
            title: t('🔥 সম্পূর্ণ রিসাইকেল বিন খালি করবেন?', '🔥 Empty Entire Recycle Bin?'),
            message: t(
                `সতর্কবার্তা: আপনি রিসাইকেল বিনে থাকা সকল তথ্য (মোট ${total} টি আইটেম) একবারে ডাটাবেস থেকে চিরতরে মুছে ফেলতে চলেছেন। এই প্রক্রিয়া সম্পন্ন হলে মুছে রাখা কোনো সদস্য বা এলাকা আর কখনোই উদ্ধার করা যাবে না!`,
                `Warning: You are about to permanently delete all items in the recycle bin (${total} items total). Once completed, none of the deleted members or locations can ever be recovered!`
            ),
            confirmText: t('সম্পূর্ণ খালি করুন', 'Empty All'),
            requireCheckbox: true,
            checkboxLabel: t(
                'আমি বুঝতে পেরেছি যে রিসাইকেল বিনের সমস্ত ডাটা চিরতরে ধ্বংস হবে এবং তা পুনরুদ্ধার করা সম্ভব নয়।',
                'I understand that all data in the recycle bin will be permanently destroyed and cannot be recovered.'
            ),
            isPermanent: true
        });
    };

    const calculateTotalItems = () => {
        return Object.values(deletedData).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
    };

    const tableMeta = {
        members: { title: t('সদস্যবৃন্দ', 'Members'), icon: Users, color: 'text-orange-800', bg: 'bg-orange-100', border: 'border-orange-200', desc: t('মুছে ফেলা পারিবারিক শাখার মূল সদস্যবৃন্দ', 'Root members of deleted family branches') },
        homes: { title: t('বাড়ি', 'Homes'), icon: Home, color: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-200', desc: t('মুছে ফেলা বাড়ি ও বাসস্থান', 'Deleted homes and households') },
        villages: { title: t('গ্রাম', 'Villages'), icon: MapPin, color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-200', desc: t('মুছে ফেলা গ্রাম', 'Deleted villages') },
        upazilas: { title: t('উপজেলা', 'Upazilas'), icon: Compass, color: 'text-blue-800', bg: 'bg-blue-100', border: 'border-blue-200', desc: t('মুছে ফেলা উপজেলা', 'Deleted upazilas') },
        districts: { title: t('জেলা', 'Districts'), icon: Building, color: 'text-indigo-800', bg: 'bg-indigo-100', border: 'border-indigo-200', desc: t('মুছে ফেলা জেলা', 'Deleted districts') },
        divisions: { title: t('বিভাগ', 'Divisions'), icon: Globe, color: 'text-purple-800', bg: 'bg-purple-100', border: 'border-purple-200', desc: t('মুছে ফেলা বিভাগ', 'Deleted divisions') },
        countries: { title: t('দেশ', 'Countries'), icon: Flag, color: 'text-rose-800', bg: 'bg-rose-100', border: 'border-rose-200', desc: t('মুছে ফেলা দেশ', 'Deleted countries') },
    };

    const totalItems = calculateTotalItems();

    if (loading && totalItems === 0) {
        return (
            <div className="max-w-6xl mx-auto p-6 lg:p-10 flex flex-col items-center justify-center min-h-[50vh]">
                <RefreshCw className="animate-spin text-orange-800 mb-3" size={36} />
                <p className="text-stone-600 font-medium font-sans">
                    {t('রিসাইকেল বিন লোড হচ্ছে...', 'Loading Recycle Bin...')}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center my-12 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
                <AlertCircle className="mx-auto text-red-700 mb-2" size={36} />
                <h3 className="text-xl font-bold text-red-900 font-serif mb-2">
                    {t('ত্রুটি ঘটেছে', 'An Error Occurred')}
                </h3>
                <p className="text-red-700 font-sans">{error}</p>
                <button
                    onClick={fetchRecycleBin}
                    className="mt-4 px-5 py-2.5 bg-orange-800 hover:bg-orange-900 active:scale-95 text-white rounded-xl font-medium transition-all shadow-sm cursor-pointer"
                >
                    {t('পুনরায় চেষ্টা করুন', 'Retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative min-h-screen">
            {/* Background Texture */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#9a3412 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            />

            <div className="relative z-10">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-stone-200/80 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-800 shadow-sm border border-orange-200">
                                <Trash2 size={26} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                                    {t('রিসাইকেল বিন', 'Recycle Bin')}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <p className="text-stone-600 text-xs sm:text-sm font-sans">
                                        {t(
                                            'মুছে ফেলা মূল শাখা বা এলাকা পর্যবেক্ষণ ও পুনরুদ্ধার করুন।',
                                            'View and restore deleted root branches or locations.'
                                        )}
                                    </p>
                                    {!isSuperAdmin && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] font-medium">
                                            <span>🔒 {t('চিরতরে মোছার সুবিধা কেবলমাত্র সুপার অ্যাডমিনের জন্য', 'Permanent delete reserved for Super Admin')}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                        <button
                            onClick={fetchRecycleBin}
                            disabled={loading}
                            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-orange-50 hover:border-orange-300 hover:text-orange-900 transition-all text-xs sm:text-sm font-medium shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin text-orange-800' : ''} />
                            <span>{t('রিফ্রেশ', 'Refresh')}</span>
                        </button>

                        {isSuperAdmin && totalItems > 0 && (
                            <button
                                onClick={triggerEmptyAll}
                                className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 hover:border-red-300 hover:text-red-900 transition-all text-xs sm:text-sm font-medium shadow-xs active:scale-95 cursor-pointer"
                                title={t('রিসাইকেল বিনের সব আইটেম চিরতরে মুছে ফেলুন', 'Permanently delete all items in recycle bin')}
                            >
                                <Flame size={15} className="text-red-600" />
                                <span>{t('বিন খালি করুন', 'Empty Bin')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Success Alert */}
                {successAlert && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
                        <span className="text-sm font-medium font-sans">{successAlert}</span>
                    </div>
                )}

                {/* Error Alert */}
                {errorAlert && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-2xl text-red-900 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <ShieldAlert size={20} className="text-red-700 shrink-0" />
                        <span className="text-sm font-medium font-sans">{errorAlert}</span>
                    </div>
                )}

                {/* Empty State */}
                {totalItems === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-stone-200 flex flex-col items-center my-6">
                        <div className="w-20 h-20 bg-orange-50 text-orange-800 rounded-full flex items-center justify-center mb-4">
                            <Trash2 size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 font-serif mb-2">
                            {t('রিসাইকেল বিন ফাঁকা রয়েছে', 'Recycle Bin is Empty')}
                        </h3>
                        <p className="text-stone-500 font-sans max-w-md">
                            {t(
                                'কোনো সদস্য বা এলাকা বর্তমানে রিসাইকেল বিনে জমা নেই। সব তথ্য সক্রিয় রয়েছে।',
                                'No members or locations are currently in the recycle bin. All data is active.'
                            )}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Display Categories */}
                        {Object.entries(deletedData).map(([table, items]) => {
                            if (!items || items.length === 0) return null;

                            const meta = tableMeta[table] || {
                                title: table.charAt(0).toUpperCase() + table.slice(1),
                                icon: Trash2,
                                color: 'text-stone-800',
                                bg: 'bg-stone-100',
                                border: 'border-stone-200',
                                desc: ''
                            };
                            const IconComponent = meta.icon;

                            return (
                                <div key={table} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden transition-all hover:shadow-md">
                                    {/* Category Header */}
                                    <div className="bg-stone-50/90 border-b border-stone-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
                                                <IconComponent size={20} />
                                            </div>
                                            <div>
                                                <h2 className="font-serif font-bold text-stone-800 text-lg sm:text-xl">
                                                    {meta.title}
                                                </h2>
                                                {meta.desc && (
                                                    <p className="text-xs text-stone-500 font-sans">{meta.desc}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="self-start sm:self-auto px-3 py-1 bg-stone-200/80 text-stone-700 text-xs font-semibold rounded-full">
                                            {items.length} {t('টি আইটেম', 'items')}
                                        </span>
                                    </div>

                                    {/* Items List */}
                                    <ul className="divide-y divide-stone-100">
                                        {items.map(item => (
                                            <li 
                                                key={item.id} 
                                                className="p-4 sm:p-5 hover:bg-orange-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-serif font-bold text-stone-900 text-lg">
                                                            {formatName(item)}
                                                        </span>
                                                        {item.gender && (
                                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                                                item.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {item.gender === 'Female' ? t('সহধর্মিণী', 'Female') : t('পুরুষ', 'Male')}
                                                            </span>
                                                        )}
                                                        {item.level && (
                                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                                {t('প্রজন্ম', 'Gen')} {item.level}
                                                            </span>
                                                        )}

                                                        {/* Subtree Count Badge for Members */}
                                                        {item.subtree_count && item.subtree_count > 1 && (
                                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1 shadow-xs">
                                                                <Users size={12} className="text-orange-800" />
                                                                {t('অধীনস্থ পরিবার:', 'Family subtree:')} {item.subtree_count} {t('জন', 'members')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Context line with home, village, upazila and date */}
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-stone-600">
                                                        {item.home_name && (
                                                            <span><strong className="text-stone-700">{t('বাড়ি:', 'Home:')}</strong> {item.home_name}</span>
                                                        )}
                                                        {item.village_name && (
                                                            <span><strong className="text-stone-700">{t('গ্রাম:', 'Village:')}</strong> {item.village_name}</span>
                                                        )}
                                                        {item.upazila_name && (
                                                            <span><strong className="text-stone-700">{t('উপজেলা:', 'Upazila:')}</strong> {item.upazila_name}</span>
                                                        )}
                                                        {item.district_name && (
                                                            <span><strong className="text-stone-700">{t('জেলা:', 'District:')}</strong> {item.district_name}</span>
                                                        )}
                                                        {item.division_name && (
                                                            <span><strong className="text-stone-700">{t('বিভাগ:', 'Division:')}</strong> {item.division_name}</span>
                                                        )}
                                                        {item.country_name && (
                                                            <span><strong className="text-stone-700">{t('দেশ:', 'Country:')}</strong> {item.country_name}</span>
                                                        )}
                                                        {(item.father_name_bangla || item.father_name) && (
                                                            <span><strong className="text-stone-700">{t('পিতা:', 'Father:')}</strong> {formatName({ full_name: item.father_name, name_bangla: item.father_name_bangla })}</span>
                                                        )}
                                                        <div className="text-stone-400 flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            {t('মুছে ফেলা:', 'Deleted:')} {new Date(item.deleted_at).toLocaleString(isBn ? 'bn-BD' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons: Restore & Permanent Delete */}
                                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                    {/* Permanent Delete Button - ONLY for Super Admin */}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => triggerPermanentDelete(item, table)}
                                                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-900 active:scale-95 rounded-xl shadow-xs transition-all font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                                                            title={t('স্থায়ীভাবে মুছে ফেলুন', 'Delete Permanently')}
                                                        >
                                                            <Trash2 size={15} />
                                                            <span className="hidden xs:inline">{t('চিরতরে মুছুন', 'Delete')}</span>
                                                            <span className="xs:hidden">{t('মুছুন', 'Delete')}</span>
                                                        </button>
                                                    )}

                                                    {/* Restore Button */}
                                                    <button
                                                        onClick={() => triggerRestore(item, table)}
                                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-800 hover:bg-orange-900 active:scale-95 text-white rounded-xl shadow-xs hover:shadow transition-all font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-800/40 cursor-pointer"
                                                        title={t('পুনরুদ্ধার করুন', 'Restore')}
                                                    >
                                                        <ArchiveRestore size={15} />
                                                        <span>{t('পুনরুদ্ধার', 'Restore')}</span>
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirmation Modal with Sure Reminder Checkbox */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                requireCheckbox={confirmModal.requireCheckbox}
                checkboxLabel={confirmModal.checkboxLabel}
                isPermanent={confirmModal.isPermanent}
            />
        </div>
    );
};

export default RecycleBin;
