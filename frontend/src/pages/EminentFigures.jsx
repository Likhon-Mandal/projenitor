import React, { useState, useEffect } from 'react';
import { Award, GraduationCap, Flame, Star, Plus, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import EminentFormModal from '../components/EminentFormModal';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const categories = [
    { id: 'কৃতি শিক্ষার্থী', label: 'কৃতি শিক্ষার্থী', icon: GraduationCap, bg: 'from-blue-50 to-indigo-100', badge: 'bg-blue-200 text-blue-900', textMain: 'text-blue-950', textSub: 'text-blue-800', tagBadge: 'bg-blue-900/10 border-blue-900/20 text-blue-900' },
    { id: 'মরণোত্তর জ্ঞাতি', label: 'মরণোত্তর জ্ঞাতি', icon: Flame, bg: 'from-green-100 to-emerald-200', badge: 'bg-emerald-200 text-emerald-900', textMain: 'text-emerald-950', textSub: 'text-emerald-800', tagBadge: 'bg-emerald-900/10 border-emerald-900/20 text-emerald-900' },
    { id: 'আজীবন জ্ঞাতি', label: 'আজীবন জ্ঞাতি', icon: Star, bg: 'from-amber-500 to-orange-700', badge: 'bg-amber-100 text-amber-800', textMain: 'text-white', textSub: 'text-white/80', tagBadge: 'bg-white/20 border-white/30 text-white' }
];

const EminentFigures = () => {
    const { isAdmin } = useAuth();
    const [figures, setFigures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(categories[0].id);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFigure, setEditingFigure] = useState(null);

    const fetchFigures = async () => {
        try {
            setLoading(true);
            const res = await api.get('/eminent');
            setFigures(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFigures();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this recognition?")) return;
        try {
            await api.delete(`/eminent/${id}`);
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

    const displayFigures = figures.filter(f => f.category === activeTab);
    const currentCategoryInfo = categories.find(c => c.id === activeTab);
    const Icon = currentCategoryInfo.icon;

    return (
        <div className="min-h-screen bg-[#fffcf5] pb-20 font-sans">
            {/* Header Area */}
            <div className={`bg-gradient-to-br ${currentCategoryInfo.bg} ${currentCategoryInfo.textMain} pt-10 pb-16 px-6 relative overflow-hidden transition-colors duration-700`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md ${currentCategoryInfo.tagBadge}`}>
                            <Award size={14} /> Eminent Figures & Recognitions
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-4 drop-shadow-md">
                            {currentCategoryInfo.label}
                        </h1>
                        <p className={`${currentCategoryInfo.textSub} max-w-xl text-lg font-light`}>
                            Honoring the exceptional individuals whose achievements and legacy illuminate our community's history.
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={handleCreateNew}
                            className="group bg-white hover:bg-stone-50 px-6 py-3 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={20} className="text-orange-600 group-hover:rotate-90 transition-transform" />
                            <span className="text-orange-900">Add Figure</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-col sm:flex-row justify-center gap-2 mb-12 border border-stone-100">
                    {categories.map(cat => {
                        const TabIcon = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${isActive
                                    ? 'bg-orange-50 text-orange-800 shadow-sm border border-orange-100 scale-[1.02]'
                                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                                    }`}
                            >
                                <TabIcon size={18} className={isActive ? 'animate-pulse' : ''} />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-3xl p-16 shadow-lg text-center text-stone-400 animate-pulse border border-stone-100">
                        Loading recognitions...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayFigures.length > 0 ? (
                            displayFigures.map(figure => (
                                <div key={figure.id} className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative focus-within:ring-2 ring-orange-400">
                                    {/* Action Buttons Overlay — Admin Only */}
                                    {isAdmin && (
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur px-2 py-1 rounded-xl shadow-sm border border-stone-100">
                                            <button onClick={() => handleEdit(figure)} className="p-1.5 text-stone-500 hover:text-orange-600 transition-colors" title="Edit">
                                                <Pencil size={14} />
                                            </button>
                                            <div className="w-px bg-stone-200"></div>
                                            <button onClick={() => handleDelete(figure.id)} className="p-1.5 text-stone-500 hover:text-red-600 transition-colors" title="Remove">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <Link to={`/member/${figure.member_id}`} className="block p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                                {figure.profile_image_url ? (
                                                    <img src={figure.profile_image_url} alt={figure.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 font-serif font-bold text-xl">
                                                        {figure.full_name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-bold text-lg text-stone-800 leading-tight mb-1 group-hover:text-orange-700 transition-colors">
                                                    {figure.full_name.replace(' (Root)', '')}
                                                </h3>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${currentCategoryInfo.badge}`}>
                                                    {figure.category}
                                                </span>
                                            </div>
                                        </div>

                                        {figure.title && (
                                            <div className="bg-orange-50/50 text-orange-900 text-sm p-3 rounded-xl border border-orange-100 mb-4 font-medium italic">
                                                "{figure.title}"
                                            </div>
                                        )}

                                        <div className="space-y-2 text-xs text-stone-500">
                                            {figure.education && (
                                                <div className="flex items-start gap-2">
                                                    <GraduationCap size={14} className="shrink-0 mt-0.5 text-stone-400" />
                                                    <span className="line-clamp-2">{figure.education}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Award size={14} className="shrink-0 text-stone-400" />
                                                <span className="truncate">{figure.occupation || 'Occupation not listed'}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white rounded-3xl p-16 text-center shadow-sm border border-stone-100 flex flex-col items-center">
                                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                                    <Icon size={32} className="text-stone-300" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-600 mb-2">No Records Found</h3>
                                <p className="text-stone-400 max-w-sm">No members have been added to the {currentCategoryInfo.label} category yet.</p>
                                {isAdmin && (
                                    <button onClick={handleCreateNew} className="mt-6 text-orange-600 font-bold hover:underline flex items-center gap-1">
                                        <Plus size={16} /> Add the first one
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
        </div>
    );
};

export default EminentFigures;
