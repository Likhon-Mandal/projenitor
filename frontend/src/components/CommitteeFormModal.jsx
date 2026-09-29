import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import MemberSelector from './MemberSelector';
import api from '../api/api';

const CommitteeFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
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
                            id: m.member_id,
                            full_name: m.full_name,
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
        setRoles(roles.map(r => {
            if (r.id === roleId) {
                if (r.members.find(m => m.id === member.id)) return r; // prevent duplicates
                return { ...r, members: [...r.members, member] };
            }
            return r;
        }));
    };

    const handleRemoveMemberFromRole = (roleId, memberId) => {
        setRoles(roles.map(r => {
            if (r.id === roleId) {
                return { ...r, members: r.members.filter(m => m.id !== memberId) };
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
                payloadMembers.push({
                    member_id: m.id,
                    role: r.role,
                    order_index: orderIdx++
                });
            });
        });

        const payload = {
            name,
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
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-800 to-orange-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <h2 className="text-xl font-serif font-bold">{initialData ? 'Edit Committee' : 'Create New Committee'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scroll flex-grow">
                    <form id="committee-form" onSubmit={handleSubmit} className="space-y-6">

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
                                    className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-stone-200"
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
                                                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove this role entirely"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="pl-9 space-y-2">
                                            {(roleObj.members || []).map(m => (
                                                <div key={m.id} className="flex items-center justify-between bg-orange-50/50 border border-orange-100 p-2 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-200 shrink-0 flex items-center justify-center">
                                                            {m.profile_image_url ?
                                                                <img src={m.profile_image_url} alt={m.full_name} className="w-full h-full object-cover" /> :
                                                                <span className="font-serif font-bold text-stone-500 text-sm">{m.full_name.charAt(0)}</span>
                                                            }
                                                        </div>
                                                        <span className="text-sm font-bold text-stone-800">{m.full_name.replace(' (Root)', '')}</span>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveMemberFromRole(roleObj.id, m.id)} className="text-stone-400 hover:text-red-500 hover:bg-red-100 p-1.5 rounded transition-colors" title="Remove Member">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}

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

                    </form>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-stone-100 p-4 bg-stone-50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-stone-600 font-medium hover:bg-stone-200 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="committee-form"
                        disabled={loading}
                        className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : <><CheckCircle2 size={18} /> {initialData ? 'Update Committee' : 'Save Committee'}</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CommitteeFormModal;
