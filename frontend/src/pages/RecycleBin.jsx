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
    CheckCircle2 
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/api';

const RecycleBin = () => {
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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, table: null });

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

    const handleRestoreConfirm = async () => {
        const { item, table } = confirmModal;
        if (!item || !table) return;

        try {
            setConfirmModal({ ...confirmModal, isOpen: false });
            const res = await api.put(`/system/restore/${table}/${item.id}`);
            setSuccessAlert(res.data?.message || 'আইটেম সফলভাবে পুনরুদ্ধার করা হয়েছে (Item restored successfully)');
            setTimeout(() => setSuccessAlert(null), 5000);
            fetchRecycleBin();
        } catch (err) {
            setErrorAlert(err.response?.data?.error || err.message);
            setTimeout(() => setErrorAlert(null), 6000);
        }
    };

    const triggerRestore = (item, table) => {
        const isMember = table === 'members';
        const displayName = item.name || item.full_name || 'নির্বাচিত আইটেম';

        setConfirmModal({
            isOpen: true,
            item,
            table,
            title: isMember ? `সদস্য পুনরুদ্ধার করবেন?` : `পুনরুদ্ধার নিশ্চিতকরণ`,
            message: isMember
                ? `আপনি কি "${displayName}"-কে পুনরুদ্ধার করতে চান? এই সদস্যকে পুনরুদ্ধার করলে তাঁর সকল পত্নী এবং বংশধরদের (সন্তান, নাতি-নাতনি) স্বয়ংক্রিয়ভাবে একসাথে পুনরুদ্ধার করা হবে।`
                : `আপনি কি "${displayName}" পুনরুদ্ধার করতে চান? ভৌগোলিক এলাকার ক্ষেত্রে এর অধীনস্থ সমস্ত উপ-এলাকা এবং সদস্যবৃন্দ স্বয়ংক্রিয়ভাবে পুনরুদ্ধার হবে।`
        });
    };

    const calculateTotalItems = () => {
        return Object.values(deletedData).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
    };

    const tableMeta = {
        members: { title: 'সদস্যবৃন্দ (Members)', icon: Users, color: 'text-orange-800', bg: 'bg-orange-100', border: 'border-orange-200' },
        homes: { title: 'বাড়ি (Homes)', icon: Home, color: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-200' },
        villages: { title: 'গ্রাম (Villages)', icon: MapPin, color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-200' },
        upazilas: { title: 'উপজেলা (Upazilas)', icon: Compass, color: 'text-blue-800', bg: 'bg-blue-100', border: 'border-blue-200' },
        districts: { title: 'জেলা (Districts)', icon: Building, color: 'text-indigo-800', bg: 'bg-indigo-100', border: 'border-indigo-200' },
        divisions: { title: 'বিভাগ (Divisions)', icon: Globe, color: 'text-purple-800', bg: 'bg-purple-100', border: 'border-purple-200' },
        countries: { title: 'দেশ (Countries)', icon: Flag, color: 'text-rose-800', bg: 'bg-rose-100', border: 'border-rose-200' },
    };

    const totalItems = calculateTotalItems();

    if (loading && totalItems === 0) {
        return (
            <div className="max-w-6xl mx-auto p-6 lg:p-10 flex flex-col items-center justify-center min-h-[50vh]">
                <RefreshCw className="animate-spin text-orange-800 mb-3" size={36} />
                <p className="text-stone-600 font-medium">রিসাইকেল বিন লোড হচ্ছে... (Loading Recycle Bin...)</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center my-12 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle className="mx-auto text-red-700 mb-2" size={36} />
                <h3 className="text-xl font-bold text-red-900 font-serif mb-2">ত্রুটি ঘটেছে (Error)</h3>
                <p className="text-red-700 font-sans">{error}</p>
                <button
                    onClick={fetchRecycleBin}
                    className="mt-4 px-5 py-2.5 bg-orange-800 text-white rounded-xl font-medium hover:bg-orange-900 transition-colors shadow-sm"
                >
                    পুনরায় চেষ্টা করুন (Retry)
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
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-800 shadow-sm">
                                <Trash2 size={26} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                                    রিসাইকেল বিন <span className="text-lg sm:text-xl font-sans font-normal text-stone-500">/ Recycle Bin</span>
                                </h1>
                                <p className="text-stone-600 text-xs sm:text-sm mt-1 font-sans">
                                    মুছে ফেলা সদস্য এবং ভৌগোলিক অবস্থানসমূহ পর্যবেক্ষণ ও এক ক্লিকে পুনরুদ্ধার করুন।
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-auto">
                        <button
                            onClick={fetchRecycleBin}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-orange-50 hover:border-orange-300 hover:text-orange-900 transition-all text-sm font-medium shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin text-orange-800' : ''} />
                            <span>রিফ্রেশ (Refresh)</span>
                        </button>
                    </div>
                </div>

                {/* Success Alert */}
                {successAlert && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
                        <span className="text-sm font-medium">{successAlert}</span>
                    </div>
                )}

                {/* Error Alert */}
                {errorAlert && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-2xl text-red-900 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle size={20} className="text-red-700 shrink-0" />
                        <span className="text-sm font-medium">{errorAlert}</span>
                    </div>
                )}

                {/* Empty State */}
                {totalItems === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-stone-200 flex flex-col items-center my-6">
                        <div className="w-20 h-20 bg-orange-50 text-orange-800 rounded-full flex items-center justify-center mb-4">
                            <Trash2 size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 font-serif mb-2">রিসাইকেল বিন ফাঁকা রয়েছে</h3>
                        <p className="text-stone-500 font-sans max-w-md">
                            কোনো সদস্য বা এলাকা বর্তমানে রিসাইকেল বিনে জমা নেই। সব তথ্য সক্রিয় রয়েছে।
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
                                border: 'border-stone-200'
                            };
                            const IconComponent = meta.icon;

                            return (
                                <div key={table} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden transition-all hover:shadow-md">
                                    {/* Category Header */}
                                    <div className="bg-stone-50/80 border-b border-stone-200 px-5 sm:px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center`}>
                                                <IconComponent size={20} />
                                            </div>
                                            <h2 className="font-serif font-bold text-stone-800 text-lg sm:text-xl">
                                                {meta.title}
                                            </h2>
                                        </div>
                                        <span className="px-3 py-1 bg-stone-200/80 text-stone-700 text-xs font-semibold rounded-full">
                                            {items.length} টি
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
                                                            {item.name || item.full_name}
                                                        </span>
                                                        {item.full_name && item.name_bangla && item.full_name !== item.name_bangla && (
                                                            <span className="text-xs text-stone-500 font-sans">
                                                                ({item.full_name})
                                                            </span>
                                                        )}
                                                        {item.gender && (
                                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                                                item.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {item.gender === 'Female' ? 'সহধর্মিণী / Female' : 'পুরুষ / Male'}
                                                            </span>
                                                        )}
                                                        {item.level && (
                                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                                প্রজন্ম / Gen {item.level}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Context line with home, village, upazila and date */}
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-stone-600">
                                                        {item.home_name && (
                                                            <span><strong className="text-stone-700">বাড়ি:</strong> {item.home_name}</span>
                                                        )}
                                                        {item.village_name && (
                                                            <span><strong className="text-stone-700">গ্রাম:</strong> {item.village_name}</span>
                                                        )}
                                                        {item.upazila_name && (
                                                            <span><strong className="text-stone-700">উপজেলা:</strong> {item.upazila_name}</span>
                                                        )}
                                                        {item.district_name && (
                                                            <span><strong className="text-stone-700">জেলা:</strong> {item.district_name}</span>
                                                        )}
                                                        {item.division_name && (
                                                            <span><strong className="text-stone-700">বিভাগ:</strong> {item.division_name}</span>
                                                        )}
                                                        {item.country_name && (
                                                            <span><strong className="text-stone-700">দেশ:</strong> {item.country_name}</span>
                                                        )}
                                                        {(item.father_name_bangla || item.father_name) && (
                                                            <span><strong className="text-stone-700">পিতা:</strong> {item.father_name_bangla || item.father_name}</span>
                                                        )}
                                                        <div className="text-stone-400 flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            মুছে ফেলা: {new Date(item.deleted_at).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Restore Button (Mobile-friendly, responsive, interactive hover) */}
                                                <div className="self-end sm:self-center shrink-0">
                                                    <button
                                                        onClick={() => triggerRestore(item, table)}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-800 hover:bg-orange-900 active:scale-95 text-white rounded-xl shadow-sm hover:shadow transition-all font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-800/40"
                                                    >
                                                        <ArchiveRestore size={16} />
                                                        <span>পুনরুদ্ধার (Restore)</span>
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

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleRestoreConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Restore"
            />
        </div>
    );
};

export default RecycleBin;
