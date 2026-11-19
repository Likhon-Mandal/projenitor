import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Search, CheckCircle, XCircle, Shield, Lock, Trash2, ShieldAlert, Users, X, Phone, Mail, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ConfirmModal from './ConfirmModal';

const UserManagement = () => {
    const { formatName, t, formatNumber, isBn } = useLanguage();
    const { user: currentUser, isSuperAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'active' | 'rejected'
    const [selectedProfileMemberId, setSelectedProfileMemberId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: null,
        status: null,
        actionType: 'status', // 'status' | 'delete'
        title: '',
        message: null,
        type: 'approve',
        confirmText: '',
        isPermanent: false
    });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const requestStatusChange = (userItem, status) => {
        if (userItem?.role === 'superadmin') {
            alert(t('সুপারএডমিনের অবস্থা সুরক্ষিত এবং পরিবর্তন করা যায় না।', 'SuperAdmin status is protected and cannot be modified.'));
            return;
        }
        if (!isSuperAdmin && userItem?.role === 'admin') {
            alert(t('শুধুমাত্র সুপারএডমিন এডমিন অ্যাকাউন্টের অবস্থা পরিবর্তন করতে পারেন।', 'Only SuperAdmins can modify the status of admin accounts.'));
            return;
        }
        const memberDisplayName = formatName({
            full_name: userItem.member_name,
            name_bangla: userItem.name_bangla,
            name_english: userItem.name_english
        }) || userItem.member_name || t('সদস্য', 'Member');

        const isApprove = status === 'approved';
        setConfirmModal({
            isOpen: true,
            id: userItem.id,
            status,
            actionType: 'status',
            isPermanent: false,
            type: isApprove ? 'approve' : 'reject',
            title: isApprove
                ? t('অ্যাকাউন্ট অনুমোদন নিশ্চিতকরণ', 'Confirm Account Approval')
                : t('অ্যাকাউন্ট প্রত্যাখ্যান নিশ্চিতকরণ', 'Confirm Account Rejection'),
            message: isApprove
                ? (isBn
                    ? `আপনি কি নিশ্চিত যে "${memberDisplayName}"-এর অ্যাকাউন্ট সক্রিয়করণ আবেদনটি অনুমোদন করতে চান? অনুমোদনের পর ব্যবহারকারী সিস্টেমে লগইন করতে পারবেন।`
                    : `Are you sure you want to approve the account activation request for "${memberDisplayName}"? Once approved, the user will be able to log in.`)
                : (isBn
                    ? `আপনি কি নিশ্চিত যে "${memberDisplayName}"-এর অ্যাকাউন্ট সক্রিয়করণ আবেদনটি প্রত্যাখ্যান করতে চান?`
                    : `Are you sure you want to reject the account activation request for "${memberDisplayName}"?`),
            confirmText: isApprove ? t('অনুমোদন করুন', 'Approve') : t('প্রত্যাখ্যান করুন', 'Reject')
        });
    };

    const requestDeleteUser = (userItem) => {
        if (!isSuperAdmin) {
            alert(t('শুধুমাত্র সুপারএডমিন ব্যবহারকারী অ্যাকাউন্ট মুছে ফেলতে পারেন।', 'Only SuperAdmins can delete user accounts.'));
            return;
        }
        if (userItem?.role === 'superadmin') {
            alert(t('সুপারএডমিন অ্যাকাউন্ট সুরক্ষিত এবং মোছা সম্ভব নয়।', 'SuperAdmin accounts are protected and cannot be deleted.'));
            return;
        }

        const isTargetAdmin = userItem.role === 'admin';
        const memberDisplayName = formatName({
            full_name: userItem.member_name,
            name_bangla: userItem.name_bangla,
            name_english: userItem.name_english
        }) || userItem.member_name || t('সদস্য', 'Member');

        setConfirmModal({
            isOpen: true,
            id: userItem.id,
            status: null,
            actionType: 'delete',
            isPermanent: isTargetAdmin,
            type: 'danger',
            title: isTargetAdmin
                ? t('অ্যাকাউন্ট ও এডমিন পদ মুছে ফেলা নিশ্চিত করুন', 'Confirm Account & Admin Role Deletion')
                : t('ব্যবহারকারী অ্যাকাউন্ট মুছে ফেলা নিশ্চিত করুন', 'Confirm User Account Deletion'),
            message: (
                <div className="space-y-3 text-left">
                    {isTargetAdmin && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs sm:text-sm font-medium flex items-start gap-2.5 shadow-2xs">
                            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-950">
                                    {t(
                                        'সতর্কতা: এই ব্যবহারকারী একজন এডমিন (Admin)!',
                                        'Warning: This user is an Admin!'
                                    )}
                                </p>
                                <p className="mt-0.5 text-red-800 leading-relaxed text-xs">
                                    {t(
                                        'অ্যাকাউন্টটি মুছে ফেললে তার এডমিন পদ এবং সকল প্রশাসনিক সুবিধাও স্বয়ংক্রিয়ভাবে বাতিল হয়ে যাবে।',
                                        'Deleting this account will also permanently revoke their Admin role and privileges.'
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                    <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                        {isBn ? (
                            <>
                                আপনি কি নিশ্চিত যে <span className="font-bold text-stone-900 font-serif">"{memberDisplayName}"</span>
                                {userItem.mobile_number ? ` (${userItem.mobile_number})` : ''}-এর অ্যাকাউন্টটি মুছে ফেলতে চান?
                            </>
                        ) : (
                            <>
                                Are you sure you want to delete the user account for <span className="font-bold text-stone-900 font-serif">"{memberDisplayName}"</span>
                                {userItem.mobile_number ? ` (${userItem.mobile_number})` : ''}?
                            </>
                        )}
                    </p>
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 text-[11px] sm:text-xs text-amber-950 space-y-1.5 shadow-2xs">
                        <p className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                            {t('মুছে ফেলার প্রভাব ও পরবর্তী অবস্থা:', 'Deletion Impact & Outcome:')}
                        </p>
                        <ul className="list-disc list-inside text-stone-700 space-y-1 leading-relaxed">
                            <li>
                                {t('ব্যবহারকারীর অ্যাকাউন্ট নিষ্ক্রিয় হবে এবং লগইন শংসাপত্র মুছে ফেলা হবে।', 'The user account will be inactivated and login credentials removed.')}
                            </li>
                            <li>
                                {t('বংশতালিকার মূল প্রোফাইল অক্ষত থাকবে এবং প্রোফাইলটি পুনরায় সক্রিয় বা ক্লেইম করার জন্য প্রস্তুত হবে।', 'The lineage member profile remains safe and ready to be claimed/activated again.')}
                            </li>
                            {userItem.mobile_number && (
                                <li>
                                    {isBn ? (
                                        <>অ্যাকাউন্ট সক্রিয়করণের সময় প্রোফাইলে যুক্ত হওয়া লগইন নম্বরটি (<span className="font-mono font-medium">{userItem.mobile_number}</span>) প্রোফাইল থেকে অপসারণ করা হবে।</>
                                    ) : (
                                        <>The login mobile number (<span className="font-mono font-medium">{userItem.mobile_number}</span>) added during activation will be removed from the member profile.</>
                                    )}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            ),
            confirmText: isTargetAdmin 
                ? t('এডমিনসহ অ্যাকাউন্ট মুছুন', 'Delete Account & Role')
                : t('অ্যাকাউন্ট মুছুন', 'Delete Account')
        });
    };

    const handleConfirmModalAction = async () => {
        if (!confirmModal.id) return;

        if (confirmModal.actionType === 'delete') {
            try {
                await api.delete(`/admin/users/${confirmModal.id}`);
                fetchUsers();
            } catch (err) {
                console.error('Delete user error:', err);
                alert(err.response?.data?.error || t('ব্যবহারকারী অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে', 'Failed to delete user account'));
            }
        } else {
            if (!confirmModal.status) return;
            try {
                await api.put(`/admin/users/${confirmModal.id}/status`, { status: confirmModal.status });
                fetchUsers();
            } catch (err) {
                console.error('Update user status error:', err);
                alert(err.response?.data?.error || t('অবস্থা আপডেট করতে ব্যর্থ হয়েছে', 'Failed to update status'));
            }
        }
    };

    const filteredUsers = users.filter(u => {
        const q = searchTerm.toLowerCase();
        const formatted = formatName({
            full_name: u.member_name,
            name_bangla: u.name_bangla,
            name_english: u.name_english
        }).toLowerCase();
        return (
            formatted.includes(q) ||
            (u.member_name && u.member_name.toLowerCase().includes(q)) ||
            (u.name_bangla && u.name_bangla.toLowerCase().includes(q)) ||
            (u.name_english && u.name_english.toLowerCase().includes(q)) ||
            (u.mobile_number && u.mobile_number.includes(searchTerm)) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
    });

    const pendingUsersCount = users.filter(u => u.status === 'pending').length;
    const statusCounts = {
        all: users.length,
        pending: pendingUsersCount,
        active: users.filter(u => u.status === 'active' || u.status === 'approved').length,
        rejected: users.filter(u => u.status === 'rejected').length,
    };
    const visibleUsers = filteredUsers
        .filter(u => statusFilter === 'all'
            || (statusFilter === 'active' ? (u.status === 'active' || u.status === 'approved') : u.status === statusFilter))
        // Pending requests first — they need action
        .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1));

    const rowInfo = (userItem) => {
        const isRowSuperAdmin = userItem.role === 'superadmin';
        const isSelf = currentUser && (
            userItem.id === currentUser.id ||
            (userItem.email && currentUser.email && userItem.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (userItem.member_id && currentUser.member_id && userItem.member_id === currentUser.member_id)
        );
        const isRowAdmin = userItem.role === 'admin';
        const canChangeStatus = !isRowSuperAdmin && (!isRowAdmin || isSuperAdmin);
        const memberDisplayName = formatName({
            full_name: userItem.member_name,
            name_bangla: userItem.name_bangla,
            name_english: userItem.name_english
        }) || t('সদস্য', 'Member');
        return { isRowSuperAdmin, isSelf, isRowAdmin, canChangeStatus, memberDisplayName };
    };

    const RoleBadge = ({ role }) => (
        role === 'superadmin' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Shield className="w-3 h-3 text-amber-700" />{t('সুপারএডমিন', 'SuperAdmin')}
            </span>
        ) : role === 'admin' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                <Shield className="w-3 h-3 text-orange-700 opacity-70" />{t('এডমিন', 'Admin')}
            </span>
        ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600">{t('সদস্য', 'Member')}</span>
        )
    );

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0"><Users className="w-[18px] h-[18px]" /></span>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-serif text-stone-900 font-bold flex items-center gap-2 flex-wrap leading-tight">
                            <span>{t('ব্যবহারকারী অ্যাকাউন্ট ও আবেদনসমূহ', 'User Account Requests & Directory')}</span>
                            {pendingUsersCount > 0 && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                    <span>{formatNumber(pendingUsersCount)} {t('নতুন আবেদন', 'Pending Requests')}</span>
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            {t('বংশতালিকার সদস্যদের অ্যাকাউন্ট সক্রিয়করণ আবেদন এবং পরিচালনা', 'Manage lineage member account activation requests and directory')}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('নাম, মোবাইল বা ইমেইল দিয়ে খুঁজুন...', 'Search by name, mobile, email...')}
                        className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-orange-200 bg-orange-50/40 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700" aria-label={t('মুছুন', 'Clear')}>
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="no-scrollbar flex gap-1.5 overflow-x-auto -mx-1 px-1">
                    {[
                        { id: 'all', label: t('সবাই', 'All') },
                        { id: 'pending', label: t('বিবেচনাধীন', 'Pending') },
                        { id: 'active', label: t('সক্রিয়', 'Active') },
                        { id: 'rejected', label: t('প্রত্যাখ্যাত', 'Rejected') },
                    ].map(f => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setStatusFilter(f.id)}
                            className={`shrink-0 min-h-[36px] px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-colors ${statusFilter === f.id
                                ? 'bg-orange-800 text-white border-orange-800'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'}`}
                        >
                            {f.label}
                            <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center ${statusFilter === f.id ? 'bg-white/20' : 'bg-stone-100'}`}>
                                {formatNumber(statusCounts[f.id])}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2.5">
                    {[0, 1, 2].map(i => <div key={i} className="h-[92px] bg-white rounded-2xl border border-orange-100 animate-pulse" />)}
                </div>
            ) : visibleUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-10 text-center">
                    <Users className="w-10 h-10 text-orange-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-stone-600">{t('কোনো ব্যবহারকারী পাওয়া যায়নি।', 'No users found.')}</p>
                </div>
            ) : (
                <>
                    {/* Phone & tablet: cards */}
                    <div className="lg:hidden space-y-2.5">
                        {visibleUsers.map(userItem => {
                            const { isRowSuperAdmin, isSelf, isRowAdmin, canChangeStatus, memberDisplayName } = rowInfo(userItem);
                            const showApprove = !isRowSuperAdmin && userItem.status === 'pending' && canChangeStatus;
                            const showDelete = isSuperAdmin && !isRowSuperAdmin && !isSelf;
                            return (
                                <div key={userItem.id} className={`bg-white rounded-2xl border p-3.5 shadow-sm ${userItem.status === 'pending' ? 'border-amber-200' : 'border-orange-100'}`}>
                                    <div className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            disabled={!userItem.member_id}
                                            onClick={() => userItem.member_id && setSelectedProfileMemberId(userItem.member_id)}
                                            className="shrink-0 w-11 h-11 rounded-full overflow-hidden bg-orange-100 text-orange-800 font-bold flex items-center justify-center active:scale-95 transition-transform disabled:cursor-default"
                                            aria-label={t('প্রোফাইল কার্ড দেখুন', 'View Profile Card')}
                                        >
                                            {userItem.profile_image_url
                                                ? <img src={userItem.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                : (memberDisplayName || '?').charAt(0)}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-serif font-bold text-stone-900 leading-tight">{memberDisplayName}</p>
                                                <StatusPill status={userItem.status} />
                                            </div>
                                            {userItem.mobile_number && (
                                                <a href={`tel:${userItem.mobile_number}`} className="mt-1 text-xs text-stone-600 font-mono flex items-center gap-1 w-fit">
                                                    <Phone className="w-3 h-3 text-orange-700" />{userItem.mobile_number}
                                                </a>
                                            )}
                                            {userItem.email && (
                                                <p className="text-xs text-stone-500 flex items-center gap-1 min-w-0"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{userItem.email}</span></p>
                                            )}
                                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                                <RoleBadge role={userItem.role} />
                                                {isSelf && <span className="text-[11px] text-stone-400 italic">{t('আপনি', 'You')}</span>}
                                                {isRowSuperAdmin && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800"><Lock className="w-3 h-3" />{t('সুরক্ষিত', 'Protected')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {(showApprove || showDelete) && (
                                        <div className={`grid gap-2 mt-3 ${showApprove && showDelete ? 'grid-cols-[1fr_1fr_auto]' : showApprove ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                            {showApprove && (
                                                <>
                                                    <button onClick={() => requestStatusChange(userItem, 'rejected')} className="min-h-[42px] rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer">
                                                        <XCircle size={16} />{t('প্রত্যাখ্যান', 'Reject')}
                                                    </button>
                                                    <button onClick={() => requestStatusChange(userItem, 'approved')} className="min-h-[42px] rounded-xl bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer">
                                                        <CheckCircle size={16} />{t('অনুমোদন', 'Approve')}
                                                    </button>
                                                </>
                                            )}
                                            {showDelete && (
                                                <button
                                                    onClick={() => requestDeleteUser(userItem)}
                                                    className={`min-h-[42px] rounded-xl border border-stone-200 text-stone-500 hover:text-red-700 hover:border-red-200 flex items-center justify-center gap-1.5 text-sm font-semibold active:scale-95 transition cursor-pointer ${showApprove ? 'w-[42px]' : ''}`}
                                                    title={userItem.role === 'admin' ? t('অ্যাকাউন্ট ও এডমিন পদ মুছুন', 'Delete User & Revoke Admin Role') : t('অ্যাকাউন্ট মুছুন', 'Delete User Account')}
                                                    aria-label={t('অ্যাকাউন্ট মুছুন', 'Delete User Account')}
                                                >
                                                    <Trash2 size={16} />
                                                    {!showApprove && <span>{t('অ্যাকাউন্ট মুছুন', 'Delete Account')}</span>}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {!showApprove && !showDelete && isRowAdmin && !isSuperAdmin && !isSelf && (
                                        <p className="mt-2 text-[11px] text-stone-400 italic">{t('শুধুমাত্র সুপারএডমিন এই অ্যাকাউন্ট পরিবর্তন করতে পারেন', 'Only a SuperAdmin can change this account')}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-orange-50 text-orange-900 font-serif border-b border-orange-100">
                                    <tr>
                                        <th className="p-4">{t('সদস্যের নাম', 'Member Name')}</th>
                                        <th className="p-4">{t('মোবাইল নম্বর', 'Mobile Number')}</th>
                                        <th className="p-4">{t('ইমেইল', 'Email')}</th>
                                        <th className="p-4">{t('ভূমিকা', 'Role')}</th>
                                        <th className="p-4">{t('অবস্থা', 'Status')}</th>
                                        <th className="p-4 text-center">{t('পদক্ষেপ', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-50">
                                    {visibleUsers.map(userItem => {
                                        const { isRowSuperAdmin, isSelf, isRowAdmin, canChangeStatus, memberDisplayName } = rowInfo(userItem);
                                        return (
                                            <tr key={userItem.id} className="hover:bg-orange-50/50 transition">
                                                <td className="p-4 font-medium text-stone-800">
                                                    <button
                                                        type="button"
                                                        disabled={!userItem.member_id}
                                                        onClick={() => userItem.member_id && setSelectedProfileMemberId(userItem.member_id)}
                                                        className={`flex items-center gap-3 text-left group transition-all duration-200 ${userItem.member_id ? 'cursor-pointer hover:opacity-95' : 'cursor-default'}`}
                                                        title={userItem.member_id ? t('প্রোফাইল কার্ড দেখুন', 'View Profile Card') : undefined}
                                                    >
                                                        <div className="w-9 h-9 rounded-full bg-orange-100 ring-2 ring-transparent group-hover:ring-orange-400 overflow-hidden shrink-0 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
                                                            {userItem.profile_image_url ? (
                                                                <img src={userItem.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-orange-700 font-bold text-xs">{memberDisplayName ? memberDisplayName.charAt(0) : '?'}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-stone-800 group-hover:text-orange-900 group-hover:underline underline-offset-2 transition-colors truncate">{memberDisplayName}</span>
                                                            {userItem.member_id && (
                                                                <span className="text-[10px] text-stone-400 group-hover:text-orange-700 transition-colors">{t('প্রোফাইল দেখুন →', 'View Profile →')}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="p-4 text-stone-600 font-mono text-sm">{userItem.mobile_number}</td>
                                                <td className="p-4 text-stone-600 font-mono text-xs">{userItem.email || '—'}</td>
                                                <td className="p-4"><RoleBadge role={userItem.role} /></td>
                                                <td className="p-4"><StatusPill status={userItem.status} /></td>
                                                <td className="p-4">
                                                    <div className="flex gap-2 justify-center items-center">
                                                        {isRowSuperAdmin ? (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 select-none"
                                                                title={t('সুপারএডমিন অ্যাকাউন্ট সুরক্ষিত এবং মোছা সম্ভব নয়', 'SuperAdmin accounts are permanent and cannot be deleted or modified')}
                                                            >
                                                                <Lock className="w-3 h-3 text-amber-700" />{t('সুরক্ষিত', 'Protected')}
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {userItem.status === 'pending' && canChangeStatus && (
                                                                    <>
                                                                        <button onClick={() => requestStatusChange(userItem, 'approved')} className="w-9 h-9 flex items-center justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer" title={t('অনুমোদন', 'Approve')}>
                                                                            <CheckCircle size={18} />
                                                                        </button>
                                                                        <button onClick={() => requestStatusChange(userItem, 'rejected')} className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer" title={t('প্রত্যাখ্যান', 'Reject')}>
                                                                            <XCircle size={18} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {isSuperAdmin && !isRowSuperAdmin && !isSelf && (
                                                                    <button
                                                                        onClick={() => requestDeleteUser(userItem)}
                                                                        className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                                                        title={userItem.role === 'admin' ? t('অ্যাকাউন্ট ও এডমিন পদ মুছুন', 'Delete User & Revoke Admin Role') : t('অ্যাকাউন্ট মুছুন', 'Delete User Account')}
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                )}
                                                                {isSelf ? (
                                                                    <span className="text-xs text-stone-400 italic px-2 py-1 select-none font-medium">{t('আপনি', 'You')}</span>
                                                                ) : isRowAdmin && !isSuperAdmin ? (
                                                                    <span className="text-xs text-stone-400 italic px-2 py-1 select-none">{t('এডমিন', 'Admin')}</span>
                                                                ) : userItem.status !== 'pending' && !isSuperAdmin ? (
                                                                    <span className="text-xs text-stone-400 italic px-2 py-1 select-none">—</span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Search-style Profile Modal for full inspection */}
            {selectedProfileMemberId && (
                <Profile
                    memberId={selectedProfileMemberId}
                    onClose={() => setSelectedProfileMemberId(null)}
                />
            )}

            {/* Custom Centered Confirmation Modal for Approval / Rejection / Deletion */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmModalAction}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                isPermanent={confirmModal.isPermanent}
            />
        </div>
    );
};

/** Account status pill (pending / active / approved / rejected). */
const StatusPill = ({ status }) => {
    const { t } = useLanguage();
    const map = {
        active: ['bg-emerald-100 text-emerald-800 border-emerald-200', CheckCircle, t('সক্রিয়', 'Active')],
        approved: ['bg-blue-100 text-blue-800 border-blue-200', CheckCircle, t('অনুমোদিত', 'Approved')],
        rejected: ['bg-red-100 text-red-800 border-red-200', XCircle, t('প্রত্যাখ্যাত', 'Rejected')],
        pending: ['bg-amber-100 text-amber-900 border-amber-200', Clock, t('বিবেচনাধীন', 'Pending')],
    };
    const [cls, Icon, label] = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${cls}`}>
            <Icon className="w-3 h-3" />{label}
        </span>
    );
};

export default UserManagement;
