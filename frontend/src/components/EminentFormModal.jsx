import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import MemberSelector from './MemberSelector';
import api from '../api/api';

const EminentFormModal = ({ isOpen, onClose, onSuccess, initialData, categories, activeCategory }) => {
    const [categoryId, setCategoryId] = useState('');
    const [title, setTitle] = useState('');
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setCategoryId(initialData.category);
                setTitle(initialData.title || '');
                setMember({
                    id: initialData.member_id,
                    full_name: initialData.full_name
                });
            } else {
                setCategoryId(activeCategory || (categories.length > 0 ? categories[0].id : ''));
                setTitle('');
                setMember(null);
            }
            setLoading(false);
        }
    }, [isOpen, initialData, categories]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!member) return alert('Please select a member.');
        if (!categoryId) return alert('Please select a category.');

        setLoading(true);

        const payload = {
            member_id: member.id,
            category: categoryId,
            title: title.trim()
        };

        try {
            if (initialData) {
                await api.put(`/ eminent / ${initialData.id} `, payload);
            } else {
                await api.post('/eminent', payload);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"></div>

            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-stone-800 to-stone-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-serif font-bold">{initialData ? 'Edit Recognition' : 'Add Eminent Figure'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6">
                    <form id="eminent-form" onSubmit={handleSubmit} className="space-y-5">

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Target Member *</label>
                            {initialData ? (
                                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-bold">
                                    {member?.full_name?.replace(' (Root)', '')}
                                </div>
                            ) : (
                                <MemberSelector
                                    onSelect={(m) => setMember(m)}
                                    selectedMember={member}
                                    placeholder="Search by name or ID..."
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Recognition Category *</label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-stone-800"
                                required
                            >
                                <option value="" disabled>Select a category...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Sub-Title / Reason (Optional)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Govt Scholarship Awardee 2024"
                                className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
                            />
                        </div>

                    </form>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-stone-100 p-4 bg-stone-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-stone-600 font-bold hover:bg-stone-200 rounded-lg transition-colors border border-stone-300"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="eminent-form"
                        disabled={loading}
                        className="px-6 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : <><CheckCircle2 size={18} /> {initialData ? 'Update Record' : 'Add Recognition'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EminentFormModal;
