import React, { useState, useEffect, useMemo } from 'react';
import { 
    Scroll, 
    Plus, 
    Edit2, 
    Trash2, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    BookOpen,
    Quote,
    Users,
    Home,
    MapPin,
    GraduationCap,
    Compass,
    ChevronRight,
    ChevronLeft,
    Check,
    Bookmark
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import HistoryFormModal from '../components/HistoryFormModal';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/api';

const History = () => {
    const { isBn, t } = useLanguage();
    const { isAdmin } = useAuth();

    const [historyRecords, setHistoryRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null);
    const [selectedChapterId, setSelectedChapterId] = useState('all');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null });

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/history');
            setHistoryRecords(res.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError(err.response?.data?.error || err.message || t('ইতিহাস লোড করতে ব্যর্থ হয়েছে।', 'Failed to load history.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Clear alert message after 4 seconds
    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => setAlertMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    const handleOpenAdd = () => {
        setEditingRecord(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (rec) => {
        setEditingRecord(rec);
        setIsFormModalOpen(true);
    };

    const handleOpenDelete = (rec) => {
        setDeleteConfirm({ isOpen: true, item: rec });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.item?.id) return;
        try {
            await api.delete(`/history/${deleteConfirm.item.id}`);
            setAlertMessage({
                type: 'success',
                text: t('ঐতিহাসিক অনুচ্ছেদটি সফলভাবে মুছে ফেলা হয়েছে।', 'History section deleted successfully.')
            });
            fetchHistory();
        } catch (err) {
            console.error('Delete error:', err);
            setAlertMessage({
                type: 'error',
                text: err.response?.data?.error || err.message || t('অনুচ্ছেদ মুছতে ব্যর্থ হয়েছে।', 'Failed to delete section.')
            });
        } finally {
            setDeleteConfirm({ isOpen: false, item: null });
        }
    };

    // Filter displayed records based on selected chapter tab
    const displayedRecords = useMemo(() => {
        if (selectedChapterId === 'all') {
            return historyRecords;
        }
        return historyRecords.filter(r => r.id === Number(selectedChapterId));
    }, [historyRecords, selectedChapterId]);

    // Helper to render rich content: detecting historical rhymes, lists, and stat blocks
    const renderFormattedContent = (rawText, isLead = false) => {
        if (!rawText) return null;

        // Split text into logical paragraph chunks
        const paragraphs = rawText.split('\n\n');

        return (
            <div className="space-y-4">
                {paragraphs.map((p, idx) => {
                    const text = p.trim();
                    if (!text) return null;

                    // 1. Historical Rhyme detection: lines enclosed in quotation marks or contains Panchu Barai rhyme
                    if (text.includes('পাঁচু (পঞ্চানন) বাড়ৈ') || text.includes('ঘর গেল পোড়া') || (text.startsWith('“') && text.endsWith('”'))) {
                        return (
                            <div 
                                key={idx}
                                className="my-6 p-6 sm:p-7 bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-100/50 border-y-2 sm:border-y-0 sm:border-l-4 border-orange-800 rounded-2xl shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all duration-300"
                            >
                                <Quote className="absolute -top-3 -left-3 text-orange-200/40 w-16 h-16 pointer-events-none" />
                                <div className="font-serif text-lg sm:text-2xl font-bold text-orange-950 leading-relaxed tracking-wide italic">
                                    {text.replace(/[“”]/g, '')}
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-orange-800 font-sans uppercase tracking-widest">
                                    <span className="h-px w-6 bg-orange-300" />
                                    <span>{t('ঐতিহাসিক প্রচলিত বংশীয় লোকগাথা ও ছড়া', 'Traditional Clan Historical Rhyme')}</span>
                                    <span className="h-px w-6 bg-orange-300" />
                                </div>
                            </div>
                        );
                    }

                    // 2. 2001 Survey Stat Cards detection
                    if (text.includes('মাদারীপুর, গোপালগঞ্জ, বরিশাল ও পিরোজপুর জেলার ১১টি থানায়') && text.includes('৬,১৮৩ জন')) {
                        return (
                            <div key={idx} className="my-5 space-y-4">
                                <p className="text-stone-700 leading-relaxed text-base sm:text-lg">{text}</p>
                                
                                {/* Visual Metrics Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    <div className="bg-orange-50/90 border border-orange-200/80 rounded-2xl p-4 text-center hover:shadow-xs transition-shadow">
                                        <div className="w-8 h-8 rounded-full bg-orange-800 text-white flex items-center justify-center mx-auto mb-2 shadow-2xs">
                                            <Compass size={16} />
                                        </div>
                                        <div className="text-2xl font-serif font-bold text-orange-950">১১টি</div>
                                        <div className="text-xs text-stone-600 font-medium mt-0.5">{t('থানা / উপজেলা', 'Thanas / Upazilas')}</div>
                                    </div>

                                    <div className="bg-orange-50/90 border border-orange-200/80 rounded-2xl p-4 text-center hover:shadow-xs transition-shadow">
                                        <div className="w-8 h-8 rounded-full bg-orange-800 text-white flex items-center justify-center mx-auto mb-2 shadow-2xs">
                                            <MapPin size={16} />
                                        </div>
                                        <div className="text-2xl font-serif font-bold text-orange-950">৮২টি</div>
                                        <div className="text-xs text-stone-600 font-medium mt-0.5">{t('বিস্তৃত গ্রাম', 'Villages')}</div>
                                    </div>

                                    <div className="bg-orange-50/90 border border-orange-200/80 rounded-2xl p-4 text-center hover:shadow-xs transition-shadow">
                                        <div className="w-8 h-8 rounded-full bg-orange-800 text-white flex items-center justify-center mx-auto mb-2 shadow-2xs">
                                            <Home size={16} />
                                        </div>
                                        <div className="text-2xl font-serif font-bold text-orange-950">৯৮২টি</div>
                                        <div className="text-xs text-stone-600 font-medium mt-0.5">{t('পরিবার', 'Families')}</div>
                                    </div>

                                    <div className="bg-orange-50/90 border border-orange-200/80 rounded-2xl p-4 text-center hover:shadow-xs transition-shadow">
                                        <div className="w-8 h-8 rounded-full bg-orange-800 text-white flex items-center justify-center mx-auto mb-2 shadow-2xs">
                                            <Users size={16} />
                                        </div>
                                        <div className="text-2xl font-serif font-bold text-orange-950">৬,১৮৩</div>
                                        <div className="text-xs text-stone-600 font-medium mt-0.5">{t('বংশধর সদস্য', 'Clan Members')}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // 3. Bullet points list detection (starts with • or contains multiple •)
                    if (text.includes('•')) {
                        const lines = text.split('\n');
                        const headerLine = lines[0].startsWith('•') ? null : lines[0];
                        const bulletItems = lines.filter(l => l.trim().startsWith('•'));

                        return (
                            <div key={idx} className="my-4 space-y-2.5">
                                {headerLine && (
                                    <p className="font-semibold text-stone-800 text-base sm:text-lg mb-2">
                                        {headerLine}
                                    </p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {bulletItems.map((item, bIdx) => (
                                        <div 
                                            key={bIdx}
                                            className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/60 border border-orange-100 hover:bg-orange-50 transition-colors text-xs sm:text-sm text-stone-800"
                                        >
                                            <span className="p-1 bg-orange-800 text-white rounded-md shrink-0 mt-0.5">
                                                <Check size={12} strokeWidth={3} />
                                            </span>
                                            <span className="leading-snug">
                                                {item.replace(/^[•\s]+/, '')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    // 4. Section headings inside text like [১১ উপজেলার স্ট্যান্ডার্ড প্রতিনিধিবৃন্দ]:
                    if (text.startsWith('[') && text.includes(']:')) {
                        const colonPos = text.indexOf(']:');
                        const sectionHeading = text.substring(1, colonPos);
                        const restOfText = text.substring(colonPos + 2).trim();

                        return (
                            <div key={idx} className="my-5">
                                <h4 className="font-serif text-lg sm:text-xl font-bold text-orange-950 flex items-center gap-2 mb-2 pb-1.5 border-b border-orange-100">
                                    <Bookmark size={18} className="text-orange-800" />
                                    <span>{sectionHeading}</span>
                                </h4>
                                {restOfText && (
                                    <p className="text-stone-700 leading-relaxed text-base sm:text-lg whitespace-pre-line">
                                        {restOfText}
                                    </p>
                                )}
                            </div>
                        );
                    }

                    // 5. Default paragraph rendering
                    return (
                        <p 
                            key={idx}
                            className={
                                isLead && idx === 0 
                                    ? "lead font-medium text-stone-800 text-lg sm:text-xl leading-relaxed whitespace-pre-line" 
                                    : "text-stone-700 leading-relaxed text-base sm:text-lg whitespace-pre-line"
                            }
                        >
                            {text}
                        </p>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in font-sans pb-24 px-3 sm:px-6">
            
            {/* Top Page Header Banner */}
            <div className="text-center space-y-3 sm:space-y-4 animate-slide-up mt-4 sm:mt-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-900 text-xs sm:text-sm font-semibold mb-1 shadow-2xs">
                    <Scroll size={15} className="text-orange-800" />
                    <span>{t('ঐতিহাসিক দলিল ও বংশবৃত্তান্ত (পৃষ্ঠা ১১–২০)', 'Historical Records & Lineage Annals (pp. 11–20)')}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-orange-950 tracking-tight">
                    {t('বাড়ৈ বংশের সংক্ষিপ্ত ইতিহাস', 'Brief History of the Barai Clan')}
                </h1>
                <p className="text-base sm:text-xl text-stone-600 font-light max-w-2xl mx-auto leading-relaxed">
                    {t('ভগবান চন্দ্র বাড়ৈর অমর ঐতিহ্য ও জ্ঞাতিবর্গের শতবর্ষের গৌরবময় ইতিহাস', 'The Eternal Legacy of Bhagoban Chandra Barai & Clan Century-old Annals')}
                </p>
            </div>

            {/* Admin Floating Control Bar */}
            {isAdmin && (
                <div className="bg-gradient-to-r from-orange-100/90 via-amber-50 to-orange-100/90 border border-orange-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up">
                    <div className="flex items-center gap-2.5 text-orange-900 text-xs sm:text-sm font-semibold">
                        <span className="p-1.5 bg-orange-800 text-white rounded-lg shadow-2xs">
                            <ShieldCheck size={16} />
                        </span>
                        <div>
                            <span>{t('অ্যাডমিন প্যানেল: ইতিহাস ও ঐতিহ্য পরিচালনা', 'Admin Panel: Heritage Content Management')}</span>
                            <span className="block text-[11px] font-normal text-stone-600">
                                {t('আপনি যেকোনো অধ্যায় যোগ, সম্পাদনা ও মুছে ফেলতে পারবেন', 'You can add, edit, or delete any history chapter')}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-800 hover:bg-orange-900 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all cursor-pointer w-full sm:w-auto justify-center"
                    >
                        <Plus size={16} />
                        <span>{t('নতুন অধ্যায়/অনুচ্ছেদ যোগ করুন', 'Add New Chapter')}</span>
                    </button>
                </div>
            )}

            {/* Alert Notifications */}
            {alertMessage && (
                <div className={`p-4 rounded-xl flex items-center justify-between shadow-xs border transition-all animate-slide-up text-sm font-medium ${
                    alertMessage.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <div className="flex items-center gap-2.5">
                        {alertMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{alertMessage.text}</span>
                    </div>
                    <button 
                        onClick={() => setAlertMessage(null)}
                        className="text-stone-400 hover:text-stone-700 text-sm font-bold ml-2 cursor-pointer"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Interactive Chapter Quick Jump Filter Bar */}
            {!loading && historyRecords.length > 0 && (
                <div className="bg-white/80 backdrop-blur-xs p-2 rounded-2xl border border-orange-100 shadow-2xs overflow-x-auto scrollbar-none flex items-center gap-1.5">
                    <button
                        onClick={() => setSelectedChapterId('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                            selectedChapterId === 'all'
                                ? 'bg-orange-800 text-white shadow-xs'
                                : 'text-stone-600 hover:text-orange-900 hover:bg-orange-50'
                        }`}
                    >
                        {t('📖 সমগ্র ইতিহাস (এক সাথে)', '📖 Full History (All Chapters)')}
                    </button>

                    {historyRecords.map((rec, idx) => {
                        const chapterTitle = isBn 
                            ? (rec.title_bn || rec.title_en || `অধ্যায় ${idx + 1}`) 
                            : (rec.title_en || rec.title_bn || `Chapter ${idx + 1}`);
                        
                        // Shorten title for tab pill
                        const shortTitle = chapterTitle.length > 25 ? `${chapterTitle.substring(0, 25)}...` : chapterTitle;
                        const isSelected = selectedChapterId === String(rec.id);

                        return (
                            <button
                                key={rec.id}
                                onClick={() => setSelectedChapterId(String(rec.id))}
                                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                                    isSelected
                                        ? 'bg-orange-800 text-white shadow-xs font-bold'
                                        : 'text-stone-600 hover:text-orange-900 hover:bg-orange-50'
                                }`}
                                title={chapterTitle}
                            >
                                <span className="opacity-70 mr-1.5 font-mono">#{idx + 1}</span>
                                <span>{shortTitle}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main Content Box */}
            <div className="bg-white p-6 sm:p-10 md:p-12 rounded-3xl shadow-sm border border-orange-100/80 animate-slide-up relative" style={{ animationDelay: '0.15s' }}>
                
                {/* Scroll Icon Ornament */}
                <div className="flex justify-center mb-8">
                    <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-100/80 shadow-2xs group hover:scale-105 transition-transform duration-300">
                        <Scroll className="h-12 w-12 sm:h-14 sm:w-14 text-orange-800 animate-pulse" />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-500">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-800" />
                        <p className="text-sm font-medium">{t('ইতিহাসের পাতা লোড হচ্ছে...', 'Loading historical narrative...')}</p>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="py-10 text-center space-y-3">
                        <p className="text-red-600 font-medium text-sm">{error}</p>
                        <button
                            onClick={fetchHistory}
                            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            {t('পুনরায় চেষ্টা করুন', 'Try Again')}
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && historyRecords.length === 0 && (
                    <div className="py-12 text-center space-y-4">
                        <BookOpen className="h-12 w-12 mx-auto text-stone-300" />
                        <p className="text-stone-500 font-medium text-base">
                            {t('এখনো কোনো ঐতিহাসিক বিবরণ যোগ করা হয়নি।', 'No historical records added yet.')}
                        </p>
                        {isAdmin && (
                            <button
                                onClick={handleOpenAdd}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-800 hover:bg-orange-900 text-white rounded-xl text-sm font-bold shadow transition-all cursor-pointer active:scale-95"
                            >
                                <Plus size={16} />
                                <span>{t('প্রথম অনুচ্ছেদটি যোগ করুন', 'Add First Chapter')}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* History Content Records */}
                {!loading && !error && displayedRecords.length > 0 && (
                    <div className="space-y-12 sm:space-y-14">
                        {displayedRecords.map((record, index) => {
                            const title = isBn 
                                ? (record.title_bn || record.title_en) 
                                : (record.title_en || record.title_bn);
                            
                            const content = isBn 
                                ? (record.content_bn || record.content_en) 
                                : (record.content_en || record.content_bn);

                            return (
                                <article
                                    key={record.id}
                                    id={`chapter-${record.id}`}
                                    className={`relative transition-all duration-300 ${
                                        isAdmin 
                                            ? 'p-4 sm:p-6 rounded-2xl border border-transparent hover:border-orange-200/80 hover:bg-orange-50/30 hover:shadow-2xs group' 
                                            : ''
                                    }`}
                                >
                                    {/* Admin Action Header Bar */}
                                    {isAdmin && (
                                        <div className="flex items-center justify-between gap-2 mb-4 pb-2.5 border-b border-orange-100/60">
                                            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                                                <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-md font-mono text-[11px] text-stone-700 font-bold">
                                                    #{record.display_order ?? (index + 1)}
                                                </span>
                                                {record.is_lead && (
                                                    <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-900 rounded-md text-[11px] font-semibold">
                                                        {t('মূল ভূমিকা', 'Lead Chapter')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(record)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-orange-100 text-orange-800 hover:text-orange-950 border border-orange-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-90"
                                                    title={t('সম্পাদনা করুন', 'Edit Chapter')}
                                                >
                                                    <Edit2 size={13} />
                                                    <span>{t('সম্পাদনা', 'Edit')}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleOpenDelete(record)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-800 border border-red-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-90"
                                                    title={t('মুছে ফেলুন', 'Delete Chapter')}
                                                >
                                                    <Trash2 size={13} />
                                                    <span>{t('মুছুন', 'Delete')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Chapter Heading (if present) */}
                                    {title && (
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-orange-800 font-sans tracking-wide uppercase mb-1">
                                                <span>{t(`অধ্যায় ${record.display_order ?? (index + 1)}`, `Chapter ${record.display_order ?? (index + 1)}`)}</span>
                                            </div>
                                            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-orange-950 border-b border-orange-100 pb-2.5 tracking-tight leading-snug">
                                                {title}
                                            </h2>
                                        </div>
                                    )}

                                    {/* Formatted Content with Rhymes & Metrics */}
                                    {renderFormattedContent(content, record.is_lead)}
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Footer Citation / Reference Note */}
                <div className="mt-14 pt-6 border-t border-orange-100/80 text-center text-xs text-stone-500 font-sans flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-orange-900 font-serif">
                        <BookOpen size={16} />
                        <span>{t('উৎস: শ্রী শ্রী ভগবান চন্দ্র বাড়ৈ বংশের সংবিধান ও পরিচিতি (পৃষ্ঠা ১১–২০)', 'Source: Constitution & Directory of Sri Sri Bhagoban Chandra Barai Lineage (pp. 11–20)')}</span>
                    </div>
                    <div className="text-stone-400">
                        {t('সর্বস্বত্ব সংরক্ষিত © বাড়ৈ বংশের ইতিবৃত্ত', 'All rights reserved © Barai Ancestral Chronicle')}
                    </div>
                </div>
            </div>

            {/* Add / Edit History Form Modal */}
            <HistoryFormModal
                isOpen={isFormModalOpen}
                initialData={editingRecord}
                nextOrder={historyRecords.length + 1}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingRecord(null);
                }}
                onSuccess={() => {
                    fetchHistory();
                    setAlertMessage({
                        type: 'success',
                        text: editingRecord 
                            ? t('ঐতিহাসিক অধ্যায়টি সফলভাবে হালনাগাদ করা হয়েছে।', 'History chapter updated successfully.')
                            : t('নতুন ঐতিহাসিক অধ্যায়টি সফলভাবে যোগ করা হয়েছে।', 'New history chapter added successfully.')
                    });
                }}
            />

            {/* Permanent Deletion Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
                onConfirm={handleConfirmDelete}
                title={t('⚠️ ঐতিহাসিক অধ্যায় মুছবেন?', '⚠️ Delete History Chapter?')}
                message={t(
                    `আপনি কি নিশ্চিত যে এই অধ্যায়টি চিরতরে মুছে ফেলতে চান? মুছে ফেলার পর এটি ইতিহাস পৃষ্ঠা থেকে স্থায়ীভাবে অদৃশ্য হয়ে যাবে।`,
                    `Are you sure you want to delete this history chapter? Once deleted, it will be removed permanently from the history page.`
                )}
                confirmText={t('মুছে ফেলুন', 'Delete')}
                requireCheckbox={false}
                isPermanent={true}
            />
        </div>
    );
};

export default History;
