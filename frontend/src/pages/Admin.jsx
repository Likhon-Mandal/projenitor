import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield, Users, RefreshCw, X } from 'lucide-react';
import MemberForm from '../components/MemberForm';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const Admin = () => {
    const { t, formatName, formatNumber } = useLanguage();
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
            (formatName(m, false) && formatName(m, false).toLowerCase().includes(searchLower)) ||
            (formatName(m, true) && formatName(m, true).toLowerCase().includes(searchLower)) ||
            (m.home_name && m.home_name.toLowerCase().includes(searchLower)) ||
            (m.contact_number && m.contact_number.toLowerCase().includes(searchLower));

        const matchesLevel = selectedLevel === 'all' || String(m.level) === String(selectedLevel);

        return matchesSearch && matchesLevel;
    });

    const visibleMembers = filteredMembers.slice(0, 100);

    const MemberAvatar = ({ member, size = 'w-11 h-11' }) => (
        <div className={`${size} rounded-full overflow-hidden bg-orange-100 border border-orange-200 flex-shrink-0 flex items-center justify-center font-bold text-orange-800 text-sm`}>
            {member.profile_image_url
                ? <img src={member.profile_image_url} alt={member.full_name || 'Member'} className="w-full h-full object-cover" />
                : (formatName(member) || 'M').charAt(0).toUpperCase()}
        </div>
    );

    return (
        <div className="font-sans max-w-7xl mx-auto space-y-3 sm:space-y-5">
            <style>{`
                @keyframes db-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
                .db-rise { animation: db-rise .4s cubic-bezier(.2,.8,.2,1) both; }
                @media (prefers-reduced-motion: reduce) { .db-rise { animation: none !important; } }
            `}</style>

            {/* Header */}
            <section className="db-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-800 via-red-900 to-orange-950 text-white p-4 sm:p-6 shadow-lg shadow-orange-900/20">
                <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-yellow-400/20 blur-3xl" />
                <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold uppercase tracking-wider">
                            <Shield className="w-3 h-3 text-yellow-300" />
                            {t('তথ্য ব্যবস্থাপনা', 'Data Management')}
                        </span>
                        <h1 className="mt-2 text-xl sm:text-3xl font-serif font-black text-white leading-tight">
                            {t('বংশ ও পারিবারিক তথ্য এন্ট্রি', 'Lineage & Member Records Entry')}
                        </h1>
                        <p className="text-orange-100/80 text-xs sm:text-sm mt-1 leading-relaxed">
                            {t(
                                'নতুন সদস্য যোগ করুন, পারিবারিক তথ্য সম্পাদনা করুন বা বংশলতিকার রেকর্ড হালনাগাদ রাখুন।',
                                'Add new members, edit personal & family details, or manage genealogical records.'
                            )}
                        </p>
                    </div>
                    <button
                        onClick={fetchMembers}
                        disabled={loading}
                        title={t('রিফ্রেশ', 'Refresh data')}
                        aria-label={t('রিফ্রেশ', 'Refresh data')}
                        className="shrink-0 w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center active:scale-90 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-[18px] h-[18px] ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <button
                    onClick={handleCreate}
                    className="relative mt-4 w-full sm:w-auto min-h-[46px] px-5 flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-orange-950 font-black text-sm shadow-md active:scale-[0.98] transition cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('নতুন সদস্য যোগ করুন', 'Add New Member')}</span>
                </button>
            </section>

            {/* Search & filter (sticks under the app bar) */}
            <div className="sticky top-[calc(3.5rem_+_env(safe-area-inset-top))] md:top-[calc(4rem_+_env(safe-area-inset-top))] z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 bg-background/85 backdrop-blur-md">
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-orange-100 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                            <Search className="w-[18px] h-[18px] text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={t('নাম, পিতা, গ্রাম বা মোবাইল দিয়ে খুঁজুন...', 'Search by name, father, village or mobile...')}
                                className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-orange-200 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50/30 placeholder-stone-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700" aria-label={t('মুছুন', 'Clear')}>
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <span className="shrink-0 min-h-[44px] px-3 rounded-xl bg-orange-50 border border-orange-200/70 text-xs font-bold text-orange-900 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />{formatNumber(filteredMembers.length)}
                        </span>
                    </div>

                    {levels.length > 0 && (
                        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                            {['all', ...levels].map((lvl) => {
                                const active = String(selectedLevel) === String(lvl);
                                return (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => setSelectedLevel(String(lvl))}
                                        className={`shrink-0 min-h-[34px] px-3 rounded-full text-xs font-bold border transition-colors ${active
                                            ? 'bg-orange-800 text-white border-orange-800'
                                            : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'}`}
                                    >
                                        {lvl === 'all' ? t('সকল প্রজন্ম', 'All Generations') : t(`প্রজন্ম ${formatNumber(lvl)}`, `Gen ${lvl}`)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2.5">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-[76px] bg-white rounded-2xl border border-orange-100 animate-pulse" />)}
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-orange-200 p-10 text-center">
                    <Users className="w-10 h-10 text-orange-200 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">{t('কোন সদস্য পাওয়া যায়নি', 'No members found')}</p>
                    <p className="text-xs text-stone-400 mt-1">
                        {searchTerm ? t('অন্য কোন শব্দ দিয়ে অনুসন্ধান করুন', 'Try a different search query') : t('নতুন সদস্য যুক্ত করতে উপরের বাটনে ক্লিক করুন', 'Click "Add New Member" to add one')}
                    </p>
                </div>
            ) : (
                <>
                    {/* Phone & tablet: member rows */}
                    <ul className="lg:hidden bg-white rounded-2xl border border-orange-100 shadow-sm divide-y divide-orange-50 overflow-hidden">
                        {visibleMembers.map(member => {
                            const father = members.find(m => m.id === member.father_id);
                            return (
                                <li key={member.id} className="flex items-center gap-3 p-3">
                                    <MemberAvatar member={member} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-stone-900 leading-tight truncate">{formatName(member)}</p>
                                        <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px]">
                                            <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-900 font-bold">{t(`প্রজন্ম ${member.level}`, `Gen ${member.level}`)}</span>
                                            <span className={member.gender === 'Female' ? 'text-pink-600 font-semibold' : 'text-blue-600 font-semibold'}>
                                                {member.gender === 'Female' ? t('মহিলা', 'Female') : t('পুরুষ', 'Male')}
                                            </span>
                                            {member.is_alive === false && <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{t('প্রয়াত', 'Deceased')}</span>}
                                        </div>
                                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                            {father ? `${t('পিতা', 'Father')}: ${formatName(father)}` : ''}
                                            {father && (member.home_name || member.village) ? ' • ' : ''}
                                            {member.home_name || member.village || ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleEdit(member)} className="w-10 h-10 rounded-xl bg-orange-50 text-orange-800 hover:bg-orange-100 flex items-center justify-center active:scale-95 transition cursor-pointer" title={t('সম্পাদনা করুন', 'Edit Member')} aria-label={t('সম্পাদনা করুন', 'Edit Member')}>
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => promptDelete(member)} className="w-10 h-10 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center active:scale-95 transition cursor-pointer" title={t('মুছে ফেলুন', 'Delete Member')} aria-label={t('মুছে ফেলুন', 'Delete Member')}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Desktop: table */}
                    <div className="hidden lg:block bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-orange-50 text-orange-950 font-serif text-sm border-b border-orange-100">
                                    <tr>
                                        <th className="p-4 pl-6 font-semibold">{t('নাম ও পরিচয়', 'Name & Identity')}</th>
                                        <th className="p-4 font-semibold">{t('প্রজন্ম', 'Generation')}</th>
                                        <th className="p-4 font-semibold">{t('পিতার নাম', 'Father')}</th>
                                        <th className="p-4 font-semibold">{t('গ্রাম / বাড়ি', 'Village / Home')}</th>
                                        <th className="p-4 font-semibold">{t('যোগাযোগ', 'Contact')}</th>
                                        <th className="p-4 pr-6 text-right font-semibold">{t('অ্যাকশন', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-100/60 text-sm">
                                    {visibleMembers.map(member => {
                                        const father = members.find(m => m.id === member.father_id);
                                        return (
                                            <tr key={member.id} className="hover:bg-orange-50/60 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <MemberAvatar member={member} size="w-10 h-10" />
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-stone-900 truncate">{formatName(member)}</div>
                                                            <div className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                                                                <span className={member.gender === 'Female' ? 'text-pink-600 font-medium' : 'text-blue-600 font-medium'}>
                                                                    {member.gender === 'Female' ? t('মহিলা', 'Female') : t('পুরুষ', 'Male')}
                                                                </span>
                                                                {member.is_alive === false && (
                                                                    <span className="text-stone-400 bg-stone-100 text-[10px] px-1.5 py-0.5 rounded">{t('প্রয়াত', 'Deceased')}</span>
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
                                                    {father ? <span className="font-medium text-stone-800">{formatName(father)}</span> : <span className="text-stone-400 italic">-</span>}
                                                </td>
                                                <td className="p-4 text-stone-600">
                                                    {member.home_name || member.village ? <span>{member.home_name || member.village}</span> : <span className="text-stone-400 italic">-</span>}
                                                </td>
                                                <td className="p-4 text-stone-600 font-mono text-xs">
                                                    {member.contact_number
                                                        ? <span className="truncate max-w-[140px] block" title={member.contact_number}>{member.contact_number}</span>
                                                        : <span className="text-stone-400 italic">-</span>}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleEdit(member)} className="w-9 h-9 rounded-lg bg-orange-50 text-orange-800 hover:bg-orange-800 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer" title={t('সম্পাদনা করুন', 'Edit Member')}>
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => promptDelete(member)} className="w-9 h-9 rounded-lg bg-red-50 text-red-700 hover:bg-red-700 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer" title={t('মুছে ফেলুন', 'Delete Member')}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredMembers.length > 100 && (
                        <p className="px-4 py-3 bg-orange-50 rounded-2xl text-center text-xs text-stone-500 border border-orange-100">
                            {t('শীর্ষ ১০০ সদস্য দেখানো হচ্ছে। নির্দিষ্ট সদস্য খুঁজতে সার্চ বক্স ব্যবহার করুন।', 'Showing first 100 members. Use search box to locate specific members.')}
                        </p>
                    )}
                </>
            )}

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
