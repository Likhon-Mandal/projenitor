import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import MemberSelector from './MemberSelector';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const FM_CSS = `
.fm-skin :is(input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color]):not(.bg-transparent), select:not(.bg-transparent), textarea:not(.bg-transparent)) {
    border-radius: .75rem;
    background-color: rgb(var(--surface));
    color: rgb(var(--tx-stone-800));
    transition: border-color .15s ease, box-shadow .15s ease;
}
.fm-skin :is(input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color]), select) { min-height: 44px; }
.fm-skin :is(input, select, textarea):focus { outline: none; border-color: rgb(var(--bd-orange-500)); box-shadow: 0 0 0 4px rgb(var(--bd-orange-500) / .16); }
.fm-skin :is(input, textarea)::placeholder { color: rgb(var(--tx-stone-400)); }
.fm-skin select {
    -webkit-appearance: none; appearance: none; padding-right: 2.25rem;
    background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
    background-position: calc(100% - 18px) 52%, calc(100% - 13px) 52%;
    background-size: 5px 5px; background-repeat: no-repeat;
}
.fm-skin :is(input, select, textarea):disabled { opacity: .6; cursor: not-allowed; }
@keyframes fm-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.fm-rise { animation: fm-rise .35s ease-out both; }
@media (prefers-reduced-motion: reduce) { .fm-skin *, .fm-rise { transition: none !important; animation: none !important; } }
`;

const CommitteeFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { formatName, t } = useLanguage();
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isCurrent, setIsCurrent] = useState(true);

    // Array of { id: uniqueKey, members: [], role: '' }
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name || '');
                setStartDate(initialData.start_date ? initialData.start_date.split('T')[0] : '');
                setEndDate(initialData.end_date ? initialData.end_date.split('T')[0] : '');
                setIsCurrent(initialData.is_current || false);

                if (initialData.members && initialData.members.length > 0) {
                    const grouped = {};
                    initialData.members.forEach(m => {
                        if (!grouped[m.role]) grouped[m.role] = [];
                        grouped[m.role].push({
                            ...m,
                            id: m.member_id || m.id,
                            full_name: m.full_name,
                            name_bangla: m.name_bangla,
                            name_english: m.name_english,
                            profile_image_url: m.profile_image_url,
                            occupation: m.occupation,
                            district: m.district
                        });
                    });
                    const newRoles = Object.keys(grouped).map((roleName, i) => ({
                        id: Date.now() + i,
                        role: roleName,
                        members: grouped[roleName]
                    }));
                    setRoles(newRoles);
                } else {
                    setRoles([]);
                }
            } else {
                // Reset form
                setName('');
                setStartDate('');
                setEndDate('');
                setIsCurrent(true);
                setRoles([
                    { id: Date.now() + 1, members: [], role: 'সভাপতি' },
                    { id: Date.now() + 2, members: [], role: 'সহ-সভাপতি' },
                    { id: Date.now() + 3, members: [], role: 'সাধারণ সম্পাদক' },
                    { id: Date.now() + 4, members: [], role: 'যুগ্ম-সাধারণ সম্পাদক' },
                    { id: Date.now() + 5, members: [], role: 'সাংগঠনিক সম্পাদক' },
                    { id: Date.now() + 6, members: [], role: 'কোষাধ্যক্ষ' },
                    { id: Date.now() + 7, members: [], role: 'সাহিত্য ও সাংস্কৃতিক সম্পাদক' },
                    { id: Date.now() + 8, members: [], role: 'আইন বিষয়ক সম্পাদক' },
                    { id: Date.now() + 9, members: [], role: 'যুব বিষয়ক সম্পাদক' },
                    { id: Date.now() + 10, members: [], role: 'ধর্ম বিষয়ক সম্পাদক' },
                    { id: Date.now() + 11, members: [], role: 'প্রচার সম্পাদক' },
                    { id: Date.now() + 12, members: [], role: 'দপ্তর সম্পাদক' },
                    { id: Date.now() + 13, members: [], role: 'তথ্য ও যোগাযোগ প্রযুক্তি সম্পাদক' },
                    { id: Date.now() + 14, members: [], role: 'শিক্ষা ও স্বাস্থ্য বিষয়ক সম্পাদক' }
                ]);
            }
            setLoading(false);
        }
    }, [isOpen, initialData]);

    const handleAddRole = () => {
        setRoles([...roles, { id: Date.now(), members: [], role: 'Member' }]);
    };

    const handleRemoveRole = (id) => {
        setRoles(roles.filter(r => r.id !== id));
    };

    const handleRoleChange = (id, newRole) => {
        setRoles(roles.map(r => r.id === id ? { ...r, role: newRole } : r));
    };

    const handleAddMemberToRole = (roleId, member) => {
        if (!member) return;
        const targetId = member.id || member.member_id;
        setRoles(roles.map(r => {
            if (r.id === roleId) {
                if (r.members.find(m => (m.id || m.member_id) === targetId)) return r; // prevent duplicates
                return { ...r, members: [...r.members, { ...member, id: targetId }] };
            }
            return r;
        }));
    };

    const handleRemoveMemberFromRole = (roleId, memberId) => {
        setRoles(roles.map(r => {
            if (r.id === roleId) {
                return { ...r, members: r.members.filter(m => (m.id || m.member_id) !== memberId) };
            }
            return r;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) return alert("Committee name is required");
        const validRoles = roles.filter(r => r.members.length > 0 && r.role.trim());
        if (validRoles.length === 0) return alert("Please assign at least one member with a role.");

        setLoading(true);

        const payloadMembers = [];
        let orderIdx = 0;
        validRoles.forEach(r => {
            r.members.forEach(m => {
                const targetMemberId = m.member_id || m.id;
                if (targetMemberId) {
                    payloadMembers.push({
                        member_id: targetMemberId,
                        role: r.role.trim(),
                        order_index: orderIdx++
                    });
                }
            });
        });

        const payload = {
            name: name.trim(),
            start_date: startDate || null,
            end_date: endDate || null,
            is_current: isCurrent,
            members: payloadMembers
        };

        try {
            if (initialData) {
                await api.put(`/committee/${initialData.id}`, payload);
            } else {
                await api.post('/committee', payload);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save committee:', error);
            alert(error.response?.data?.error || error.message || 'Server error updating committee');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 app-sheet z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"></div>

            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up border border-orange-100"
                onClick={e => e.stopPropagation()}
            >
                <style>{FM_CSS}</style>
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-800 to-amber-700 px-5 sm:px-6 py-4 flex justify-between items-center gap-3 text-white shrink-0">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-white">{initialData ? t('কমিটি সম্পাদনা', 'Edit Committee') : t('নতুন কমিটি তৈরি করুন', 'Create New Committee')}</h2>
                    <button type="button" onClick={onClose} aria-label={t('বন্ধ করুন', 'Close')} className="shrink-0 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {/* Form wrapping scrollable body and pinned footer */}
                <form id="committee-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Form Body - Scrollable */}
                    <div className="fm-skin fm-rise p-5 sm:p-6 overflow-y-auto overscroll-contain custom-scroll flex-1 min-h-0 space-y-6">

                        {/* Basic Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-stone-700 mb-1">Committee Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Executive Committee 2026-2028"
                                    className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-stone-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                    <span className="ml-3 text-sm font-bold text-stone-700 uppercase tracking-wider">Set as Current Running Committee</span>
                                </label>
                            </div>
                        </div>

                        {/* Members Assignment */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-stone-800">Assign Members</h3>
                                    <p className="text-xs text-stone-500">Search existing family members to assign them roles.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddRole}
                                    className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-stone-200 cursor-pointer"
                                >
                                    <Plus size={14} /> Add Role Slot
                                </button>
                            </div>

                            <div className="space-y-3">
                                {roles.map((roleObj, index) => (
                                    <div key={roleObj.id} className="flex flex-col bg-white border border-stone-200 p-4 rounded-xl hover:border-orange-200 transition-colors shadow-sm gap-4">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-3 w-4/5 sm:w-2/3">
                                                <div className="text-stone-300 font-bold w-6 text-center">{index + 1}</div>
                                                <input
                                                    type="text"
                                                    value={roleObj.role}
                                                    onChange={e => handleRoleChange(roleObj.id, e.target.value)}
                                                    placeholder="Role Name (e.g. Vice President)"
                                                    className="w-full border-b border-stone-200 px-2 py-1 text-base font-bold text-orange-900 focus:border-orange-500 outline-none bg-transparent"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRole(roleObj.id)}
                                                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                title="Remove this role entirely"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="pl-9 space-y-2">
                                            {(roleObj.members || []).map(m => {
                                                const memberDisplayName = formatName(m);
                                                return (
                                                <div key={m.id || m.member_id} className="flex items-center justify-between bg-orange-50/50 border border-orange-100 p-2 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-200 shrink-0 flex items-center justify-center">
                                                            {m.profile_image_url ?
                                                                <img src={m.profile_image_url} alt={memberDisplayName} className="w-full h-full object-cover" /> :
                                                                <span className="font-serif font-bold text-stone-500 text-sm">{(memberDisplayName || '?').charAt(0)}</span>
                                                            }
                                                        </div>
                                                        <span className="text-sm font-bold text-stone-800">{memberDisplayName}</span>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveMemberFromRole(roleObj.id, m.id || m.member_id)} className="text-stone-400 hover:text-red-500 hover:bg-red-100 p-1.5 rounded transition-colors cursor-pointer" title="Remove Member">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                );
                                            })}

                                            <div className="mt-2 pt-2 border-t border-stone-100/50">
                                                <MemberSelector
                                                    label=""
                                                    onSelect={(m) => handleAddMemberToRole(roleObj.id, m)}
                                                    selectedMember={null}
                                                    placeholder="Add member to this role..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {roles.length === 0 && (
                                    <div className="text-center py-6 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                                        No roles assigned yet. Click "Add Role Slot".
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer Controls - Always pinned at bottom */}
                    <div className="shrink-0 border-t border-stone-100 px-4 py-3 sm:p-4 bg-orange-50/60 grid grid-cols-2 sm:flex sm:justify-end gap-2.5 sm:gap-3 z-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[46px] sm:min-h-0 justify-center flex items-center px-5 py-2 text-stone-600 font-bold bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors text-sm cursor-pointer"
                            disabled={loading}
                        >
                            {t('বাতিল', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="min-h-[46px] sm:min-h-0 justify-center px-6 py-2 bg-gradient-to-r from-orange-700 to-red-800 hover:brightness-110 text-white font-bold rounded-xl shadow-md shadow-orange-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
                        >
                            {loading ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : <><CheckCircle2 size={18} /> {initialData ? t('কমিটি হালনাগাদ', 'Update Committee') : t('কমিটি সংরক্ষণ', 'Save Committee')}</>}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default CommitteeFormModal;
