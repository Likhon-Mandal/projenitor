import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ChevronDown, Plus, UserCircle2, MapPin, Briefcase, Pencil, Trash2 } from 'lucide-react';
import CommitteeFormModal from '../components/CommitteeFormModal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const CommitteeBoard = () => {
    const { isAdmin } = useAuth();
    const { t, isBn, formatNumber, formatOccupation, formatName } = useLanguage();
    const [committees, setCommittees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCommittee, setEditingCommittee] = useState(null);

    // For accordions of past committees
    const [expandedIds, setExpandedIds] = useState(new Set());

    const fetchCommittees = async () => {
        try {
            setLoading(true);
            const res = await api.get('/committee');
            setCommittees(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommittees();
    }, []);

    const toggleExpand = (id) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const formatDate = (dateString) => {
        if (!dateString) return isBn ? 'বর্তমান' : 'Present';
        const date = new Date(dateString);
        return date.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short' });
    };

    // Separate current and past
    const currentCommittee = committees.find(c => c.is_current);
    const pastCommittees = committees.filter(c => !c.is_current);

    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, committee: null });

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.committee) return;
        try {
            await api.delete(`/committee/${deleteConfirm.committee.id}`);
            fetchCommittees();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleEdit = (committee) => {
        setEditingCommittee(committee);
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setEditingCommittee(null);
        setIsModalOpen(true);
    };

    const RoleGroupRow = ({ role, members }) => (
        <div className="flex bg-white border-b border-stone-100 last:border-b-0 hover:bg-orange-50/30 transition-colors duration-200">
            {/* Left side: POST / ROLE */}
            <div className="w-1/3 md:w-1/4 p-3 md:px-4 md:py-3 border-r border-stone-100 shrink-0 bg-stone-50/50 flex flex-col justify-center">
                <div className="font-bold uppercase tracking-wider text-orange-800 text-xs md:text-sm">
                    {role}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-widest">
                    {formatNumber(members.length)} {t('জন সদস্য', members.length > 1 ? 'members' : 'member')}
                </div>
            </div>

            {/* Right side: Assigned Persons (Can be multiple) */}
            <div className="flex-1 p-3 md:px-4 md:py-2 flex flex-row flex-wrap gap-x-2 gap-y-2 items-center">
                {members.map((member, idx) => (
                    <Link key={idx} to={`/member/${member.member_id}`} className="group flex items-center gap-3 hover:bg-orange-50/50 p-2 rounded-xl transition-colors w-auto sm:w-[48%] md:w-auto pr-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-orange-100 bg-stone-100 flex items-center justify-center shrink-0 shadow-sm group-hover:border-orange-300 transition-colors">
                            {member.profile_image_url ? (
                                <img src={member.profile_image_url} alt={member.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle2 size={20} className="text-stone-300 group-hover:text-orange-400 transition-colors" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-serif font-bold text-stone-800 text-sm md:text-base mb-0.5 truncate group-hover:text-orange-700 transition-colors">
                                {formatName(member)}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-stone-500 text-[10px] md:text-xs">
                                {member.occupation && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase size={10} />
                                        <span className="truncate max-w-[80px]">{formatOccupation(member.occupation)}</span>
                                    </div>
                                )}
                                {member.district && (
                                    <div className="flex items-center gap-1">
                                        <MapPin size={10} />
                                        <span className="truncate max-w-[80px]">{member.district}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );

    const renderCommitteeMembers = (members) => {
        if (!members || members.length === 0) return <div className="text-center py-6 text-stone-400">{t('কোনো সদস্য যুক্ত করা হয়নি।', 'No members assigned.')}</div>;

        // Group by role
        const grouped = {};
        members.forEach(m => {
            if (!grouped[m.role]) grouped[m.role] = [];
            grouped[m.role].push(m);
        });

        return (
            <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                {Object.entries(grouped).map(([role, roleMembers]) => (
                    <RoleGroupRow key={role} role={role} members={roleMembers} />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#fffcf5] pb-20 font-sans">

            {/* Header Area */}
            <div className="bg-gradient-to-br from-orange-900 to-red-900 text-white pt-12 pb-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-orange-50 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md shadow-sm">
                            <Users size={14} /> {t('নেতৃত্ব ও প্রশাসন', 'Leadership & Administration')}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-amber-200 drop-shadow-md mb-3 leading-normal pt-1">
                            {t('কার্যনির্বাহী পরিষদ', 'Committee Board')}
                        </h1>
                        <p className="text-orange-100/90 max-w-2xl text-base md:text-lg font-light leading-relaxed">
                            {t('আমাদের সমাজের অগ্রগতি, ঐতিহ্য ও ভবিষ্যতের কাণ্ডারিদের শ্রদ্ধা ও স্বীকৃতি।', 'Honoring the dedicated individuals guiding our community, shaping our heritage, and leading our progress across generations.')}
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={handleCreateNew}
                            className="group bg-white hover:bg-orange-50 text-orange-900 hover:text-orange-600 px-5 py-2.5 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 whitespace-nowrap text-sm"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            {t('নতুন কমিটি গঠন', 'Form New Committee')}
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
                {loading ? (
                    <div className="bg-white rounded-3xl p-16 shadow-lg text-center text-stone-400 animate-pulse border border-orange-100 border-t-4 border-t-orange-500">
                        {t('কমিটির তথ্য লোড হচ্ছে...', 'Loading Committee Records...')}
                    </div>
                ) : (
                    <>
                        {/* Current Committee Section */}
                        {currentCommittee ? (
                            <section className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-orange-100 border-t-8 border-t-orange-600 mb-12">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-100 pb-6 mb-8 gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                            <span className="text-xs font-black uppercase tracking-widest text-green-600">{t('বর্তমান কার্যনির্বাহী পরিষদ', 'Current Administration')}</span>
                                        </div>
                                        <h2 className="text-3xl font-serif font-bold text-stone-800">{currentCommittee.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-2 bg-orange-50 text-orange-800 px-4 py-2 rounded-lg font-medium border border-orange-100">
                                        <Calendar size={18} />
                                        <span>{formatDate(currentCommittee.start_date)} — {formatDate(currentCommittee.end_date)}</span>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(currentCommittee)} className="p-2 text-stone-500 hover:text-orange-600 bg-stone-50 hover:bg-orange-50 border border-stone-200 rounded-lg transition-colors" title={t('কমিটি সম্পাদনা', 'Edit Committee')}>
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ isOpen: true, committee: currentCommittee })} className="p-2 text-stone-500 hover:text-red-600 bg-stone-50 hover:bg-red-50 border border-stone-200 rounded-lg transition-colors cursor-pointer" title={t('কমিটি মুছুন', 'Delete Committee')}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {renderCommitteeMembers(currentCommittee.members)}
                            </section>
                        ) : (
                            <div className="bg-white rounded-[2rem] p-12 shadow-xl border border-orange-100 border-t-8 border-t-stone-300 mb-12 text-center">
                                <Users size={48} className="mx-auto text-stone-300 mb-4" />
                                <h3 className="text-xl font-bold text-stone-600 mb-2">{t('কোনো সক্রিয় কমিটি নেই', 'No Active Committee')}</h3>
                                <p className="text-stone-400">{t("একটি নতুন কমিটি তৈরি করুন এবং এখানে প্রদর্শন করতে 'বর্তমান' চিহ্নিত করুন।", "Create a new committee and mark it as 'Current' to display it here.")}</p>
                            </div>
                        )}

                        {/* Past Committees Accordion */}
                        {pastCommittees.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <h3 className="text-2xl font-serif font-bold text-stone-700">{t('বিগত কার্যনির্বাহী পরিষদসমূহ', 'Past Committees')}</h3>
                                    <div className="h-px bg-stone-200 flex-1"></div>
                                </div>

                                <div className="space-y-4">
                                    {pastCommittees.map(committee => {
                                        const isExpanded = expandedIds.has(committee.id);
                                        return (
                                            <div key={committee.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-300 hover:border-orange-300">
                                                <div
                                                    onClick={() => toggleExpand(committee.id)}
                                                    className={`w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer transition-colors ${isExpanded ? 'bg-orange-50' : 'hover:bg-stone-50'}`}
                                                >
                                                    <div>
                                                        <h4 className="text-lg font-bold text-stone-800 mb-1">{committee.name}</h4>
                                                        <div className="flex items-center gap-2 text-stone-500 text-sm">
                                                            <Calendar size={14} />
                                                            <span>{formatDate(committee.start_date)} — {formatDate(committee.end_date)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {isAdmin && (
                                                            <div className="flex gap-2 mr-2" onClick={e => e.stopPropagation()}>
                                                                <button onClick={() => handleEdit(committee)} className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-100 rounded transition-colors" title="Edit">
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm({ isOpen: true, committee })} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer" title={t('কমিটি মুছুন', 'Delete Committee')}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-orange-200 text-orange-800 rotate-180' : 'bg-stone-100 text-stone-500'}`}>
                                                            <ChevronDown size={20} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                    <div className="overflow-hidden">
                                                        <div className="p-6 border-t border-stone-100 bg-[#fffcf5]">
                                                            {renderCommitteeMembers(committee.members)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>

            <CommitteeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchCommittees()}
                initialData={editingCommittee}
            />

            {/* Custom Centered Deletion Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, committee: null })}
                onConfirm={handleConfirmDelete}
                title={t('কমিটি মুছে ফেলা নিশ্চিত করুন', 'Confirm Committee Deletion')}
                message={deleteConfirm.committee?.session_name 
                    ? (isBn 
                        ? `আপনি কি নিশ্চিতভাবে "${deleteConfirm.committee.session_name}" কমিটিটি মুছে ফেলতে চান?` 
                        : `Are you sure you want to delete the committee "${deleteConfirm.committee.session_name}"?`)
                    : t('আপনি কি নিশ্চিতভাবে এই কমিটিটি মুছে ফেলতে চান?', 'Are you sure you want to delete this committee?')}
                confirmText={t('মুছে ফেলুন', 'Delete')}
            />
        </div>
    );
};

export default CommitteeBoard;
