import React, { useState, useEffect } from 'react';
import { Award, GraduationCap, Flame, Star, Plus, MapPin, Pencil, Trash2, Building2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import EminentFormModal from '../components/EminentFormModal';
import BrilliantStudentRequestModal from '../components/BrilliantStudentRequestModal';
import Profile from './Profile';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const categories = [
    { id: 'কৃতি শিক্ষার্থী', bnLabel: 'কৃতি শিক্ষার্থী', enLabel: 'Brilliant Students', icon: GraduationCap, bg: 'from-blue-50 to-indigo-100', badge: 'bg-blue-200 text-blue-900', textMain: 'text-blue-950', textSub: 'text-blue-800', tagBadge: 'bg-blue-900/10 border-blue-900/20 text-blue-900' },
    { id: 'মরণোত্তর জ্ঞাতি', bnLabel: 'মরণোত্তর জ্ঞাতি', enLabel: 'Posthumous Honors', icon: Flame, bg: 'from-green-100 to-emerald-200', badge: 'bg-emerald-200 text-emerald-900', textMain: 'text-emerald-950', textSub: 'text-emerald-800', tagBadge: 'bg-emerald-900/10 border-emerald-900/20 text-emerald-900' },
    { id: 'আজীবন জ্ঞাতি', bnLabel: 'আজীবন জ্ঞাতি', enLabel: 'Lifetime Honors', icon: Star, bg: 'from-amber-500 to-orange-700', badge: 'bg-amber-100 text-amber-800', textMain: 'text-white', textSub: 'text-white/80', tagBadge: 'bg-white/20 border-white/30 text-white' }
];

const EminentFigures = () => {
    const { user, isAdmin } = useAuth();
    const { t, isBn, formatOccupation, formatName, formatAchievement } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const [figures, setFigures] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState(() => {
        const param = searchParams.get('tab');
        if (param) {
            const found = categories.find(c => c.id === param || c.bnLabel === param || c.enLabel.toLowerCase() === param.toLowerCase());
            if (found) return found.id;
        }
        const saved = localStorage.getItem('projenitor_eminent_tab');
        if (saved && categories.some(c => c.id === saved)) {
            return saved;
        }
        return categories[0].id;
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [editingFigure, setEditingFigure] = useState(null);
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, figure: null });

    const handleTabChange = (catId) => {
        setActiveTab(catId);
        try {
            localStorage.setItem('projenitor_eminent_tab', catId);
            setSearchParams({ tab: catId }, { replace: true });
        } catch (e) {
            console.error(e);
        }
    };

    const handleViewProfile = (figure) => {
        setSelectedMemberId(figure.member_id || figure.id);
    };

    const fetchFigures = async () => {
        try {
            setLoading(true);
            const res = await api.get('/eminent');
            setFigures(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFigures();
    }, []);

    useEffect(() => {
        const param = searchParams.get('tab');
        if (param) {
            const found = categories.find(c => c.id === param || c.bnLabel === param || c.enLabel.toLowerCase() === param.toLowerCase());
            if (found && found.id !== activeTab) {
                setActiveTab(found.id);
            }
        }
    }, [searchParams]);

    const handleDeleteClick = (figure, e) => {
        if (e) e.stopPropagation();
        setDeleteConfirm({ isOpen: true, figure });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.figure) return;
        try {
            await api.delete(`/eminent/${deleteConfirm.figure.id}`);
            setDeleteConfirm({ isOpen: false, figure: null });
            fetchFigures();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleEdit = (figure) => {
        setEditingFigure(figure);
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setEditingFigure(null);
        setIsModalOpen(true);
    };

    const displayFigures = Array.isArray(figures) ? figures.filter(f => (f.category || '').trim() === (activeTab || '').trim()) : [];
    const currentCategoryInfo = categories.find(c => c.id === activeTab) || categories[0];
    const Icon = currentCategoryInfo.icon;
    const activeCategoryLabel = isBn ? currentCategoryInfo.bnLabel : currentCategoryInfo.enLabel;

    return (
        <div className="min-h-screen bg-[#fffcf5] pb-20 font-sans">
            {/* Header Area */}
            <div className={`bg-gradient-to-br ${currentCategoryInfo.bg} ${currentCategoryInfo.textMain} pt-10 pb-16 px-6 relative overflow-hidden transition-colors duration-700`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md ${currentCategoryInfo.tagBadge}`}>
                            <Award size={14} /> {t('কৃতি ও স্মরণীয় ব্যক্তিত্ব', 'Eminent Figures & Recognitions')}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-4 drop-shadow-md">
                            {activeCategoryLabel}
                        </h1>
                        <p className={`${currentCategoryInfo.textSub} max-w-xl text-lg font-light`}>
                            {t('যাঁদের অবদান, মেধা ও আত্মত্যাগ আমাদের বংশের মুখ উজ্জ্বল করেছে।', 'Honoring the exceptional individuals whose achievements and legacy illuminate our community\'s history.')}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleCreateNew}
                                className="group bg-white hover:bg-stone-50 px-6 py-3 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 whitespace-nowrap cursor-pointer"
                            >
                                <Plus size={20} className="text-orange-600 group-hover:rotate-90 transition-transform" />
                                <span className="text-orange-900">{t('ব্যক্তিত্ব যুক্ত করুন', 'Add Figure')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-20">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg p-1.5 sm:p-2 flex flex-col sm:flex-row justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 border border-stone-100">
                    {categories.map(cat => {
                        const TabIcon = cat.icon;
                        const isActive = activeTab === cat.id;
                        const catLabel = isBn ? cat.bnLabel : cat.enLabel;
                        const catCount = Array.isArray(figures) ? figures.filter(f => (f.category || '').trim() === (cat.id || '').trim()).length : 0;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleTabChange(cat.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer ${isActive
                                    ? 'bg-orange-50 text-orange-800 shadow-sm border border-orange-100 scale-[1.01] sm:scale-[1.02]'
                                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                                    }`}
                            >
                                <TabIcon size={18} className={isActive ? 'animate-pulse' : ''} />
                                <span>{catLabel}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${isActive
                                    ? 'bg-orange-200/80 text-orange-900 border border-orange-300/50'
                                    : catCount > 0
                                        ? 'bg-stone-100 text-stone-700'
                                        : 'bg-stone-100 text-stone-400'
                                    }`}>
                                    {catCount}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Brilliant Student Encouragement Banner */}
                {activeTab === 'কৃতি শিক্ষার্থী' && (
                    <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-blue-400/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                                <GraduationCap className="w-6 h-6 text-yellow-300" />
                            </div>
                            <div>
                                <h4 className="font-serif font-bold text-base sm:text-lg text-white">
                                    {t('আপনার পরিবারের সন্তান কি কৃতি শিক্ষার্থী?', 'Is someone in your family an exceptional student?')}
                                </h4>
                                <p className="text-xs sm:text-sm text-blue-200/90 font-light mt-0.5">
                                    {t(
                                        'এসএসসি/এইচএসসিতে GPA 5.00, পাবলিক বিশ্ববিদ্যালয়/মেডিকেল/বুয়েটে চান্স বা মেধা বৃত্তির তথ্য প্রদান করে কৃতি শিক্ষার্থী হিসেবে স্বীকৃতির আবেদন করুন।',
                                        'Submit proof of GPA 5.00, university admission, or scholarships to be recognized as an Eminent Figure.'
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 shrink-0 active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <GraduationCap size={16} />
                            <span>{t('এখনই আবেদন করুন', 'Apply Now')}</span>
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-3xl p-16 shadow-lg text-center text-stone-400 animate-pulse border border-stone-100">
                        {t('তথ্য লোড হচ্ছে...', 'Loading recognitions...')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {displayFigures.length > 0 ? (
                            displayFigures.map(figure => (
                                <div key={figure.id} className="group bg-white rounded-2xl sm:rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative focus-within:ring-2 ring-orange-400 flex flex-col justify-between">
                                    {/* Action Buttons Overlay — Admin Only */}
                                    {isAdmin && (
                                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur px-2 py-1 rounded-xl shadow-xs border border-stone-200/60">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(figure);
                                                }} 
                                                className="p-1.5 text-stone-500 hover:text-orange-600 transition-colors cursor-pointer" 
                                                title={t('সম্পাদনা', 'Edit')}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <div className="w-px bg-stone-200"></div>
                                            <button 
                                                onClick={(e) => handleDeleteClick(figure, e)} 
                                                className="p-1.5 text-stone-500 hover:text-red-600 transition-colors cursor-pointer" 
                                                title={t('মুছুন', 'Remove')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div 
                                        onClick={() => handleViewProfile(figure)} 
                                        className="block p-4 sm:p-5 md:p-6 cursor-pointer"
                                    >
                                    {(() => {
                                        const figureDisplayName = formatName(figure);

                                        // Resolve reason and institution
                                        let displayReason = figure.reason || '';
                                        let displayInstitution = figure.institution || '';

                                        if ((!displayReason || !displayInstitution) && figure.title) {
                                            const parts = figure.title.split(' - ').map(p => p.trim()).filter(Boolean);
                                            if (!displayReason && parts.length > 0) {
                                                displayReason = parts[0];
                                            }
                                            if (!displayInstitution && parts.length > 1) {
                                                displayInstitution = parts.slice(1).join(' - ');
                                            }
                                            if (!displayReason && !displayInstitution) {
                                                displayReason = figure.title;
                                            }
                                        }

                                        // Resolve address from member profile (matching Profile card: village, upazila, district)
                                        const locationAddress = [figure.village, figure.upazila, figure.district].filter(Boolean).join(', ');
                                        const profileAddress = locationAddress ||
                                            figure.present_address?.trim() ||
                                            figure.permanent_address?.trim() ||
                                            '';

                                        return (
                                            <>
                                                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                                                    <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                                        {figure.profile_image_url ? (
                                                            <img src={figure.profile_image_url} alt={figureDisplayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 font-serif font-bold text-lg sm:text-xl">
                                                                {figureDisplayName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-serif font-bold text-base sm:text-lg text-stone-800 leading-tight mb-1 group-hover:text-orange-700 transition-colors truncate">
                                                            {figureDisplayName}
                                                        </h3>
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${currentCategoryInfo.badge}`}>
                                                            {activeCategoryLabel}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 2-line Recognition Details: Reason & Institution */}
                                                {(displayReason || displayInstitution || figure.title) && (
                                                    <div className="bg-orange-50/80 text-orange-950 p-2.5 sm:p-3 rounded-xl border border-orange-200/80 mb-3 sm:mb-4 shadow-2xs group-hover:border-orange-300 transition-all space-y-1.5">
                                                        {displayReason && (
                                                            <div className="flex items-start gap-2">
                                                                <GraduationCap size={15} className="shrink-0 mt-0.5 text-orange-800" />
                                                                <span className="font-bold text-xs sm:text-sm text-stone-900 leading-snug">
                                                                    {formatAchievement(displayReason)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {displayInstitution && (
                                                            <div className="flex items-start gap-2 text-stone-600">
                                                                <Building2 size={15} className="shrink-0 mt-0.5 text-amber-700" />
                                                                <span className="text-xs sm:text-sm leading-snug font-medium text-stone-700">
                                                                    {displayInstitution}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!displayReason && !displayInstitution && figure.title && (
                                                            <div className="text-xs sm:text-sm font-medium italic">
                                                                "{formatAchievement(figure.title)}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Profile Details: Address, Education, Occupation */}
                                                <div className="space-y-1.5 sm:space-y-2 text-xs text-stone-500">
                                                    {profileAddress ? (
                                                        <div className="flex items-start gap-2">
                                                            <MapPin size={14} className="shrink-0 mt-0.5 text-red-700" />
                                                            <span className="line-clamp-2 text-stone-700 font-medium">{profileAddress}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-stone-400">
                                                            <MapPin size={14} className="shrink-0 text-stone-300" />
                                                            <span className="italic">{t('ঠিকানা প্রোফাইলে নেই', 'Address not listed in profile')}</span>
                                                        </div>
                                                    )}

                                                    {figure.education && (
                                                        <div className="flex items-start gap-2">
                                                            <GraduationCap size={14} className="shrink-0 mt-0.5 text-stone-400" />
                                                            <span className="line-clamp-2">{figure.education}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <Award size={14} className="shrink-0 text-stone-400" />
                                                        <span className="truncate">{formatOccupation(figure.occupation) || t('পেশা উল্লেখ নেই', 'Occupation not listed')}</span>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white rounded-3xl p-16 text-center shadow-sm border border-stone-100 flex flex-col items-center">
                                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                                    <Icon size={32} className="text-stone-300" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-600 mb-2">{t('কোনো তথ্য পাওয়া যায়নি', 'No Records Found')}</h3>
                                <p className="text-stone-400 max-w-sm">
                                    {isBn
                                        ? `${activeCategoryLabel} বিভাগে এখনো কোনো সদস্য অন্তর্ভুক্ত করা হয়নি।`
                                        : `No members have been added to the ${activeCategoryLabel} category yet.`}
                                </p>
                                {Array.isArray(figures) && figures.length > 0 && (
                                    <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col items-center">
                                        <span className="text-xs text-stone-400 mb-2.5">{t('অন্যান্য বিভাগে সংরক্ষিত ব্যক্তিত্ব দেখুন:', 'View figures in other categories:')}</span>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {categories.filter(c => c.id !== activeTab).map(c => {
                                                const count = figures.filter(f => f.category === c.id).length;
                                                if (count === 0) return null;
                                                return (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => handleTabChange(c.id)}
                                                        className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200/80 text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <span>{isBn ? c.bnLabel : c.enLabel}</span>
                                                        <span className="px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-950 text-[10px] font-bold">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {isAdmin && (
                                    <button onClick={handleCreateNew} className="mt-6 text-orange-600 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                                        <Plus size={16} /> {t('প্রথম ব্যক্তিত্ব যুক্ত করুন', 'Add the first one')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <EminentFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchFigures()}
                initialData={editingFigure}
                categories={categories}
                activeCategory={activeTab}
            />

            <BrilliantStudentRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSuccess={() => fetchFigures()}
            />

            {selectedMemberId && (
                <Profile
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                />
            )}

            {/* Custom Centered Deletion Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, figure: null })}
                onConfirm={handleConfirmDelete}
                title={t('সম্মাননা মুছে ফেলা নিশ্চিত করুন', 'Confirm Removing Recognition')}
                message={
                    deleteConfirm.figure
                        ? (isBn
                            ? `আপনি কি নিশ্চিতভাবে "${formatName(deleteConfirm.figure)}"-এর সম্মাননাটি মুছে ফেলতে চান?`
                            : `Are you sure you want to remove the recognition for "${formatName(deleteConfirm.figure)}"?`)
                        : t('আপনি কি নিশ্চিতভাবে এই সম্মাননাটি মুছে ফেলতে চান?', 'Are you sure you want to remove this recognition?')
                }
                confirmText={t('মুছে ফেলুন', 'Remove')}
                requireCheckbox={false} 
            />
        </div>
    );
};

export default EminentFigures;
