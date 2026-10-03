import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield, Users, RefreshCw, X, AlertCircle } from 'lucide-react';
import MemberForm from '../components/MemberForm';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const Admin = () => {
    const { t, formatName } = useLanguage();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('all');

    // MemberForm State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [initialFormData, setInitialFormData] = useState({});

    // ConfirmModal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/members');
            setMembers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setInitialFormData({
            gender: ''
        });
        setIsFormOpen(true);
    };

    const handleEdit = (member) => {
        const isSpouse = member.gender === 'Female' && (!member.father_id || member.spouse_id);
        const isMaleRoot = (!member.father_id && !member.mother_id && !isSpouse) || Boolean(member.isRoot);
        setInitialFormData({
            ...member,
            isSpouseFlag: isSpouse,
            role: isSpouse ? 'spouse' : member.role,
            isRoot: Boolean(isMaleRoot),
            gender: isMaleRoot ? 'Male' : member.gender
        });
        setIsFormOpen(true);
    };

    const promptDelete = (member) => {
        setMemberToDelete(member);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!memberToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/members/${memberToDelete.id}`);
            setDeleteModalOpen(false);
            setMemberToDelete(null);
            fetchMembers();
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.response?.data?.error || err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        fetchMembers();
    };

    // Extract unique levels for filter
    const levels = Array.from(new Set(members.map(m => m.level).filter(Boolean))).sort((a, b) => a - b);

    const filteredMembers = members.filter(m => {
        const searchLower = searchTerm.trim().toLowerCase();
        const matchesSearch = !searchLower ||
            (m.full_name && m.full_name.toLowerCase().includes(searchLower)) ||
            (m.name_bangla && m.name_bangla.toLowerCase().includes(searchLower)) ||
            (m.name_english && m.name_english.toLowerCase().includes(searchLower)) ||
            (m.home_name && m.home_name.toLowerCase().includes(searchLower)) ||
            (m.contact_number && m.contact_number.toLowerCase().includes(searchLower));

        const matchesLevel = selectedLevel === 'all' || String(m.level) === String(selectedLevel);

        return matchesSearch && matchesLevel;
    });

    return (
        <div className="min-h-screen bg-orange-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Header Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold uppercase tracking-wider mb-2">
                            <Shield className="w-3.5 h-3.5 text-orange-700" />
                            {t('তথ্য ব্যবস্থাপনা', 'Data Management')}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-orange-950">
                            {t('বংশ ও পারিবারিক তথ্য এন্ট্রি', 'Lineage & Member Records Entry')}
                        </h1>
                        <p className="text-stone-500 text-sm mt-1">
                            {t(
                                'নতুন সদস্য যোগ করুন, পারিবারিক তথ্য সম্পাদনা করুন বা বংশলতিকার রেকর্ড হালনাগাদ রাখুন।',
                                'Add new members, edit personal & family details, or manage genealogical records.'
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchMembers}
                            disabled={loading}
                            title="Refresh data"
                            className="p-2.5 rounded-xl border border-orange-200 text-orange-800 hover:bg-orange-100/60 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 bg-orange-800 hover:bg-orange-900 text-white font-medium px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{t('নতুন সদস্য যোগ করুন', 'Add New Member')}</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={t('নাম, পিতা, গ্রাম বা মোবাইল দিয়ে খুঁজুন...', 'Search by name, father, village or mobile...')}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-orange-200 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50/30 placeholder-stone-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="w-full sm:w-auto border border-orange-200 rounded-xl px-3 py-2.5 text-stone-700 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                            <option value="all">{t('সকল প্রজন্ম (All Generations)', 'All Generations')}</option>
                            {levels.map(lvl => (
                                <option key={lvl} value={lvl}>
                                    {t(`প্রজন্ম ${lvl}`, `Generation ${lvl}`)}
                                </option>
                            ))}
                        </select>

                        <div className="text-xs font-semibold text-stone-500 whitespace-nowrap bg-orange-50 px-3 py-2 rounded-xl border border-orange-200/60">
                            {filteredMembers.length} {t('সদস্য', 'members')}
                        </div>
                    </div>
                </div>

                {/* Members Data Table */}
                <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="bg-orange-100/70 text-orange-950 font-serif text-sm">
                                <tr>
                                    <th className="p-4 pl-6 font-semibold">{t('নাম ও পরিচয়', 'Name & Identity')}</th>
                                    <th className="p-4 font-semibold">{t('প্রজন্ম', 'Generation')}</th>
                                    <th className="p-4 font-semibold">{t('পিতার নাম', 'Father')}</th>
                                    <th className="p-4 font-semibold">{t('গ্রাম / বাড়ি', 'Village / Home')}</th>
                                    <th className="p-4 font-semibold">{t('যোগাযোগ', 'Contact')}</th>
                                    <th className="p-4 pr-6 text-right font-semibold">{t('অ্যাকশন', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100/60 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-stone-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
                                                <span className="font-medium text-stone-600">{t('তথ্য লোড হচ্ছে...', 'Loading members data...')}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-stone-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="w-10 h-10 text-stone-300" />
                                                <span className="font-medium text-stone-700">{t('কোন সদস্য পাওয়া যায়নি', 'No members found')}</span>
                                                <p className="text-xs text-stone-400">
                                                    {searchTerm ? t('অন্য কোন শব্দ দিয়ে অনুসন্ধান করুন', 'Try a different search query') : t('নতুন সদস্য যুক্ত করতে উপরের বাটনে ক্লিক করুন', 'Click "Add New Member" to add one')}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.slice(0, 100).map(member => {
                                        const father = members.find(m => m.id === member.father_id);
                                        return (
                                            <tr key={member.id} className="hover:bg-orange-50/60 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 border border-orange-200 flex-shrink-0 flex items-center justify-center font-bold text-orange-800 text-xs">
                                                            {member.profile_image_url ? (
                                                                <img
                                                                    src={member.profile_image_url}
                                                                    alt={member.full_name || 'Member'}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                (formatName(member) || 'M').charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-stone-900 truncate">
                                                                {formatName(member)}
                                                            </div>
                                                            <div className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                                                                <span className={member.gender === 'Female' ? 'text-pink-600 font-medium' : 'text-blue-600 font-medium'}>
                                                                    {member.gender === 'Female' ? t('মহিলা', 'Female') : t('পুরুষ', 'Male')}
                                                                </span>
                                                                {member.is_alive === false && (
                                                                    <span className="text-stone-400 bg-stone-100 text-[10px] px-1.5 py-0.5 rounded">
                                                                        {t('প্রয়াত', 'Deceased')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200/60">
                                                        {t(`প্রজন্ম ${member.level}`, `Gen ${member.level}`)}
                                                    </span>
                                                </td>

                                                <td className="p-4 text-stone-600">
                                                    {father ? (
                                                        <span className="font-medium text-stone-800">{formatName(father)}</span>
                                                    ) : (
                                                        <span className="text-stone-400 italic">-</span>
                                                    )}
                                                </td>

                                                <td className="p-4 text-stone-600">
                                                    {member.home_name || member.village ? (
                                                        <span>{member.home_name || member.village}</span>
                                                    ) : (
                                                        <span className="text-stone-400 italic">-</span>
                                                    )}
                                                </td>

                                                <td className="p-4 text-stone-600 font-mono text-xs">
                                                    {member.contact_number ? (
                                                        <span className="truncate max-w-[140px] block" title={member.contact_number}>
                                                            {member.contact_number}
                                                        </span>
                                                    ) : (
                                                        <span className="text-stone-400 italic">-</span>
                                                    )}
                                                </td>

                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(member)}
                                                            className="p-2 rounded-lg bg-orange-50 text-orange-800 hover:bg-orange-800 hover:text-white transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105"
                                                            title={t('সম্পাদনা করুন', 'Edit Member')}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => promptDelete(member)}
                                                            className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-700 hover:text-white transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105"
                                                            title={t('মুছে ফেলুন', 'Delete Member')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredMembers.length > 100 && (
                        <div className="p-4 bg-orange-50/50 text-center text-xs text-stone-500 border-t border-orange-100">
                            {t('শীর্ষ ১০০ সদস্য দেখানো হচ্ছে। নির্দিষ্ট সদস্য খুঁজতে সার্চ বক্স ব্যবহার করুন।', 'Showing first 100 members. Use search box to locate specific members.')}
                        </div>
                    )}
                </div>
            </div>

            {/* Member Form Modal */}
            <MemberForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialData={initialFormData}
                onSuccess={handleFormSuccess}
            />

            {/* Safe Delete Confirm Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('সদস্য মুছে ফেলুন', 'Delete Member')}
                message={
                    memberToDelete ? t(
                        `আপনি কি নিশ্চিত যে আপনি "${formatName(memberToDelete)}" কে মুছে ফেলতে চান? এটি বংশলতিকার সংযোগে প্রভাব ফেলতে পারে।`,
                        `Are you sure you want to delete "${formatName(memberToDelete)}"? This might affect family tree connections.`
                    ) : ''
                }
                confirmText={deleting ? t('মুছে ফেলা হচ্ছে...', 'Deleting...') : t('মুছে ফেলুন', 'Delete')}
                requireCheckbox={true}
                checkboxLabel={t('আমি বুঝতে পেরেছি যে এই সদস্যকে মুছে ফেলা হবে।', 'I understand that this member record will be deleted.')}
            />
        </div>
    );
};

export default Admin;
