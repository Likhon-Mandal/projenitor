import React, { useState, useEffect } from 'react';
import { Save, X, User, Camera } from 'lucide-react';
import api from '../api/api';
import OccupationSelect from './OccupationSelect';
import { useLanguage } from '../context/LanguageContext';

/* 
  Reusable Member Form Component
  - Handles Create/Update logic.
  - Can be pre-filled with initial data (e.g., geographic info).
  - Used in Admin and Explorer pages.
*/
const MemberForm = ({ isOpen, onClose, initialData = {}, onSuccess, onEditMember }) => {
    const { t, isBn, formatName } = useLanguage();
    const [formData, setFormData] = useState({
        full_name: '', name_bangla: '', name_english: '', gender: '', blood_group: '', occupation: '', education: '',
        birth_date: '', death_date: '', is_alive: true,
        contact_number: '', email: '', present_address: '', permanent_address: '',
        country: 'Bangladesh', division: '', district: '', upazila: '', village: '', home_name: '',
        father_id: '', mother_id: '', spouse_id: '', profile_image_url: '', bio: '',
        workplace: '', social_media: '',
        level: 1, isRoot: true,
        ...initialData // Override defaults with initialData if provided
    });

    const [members, setMembers] = useState([]);
    const [possibleFathers, setPossibleFathers] = useState([]);
    const [possibleMothers, setPossibleMothers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Quick Add Spouse State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState('spouse'); // 'spouse' or 'mother'
    const [quickSpouseNameBangla, setQuickSpouseNameBangla] = useState('');
    const [quickSpouseNameEnglish, setQuickSpouseNameEnglish] = useState('');
    const [quickSpouseName, setQuickSpouseName] = useState('');
    const [quickSpouseProfession, setQuickSpouseProfession] = useState('');
    const [quickSpouseWorkplace, setQuickSpouseWorkplace] = useState('');
    const [quickSpouseContact, setQuickSpouseContact] = useState('');
    const [quickSpouseSocialMedia, setQuickSpouseSocialMedia] = useState('');
    const [quickSpouseBloodGroup, setQuickSpouseBloodGroup] = useState('');
    const [quickSpouseImage, setQuickSpouseImage] = useState('');
    const [isUploadingSpouseImage, setIsUploadingSpouseImage] = useState(false);
    const [isSavingQuickSpouse, setIsSavingQuickSpouse] = useState(false);

    const [currentSpouses, setCurrentSpouses] = useState([]);

    // If initialData changes (e.g. when opening form with different context), update state
    useEffect(() => {
        if (isOpen) {
            const sanitizedData = { ...initialData };
            // Ensure no null values for string fields to avoid React warnings in inputs
            Object.keys(sanitizedData).forEach(key => {
                if (sanitizedData[key] === null) sanitizedData[key] = '';
            });

            // Pre-fill name_bangla or name_english if missing from legacy records
            let name_bangla = sanitizedData.name_bangla || '';
            let name_english = sanitizedData.name_english || '';
            if (!name_bangla && sanitizedData.full_name && /[\u0980-\u09FF]/.test(sanitizedData.full_name)) {
                name_bangla = sanitizedData.full_name;
            }
            if (!name_english && sanitizedData.full_name && /[A-Za-z]/.test(sanitizedData.full_name)) {
                name_english = sanitizedData.full_name;
            }

            const isInitialSpouse = Boolean(
                sanitizedData.isSpouseFlag ||
                sanitizedData.role === 'spouse' ||
                sanitizedData.relationType === 'spouse' ||
                sanitizedData.is_spouse ||
                (sanitizedData.gender === 'Female' && (sanitizedData.spouse_id || sanitizedData.husband_id)) ||
                (sanitizedData.gender === 'Female' && !sanitizedData.father_id)
            );

            // isRoot is STRICTLY true ONLY for male root members without father_id
            const isRootVal = sanitizedData.gender === 'Male' && !isInitialSpouse && (initialData.id ? (!initialData.father_id) : (initialData.father_id ? false : prev.isRoot));

            // Extract husband if provided in initialData to instantly sync generation level
            const initialHusband = (sanitizedData.spouses && sanitizedData.spouses.find(s => s.gender === 'Male')) ||
                                   sanitizedData.husband ||
                                   (sanitizedData.spouse_id && members.find(m => m.id === sanitizedData.spouse_id));
            let initialLevel = sanitizedData.level;
            if (isInitialSpouse && initialHusband && initialHusband.level) {
                initialLevel = initialHusband.level;
            }

            setFormData(prev => ({
                ...prev,
                ...sanitizedData,
                name_bangla,
                name_english,
                gender: isInitialSpouse ? 'Female' : (sanitizedData.gender || prev.gender),
                level: initialLevel,
                isRoot: isRootVal,
                isSpouseFlag: isInitialSpouse ? true : sanitizedData.isSpouseFlag
            }));
            fetchMembers();
            if (initialData.id) {
                if (initialData.spouses && Array.isArray(initialData.spouses)) {
                    setCurrentSpouses(initialData.spouses);
                } else if (initialHusband) {
                    setCurrentSpouses([initialHusband]);
                }
                fetchContactDetails(initialData.id);
            } else {
                if (initialHusband) {
                    setCurrentSpouses([initialHusband]);
                } else {
                    setCurrentSpouses([]);
                }
            }
        }
    }, [isOpen, initialData]);

    const fetchContactDetails = async (id) => {
        try {
            const res = await api.get(`/members/${id}`);
            const spousesList = res.data.spouses || [];
            setCurrentSpouses(spousesList);

            // If female spouse, auto-sync level to her husband's level
            if (res.data.gender === 'Female' || formData.gender === 'Female') {
                const husband = spousesList.find(s => s.gender === 'Male') || spousesList[0];
                if (husband && husband.level) {
                    setFormData(prev => ({
                        ...prev,
                        isSpouseFlag: true,
                        level: husband.level
                    }));
                }
            }
        } catch (err) {
            console.error('Error fetching member details:', err);
        }
    };

    // Level and Mother calculation logic
    useEffect(() => {
        if (formData.isRoot) {
            setFormData(prev => ({ ...prev, father_id: '' }));
            setPossibleMothers([]);
        } else if (formData.father_id) {
            // Always fetch spouses if father_id is present
            fetchFatherSpouses(formData.father_id);

            // Level calculation needs the father object from members list
            const father = members.find(m => String(m.id) === String(formData.father_id));
            if (father) {
                setFormData(prev => ({ ...prev, level: (father.level || 0) + 1 }));
            }
        } else {
            // Neither Root nor has Father selected
            setPossibleMothers([]);
            if (formData.mother_id) setFormData(prev => ({ ...prev, mother_id: '' }));
        }
    }, [formData.father_id, formData.isRoot, members]);

    const fetchFatherSpouses = async (fatherId) => {
        try {
            const res = await api.get(`/family/relatives/${fatherId}`);
            const spouses = res.data.spouses || [];
            setPossibleMothers(spouses);

            // If only one spouse, auto-select as mother (forced as per user requirement)
            if (spouses.length === 1) {
                setFormData(prev => ({ ...prev, mother_id: spouses[0].id }));
            }
        } catch (err) {
            console.error('Error fetching father spouses:', err);
            setPossibleMothers([]);
        }
    };

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/members');
            const data = res.data;
            setMembers(data);
            setPossibleFathers(data.filter(m => m.gender === 'Male'));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSpouseImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            setIsUploadingSpouseImage(true);
            const res = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.filePath) {
                setQuickSpouseImage(res.data.filePath);
            }
        } catch (err) {
            console.error(err);
            alert('Error uploading image: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsUploadingSpouseImage(false);
        }
    };

    const handleQuickAddSpouse = async () => {
        if (!quickSpouseNameBangla?.trim() && !quickSpouseNameEnglish?.trim() && !quickSpouseName?.trim()) {
            return alert('Name (Bangla or English) is required');
        }

        setIsSavingQuickSpouse(true);
        try {
            const father = members.find(m => m.id === formData.father_id);
            const levelVal = quickAddType === 'mother' ? (father?.level || formData.level) : formData.level;

            const bName = quickSpouseNameBangla?.trim() || '';
            const eName = quickSpouseNameEnglish?.trim() || '';
            const fullName = bName && eName ? `${bName} (${eName})` : (bName || eName || quickSpouseName?.trim());

            const payload = {
                full_name: fullName,
                name_bangla: bName,
                name_english: eName,
                gender: 'Female',
                blood_group: quickSpouseBloodGroup || null,
                occupation: quickSpouseProfession || null,
                workplace: quickSpouseWorkplace?.trim() || null,
                contact_number: quickSpouseContact?.trim() || null,
                social_media: quickSpouseSocialMedia?.trim() || null,
                profile_image_url: quickSpouseImage || null,
                level: parseInt(levelVal) || 1,
                country: formData.country,
                district: formData.district,
                upazila: formData.upazila,
                village: formData.village,
                home_name: formData.home_name,
                is_alive: true
            };

            // If adding as mother, link to father
            if (quickAddType === 'mother' && formData.father_id) {
                payload.spouse_id = formData.father_id;
            }

            const res = await api.post('/members', payload);
            const newSpouse = res.data;

            // Re-fetch members to include new one
            await fetchMembers();

            if (quickAddType === 'mother') {
                // If we added a mother, we need to refresh the father's spouses list
                await fetchFatherSpouses(formData.father_id);
                setFormData(prev => ({ ...prev, mother_id: newSpouse.id }));
            } else {
                // If we are editing an existing member, we should link them
                if (initialData.id) {
                    await api.post(`/members/${initialData.id}/spouses`, { spouseId: newSpouse.id });
                    fetchContactDetails(initialData.id);
                } else {
                    // For new member creation, we just add to local spouses list to be linked on save
                    setCurrentSpouses(prev => [...prev, newSpouse]);
                }
            }

            // Reset and close quick add
            setQuickSpouseName('');
            setQuickSpouseNameBangla('');
            setQuickSpouseNameEnglish('');
            setQuickSpouseProfession('');
            setQuickSpouseWorkplace('');
            setQuickSpouseBloodGroup('');
            setQuickSpouseContact('');
            setQuickSpouseSocialMedia('');
            setQuickSpouseImage('');
            setIsQuickAddOpen(false);
        } catch (err) {
            console.error('Error quick adding spouse:', err);
            alert('Failed to add spouse profile: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSavingQuickSpouse(false);
        }
    };

    const handleDeleteSpouse = async (spouse) => {
        if (!window.confirm(`Are you sure you want to delete ${spouse.full_name}? This will move their record to the RECYCLE BIN.`)) return;

        try {
            // Delete the member (moves to recycle bin) but only the spouse, not the generation
            await api.delete(`/members/${spouse.id}?spouseOnly=true`);
            setCurrentSpouses(prev => prev.filter(s => s.id !== spouse.id));

            // Refresh local list and parent state
            if (fetchMembers) fetchMembers();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error handling spouse deletion:', err);
            alert('Failed to process spouse removal: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const res = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.filePath) {
                setFormData(prev => ({ ...prev, profile_image_url: res.data.filePath }));
            }
        } catch (err) {
            console.error(err);
            alert('Error uploading image: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const editingId = initialData.id;
        const payload = { ...formData };

        if (!formData.name_bangla?.trim() && !formData.name_english?.trim() && !formData.full_name?.trim()) {
            alert('Please provide at least one name (Bangla or English).');
            return;
        }

        const bName = formData.name_bangla?.trim() || '';
        const eName = formData.name_english?.trim() || '';
        const computedFullName = bName && eName ? `${bName} (${eName})` : (bName || eName || formData.full_name?.trim() || '');

        payload.name_bangla = bName;
        payload.name_english = eName;
        payload.full_name = computedFullName;

        // Remove null bytes from any string to prevent PostgreSQL UTF8 0x00 errors
        Object.keys(payload).forEach(key => {
            if (typeof payload[key] === 'string') {
                payload[key] = payload[key].replace(/\0/g, '');
            }
        });

        if (formData.isRoot) {
            payload.father_id = null;
        }
        // Handle optional fields
        if (!payload.mother_id) payload.mother_id = null;
        if (!payload.spouse_id) payload.spouse_id = null;
        if (!payload.father_id) payload.father_id = null;

        // For new members, take the spouses from currentSpouses state if any
        if (!editingId && currentSpouses.length > 0) {
            payload.spouse_id = currentSpouses[0].id; // Primary spouse for creation
        }

        // For spouses: gender is ALWAYS Female, level is always equal to her husband's level
        if (isSpouseRole) {
            payload.gender = 'Female';
            payload.father_id = null;
            payload.mother_id = null;
            const husband = currentSpouses.find(s => s.gender === 'Male') || 
                            currentSpouses[0] || 
                            (formData.spouse_id && members.find(m => m.id === formData.spouse_id)) ||
                            initialData.husband;
            if (husband && husband.level) {
                payload.level = husband.level;
            }
        }

        delete payload.isRoot;

        try {
            if (editingId) {
                await api.put(`/members/${editingId}`, payload);
            } else {
                await api.post('/members', payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error saving data: ' + (err.response?.data?.error || err.message));
        }
    };

    const isSpouseRole = Boolean(
        formData.isSpouseFlag ||
        initialData.isSpouseFlag ||
        initialData.role === 'spouse' ||
        initialData.relationType === 'spouse' ||
        initialData.is_spouse ||
        (formData.gender === 'Female' && (formData.spouse_id || initialData.spouse_id || (currentSpouses && currentSpouses.length > 0))) ||
        (formData.gender === 'Female' && !formData.father_id && !formData.mother_id)
    );

    const isMaleRootMember = Boolean(
        !isSpouseRole &&
        formData.gender === 'Male' &&
        (formData.isRoot || (!formData.father_id && !initialData.father_id))
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 animate-fade-in text-left max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif text-orange-900 font-bold">
                        {initialData.id ? t('সদস্য তথ্য সম্পাদনা', 'Edit Member Profile') : t('নতুন সদস্য যোগ করুন', 'Add New Member')}
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-full hover:bg-stone-100">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-10">{t('তথ্য লোড হচ্ছে...', 'Loading form data...')}</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section: Basic Info */}
                        <div>
                            <h3 className="text-lg font-bold text-orange-800 border-b border-orange-100 pb-2 mb-3">
                                {t('সাধারণ তথ্য', 'Basic Information')}
                            </h3>
                            
                            {/* Two Name Fields: Bangla and English */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-orange-50/40 p-3 rounded-xl border border-orange-100 transition-all hover:border-orange-300">
                                    <label className="block text-xs font-bold text-orange-950 uppercase mb-1.5 flex items-center justify-between">
                                        <span>{t('নাম (বাংলা)', 'Name (Bangla)')}</span>
                                        <span className="text-[10px] text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded font-medium">{t('বাংলা হরফে', 'Bangla Script')}</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-stone-800 font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" 
                                        value={formData.name_bangla} 
                                        onChange={e => setFormData({ ...formData, name_bangla: e.target.value })}
                                        placeholder={t('যেমন: রামগতি মণ্ডল', 'e.g. Ramgoti Mandal')} 
                                    />
                                </div>
                                <div className="bg-orange-50/40 p-3 rounded-xl border border-orange-100 transition-all hover:border-orange-300">
                                    <label className="block text-xs font-bold text-orange-950 uppercase mb-1.5 flex items-center justify-between">
                                        <span>{t('নাম (ইংরেজি)', 'Name (English)')}</span>
                                        <span className="text-[10px] text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded font-medium">{t('ইংরেজি হরফে', 'English')}</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-stone-800 font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" 
                                        value={formData.name_english} 
                                        onChange={e => setFormData({ ...formData, name_english: e.target.value })}
                                        placeholder={t('যেমন: Ramgoti Mandal', 'e.g. Ramgoti Mandal')} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('লিঙ্গ', 'Gender')}</label>
                                    {isSpouseRole ? (
                                        <div className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-100 text-stone-700 font-bold text-sm flex items-center justify-between">
                                            <span>{t('নারী', 'Female')}</span>
                                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                                {t('স্থির (পরিবর্তনযোগ্য নয়)', 'Fixed')}
                                            </span>
                                        </div>
                                    ) : (
                                        <select className="w-full p-2 border rounded" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                            <option value="">{t('নির্বাচন করুন', 'Select')}</option>
                                            <option value="Male">{t('পুরুষ', 'Male')}</option>
                                            <option value="Female">{t('নারী', 'Female')}</option>
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('রক্তের গ্রুপ', 'Blood Group')}</label>
                                    <select className="w-full p-2 border rounded" value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })}>
                                        <option value="">{t('অজানা', 'Unknown')}</option>
                                        <option value="A+">A+</option> <option value="A-">A-</option>
                                        <option value="B+">B+</option> <option value="B-">B-</option>
                                        <option value="O+">O+</option> <option value="O-">O-</option>
                                        <option value="AB+">AB+</option> <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div>
                                    <OccupationSelect
                                        value={formData.occupation}
                                        onChange={(val) => setFormData(prev => ({ ...prev, occupation: val }))}
                                        label={t('পেশা', 'Occupation')}
                                        placeholder={t('পেশা নির্বাচন করুন বা নতুন যোগ করুন...', 'Select occupation or add new...')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('কর্মস্থল', 'Workplace')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.workplace} onChange={e => setFormData({ ...formData, workplace: e.target.value })} placeholder={t('যেমন: ঢাকা, বাংলাদেশ', 'e.g. Google, Dhaka')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('শিক্ষাগত যোগ্যতা', 'Education')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('জীবিত আছেন?', 'Is Alive?')}</label>
                                    <select className="w-full p-2 border rounded" value={formData.is_alive} onChange={e => setFormData({ ...formData, is_alive: e.target.value === 'true' })}>
                                        <option value="true">{t('হ্যাঁ', 'Yes')}</option>
                                        <option value="false">{t('না (প্রয়াত)', 'No (Deceased)')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('জন্ম তারিখ', 'Birth Date')}</label>
                                    <input type="date" className="w-full p-2 border rounded" value={formData.birth_date ? formData.birth_date.split('T')[0] : ''} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                                </div>
                                {!formData.is_alive && (
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('মৃত্যু তারিখ', 'Death Date')}</label>
                                        <input type="date" className="w-full p-2 border rounded" value={formData.death_date ? formData.death_date.split('T')[0] : ''} onChange={e => setFormData({ ...formData, death_date: e.target.value })} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Relationships */}
                        <div>
                            <h3 className="text-lg font-bold text-orange-800 border-b border-orange-100 pb-2 mb-3">
                                {t('পারিবারিক সম্পর্ক', 'Family Relationships')}
                            </h3>

                            {isSpouseRole ? (
                                /* Spouse View: Generation Level is LOCKED to husband, not editable */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/40 p-4 rounded-xl border border-orange-100">
                                    {/* Generation Level - Locked for spouses */}
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                                            {t('প্রজন্ম স্তর', 'Generation Level')}
                                        </label>
                                        <div className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-100 text-stone-700 font-bold text-sm flex items-center justify-between">
                                            <span>{formData.level ? (isBn ? `${formData.level}ম প্রজন্ম` : `Generation ${formData.level}`) : t('অজানা', 'N/A')}</span>
                                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                                {t('স্বামীর সমান (লক করা)', 'Locked to Husband')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1">
                                            {t('সকল সহধর্মিণীর প্রজন্ম স্তর স্বামীর সমান থাকে এবং পরিবর্তনযোগ্য নয়।', 'All spouses automatically share their husband\'s generation level and cannot be edited.')}
                                        </p>
                                    </div>

                                    {/* Husband Display */}
                                    {(() => {
                                        const husband = currentSpouses.find(s => s.gender === 'Male') || 
                                                        currentSpouses[0] || 
                                                        (formData.spouse_id && members.find(m => m.id === formData.spouse_id)) ||
                                                        initialData.husband;
                                        return husband ? (
                                            <div>
                                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                                                    {t('স্বামী', 'Husband')}
                                                </label>
                                                <div className="w-full p-2.5 border border-pink-200 rounded-lg bg-pink-50/50 text-stone-800 font-bold text-sm flex items-center justify-between">
                                                    <span className="truncate">{formatName(husband)}</span>
                                                    {husband.level && (
                                                        <span className="text-xs font-semibold text-rose-600 bg-white px-2 py-0.5 rounded border border-pink-200 shrink-0 ml-2">
                                                            {isBn ? `${husband.level}ম প্রজন্ম` : `Gen ${husband.level}`}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-stone-400 mt-1">
                                                    {t('বংশলতিকার মূল সদস্য (স্বামী)', 'Lineage Household Member (Husband)')}
                                                </p>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            ) : (
                                <>
                                    {!initialData.father_id && !initialData.id && formData.gender === 'Male' && (
                                        <div className="flex gap-4 mb-4">
                                            <label className="flex items-center gap-2 cursor-pointer border p-2 rounded hover:bg-orange-50">
                                                <input type="radio" checked={formData.isRoot} onChange={() => setFormData({ ...formData, isRoot: true })} />
                                                <span className="font-bold text-sm">{t('রুট সদস্য (ম্যানুয়াল লেভেল)', 'Review as Root (Manual Level)')}</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer border p-2 rounded hover:bg-orange-50">
                                                <input type="radio" checked={!formData.isRoot} onChange={() => setFormData({ ...formData, isRoot: false })} />
                                                <span className="font-bold text-sm">{t(`পিতা আছে (${formData.level}ম প্রজন্ম)`, `Has Father (Gen ${formData.level})`)}</span>
                                            </label>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Generation Level - ONLY editable for Male Root Members */}
                                        {isMaleRootMember ? (
                                            <div>
                                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('প্রজন্ম স্তর *', 'Generation Level *')}</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 font-bold text-stone-800"
                                                    value={formData.level || 1}
                                                    onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                                                />
                                                <p className="text-xs text-stone-400 mt-1">{t('বংশের প্রধান পুরুষ পূর্বপুরুষের জন্য লেভেল (যেমন: ১, ৯ ইত্যাদি)', 'Manual level for Male House Root (e.g., 1, 9, etc.)')}</p>
                                            </div>
                                        ) : (!initialData.id ? (
                                            <div>
                                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('প্রজন্ম স্তর', 'Generation Level')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-2 border rounded bg-stone-100 text-stone-500 cursor-not-allowed font-bold"
                                                    value={formData.level || ''}
                                                    readOnly
                                                    disabled
                                                />
                                                <p className="text-xs text-stone-400 mt-1">{t('পিতার উপর ভিত্তি করে স্বয়ংক্রিয়ভাবে নির্ধারিত', 'Automatically determined based on Father')}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('প্রজন্ম স্তর', 'Generation Level')}</label>
                                                <div className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-100 text-stone-600 font-bold text-sm flex items-center justify-between">
                                                    <span>{formData.level ? (isBn ? `${formData.level}ম প্রজন্ম` : `Generation ${formData.level}`) : t('অজানা', 'N/A')}</span>
                                                    <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
                                                        {formData.gender === 'Female' ? t('স্বয়ংক্রিয়ভাবে সংরক্ষিত', 'Auto-assigned') : t('পিতার সাথে লক করা', 'Locked to Father')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-400 mt-1">{t('বংশানুক্রমিক স্তর স্বয়ংক্রিয়ভাবে সংরক্ষিত', 'Lineage level automatically preserved')}</p>
                                            </div>
                                        ))}

                                        {/* Father - Only show when adding a non-root member */}
                                        {(!initialData.id && !formData.isRoot) && (
                                            <div>
                                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('পিতা *', 'Father *')}</label>
                                                {initialData.father_id ? (
                                                    <input
                                                        type="text"
                                                        className="w-full p-2 border rounded bg-stone-100 text-stone-600 font-bold"
                                                        value={formatName(possibleFathers.find(m => m.id === formData.father_id)) || t('পিতার সাথে সংযুক্ত', 'Auto-linked to Parent')}
                                                        readOnly
                                                        disabled
                                                    />
                                                ) : (
                                                    <select className="w-full p-2 border rounded" value={formData.father_id || ''} onChange={e => setFormData({ ...formData, father_id: e.target.value })}>
                                                        <option value="">{t('পিতা নির্বাচন করুন', 'Select Father')}</option>
                                                        {possibleFathers.map(m => <option key={m.id} value={m.id}>{formatName(m)} ({t(`${m.level}ম প্রজন্ম`, `Gen ${m.level}`)})</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        {/* Mother - Show for all non-root members (Add and Edit) */}
                                        {(!formData.isRoot) && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="block text-xs font-bold text-stone-500 uppercase">{t('মাতা', 'Mother')}</label>
                                                </div>
                                                <select
                                                    className="w-full p-2 border rounded disabled:bg-stone-50"
                                                    value={formData.mother_id || ''}
                                                    onChange={e => setFormData({ ...formData, mother_id: e.target.value })}
                                                    disabled={!formData.father_id || (possibleMothers.length === 0 && !loading)}
                                                >
                                                    <option value="">{formData.father_id ? (possibleMothers.length > 0 ? t('মাতা নির্বাচন করুন', 'Select Mother') : t('কোনো পত্নী পাওয়া যায়নি', 'No Spouses Found')) : t('আগে পিতা নির্বাচন করুন', 'Select Father First')}</option>
                                                    {possibleMothers.map(m => <option key={m.id} value={m.id}>{formatName(m)}</option>)}
                                                </select>
                                                {possibleMothers.length > 0 && (
                                                    <p className="text-[10px] text-orange-600 mt-1 italic">{t('নির্বাচিত পিতার পত্নীদের দেখানো হচ্ছে', 'Showing spouses of selected father')}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Manage Spouses - For male members */}
                                        {formData.gender === 'Male' && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="block text-xs font-bold text-stone-500 uppercase">{t('জীবনসঙ্গী ব্যবস্থাপনা', 'Manage Spouses')}</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setQuickAddType('spouse');
                                                            setIsQuickAddOpen(true);
                                                        }}
                                                        className="text-[10px] text-orange-600 font-bold hover:underline"
                                                    >
                                                        + {t('নতুন যোগ করুন', 'ADD NEW')}
                                                    </button>
                                                </div>

                                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                    {currentSpouses.length === 0 ? (
                                                        <div className="p-3 border border-dashed rounded text-center text-stone-400 text-xs italic">
                                                            {t('কোনো জীবনসঙ্গী নথিভুক্ত নেই।', 'No spouses registered.')}
                                                        </div>
                                                    ) : (
                                                        currentSpouses.map(spouse => (
                                                            <div key={spouse.id} className="flex items-center justify-between p-2 bg-stone-50 rounded border group">
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    {spouse.profile_image_url ? (
                                                                        <img src={spouse.profile_image_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] text-orange-600 font-bold">
                                                                            {spouse.full_name?.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-sm font-medium text-stone-700 truncate">{formatName(spouse)}</span>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onEditMember?.(spouse.id)}
                                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                        title={t('প্রোফাইল সম্পাদনা', 'Edit Spouse Profile')}
                                                                    >
                                                                        <Save size={14} className="rotate-90" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteSpouse(spouse)}
                                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                        title={t('মুছুন বা আনলিংক করুন', 'Delete or Unlink Spouse')}
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Section: Contact & Location */}
                        <div>
                            <h3 className="text-lg font-bold text-orange-800 border-b border-orange-100 pb-2 mb-3">
                                {t('যোগাযোগ ও অবস্থান', 'Contact & Location')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('মোবাইল নম্বর', 'Phone Number')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.contact_number} onChange={e => setFormData({ ...formData, contact_number: e.target.value })} placeholder="+8801XXXXXXXXX" />
                                </div>
                                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('সোশ্যাল মিডিয়া লিংক', 'Social Media Link')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.social_media} onChange={e => setFormData({ ...formData, social_media: e.target.value })} placeholder="https://facebook.com/..." />
                                </div>

                                {/* Auto-filled geographic data can be edited here */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('বিভাগ', 'Division')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('জেলা', 'District')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('উপজেলা', 'Upazila')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.upazila} onChange={e => setFormData({ ...formData, upazila: e.target.value })} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('গ্রাম', 'Village')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.village} onChange={e => setFormData({ ...formData, village: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('বাড়ির নাম', 'Home Name')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.home_name} onChange={e => setFormData({ ...formData, home_name: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('বর্তমান ঠিকানা', 'Present Address')}</label>
                                    <input type="text" className="w-full p-2 border rounded" value={formData.present_address} onChange={e => setFormData({ ...formData, present_address: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Section: Bio & Media */}
                        <div>
                            <h3 className="text-lg font-bold text-orange-800 border-b border-orange-100 pb-2 mb-3">
                                {t('জীবনবৃত্তান্ত ও ছবি', 'Bio & Media')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('প্রোফাইল ছবি', 'Profile Image')}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="w-full p-2 border rounded"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    {formData.profile_image_url && (
                                        <div className="mt-2 text-xs text-green-600">
                                            {t('ছবি আপলোড হয়েছে:', 'Image Uploaded:')} <a href={formData.profile_image_url} target="_blank" rel="noreferrer" className="underline">{t('দেখুন', 'View')}</a>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">{t('জীবনবৃত্তান্ত', 'Bio')}</label>
                                    <textarea className="w-full p-2 border rounded h-20" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}></textarea>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition shadow-lg mt-4 flex justify-center gap-2">
                            <Save size={20} /> {initialData.id ? t('তথ্য আপডেট করুন', 'Update Member') : t('সদস্য সংরক্ষণ করুন', 'Create Member')}
                        </button>
                    </form>
                )}
            </div>

            {/* Quick Add Spouse Modal Overlay */}
            {isQuickAddOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-orange-100 pb-3 mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-orange-950 font-serif">
                                    {quickAddType === 'mother' ? t('মাতার প্রোফাইল যোগ করুন', "Add Mother's Profile") : t('পত্নীর তথ্য যোগ করুন', "Add Spouse Profile")}
                                </h4>
                                <p className="text-xs text-stone-500 mt-0.5">{t('জীবনসঙ্গীর বিবরণ প্রদান করুন', 'Enter details to create and link spouse')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsQuickAddOpen(false)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Profile Picture Upload & Preview */}
                            <div className="flex items-center gap-4 p-3 bg-orange-50/70 rounded-xl border border-orange-100">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-stone-100 border-2 border-orange-300 flex-shrink-0 flex items-center justify-center shadow-inner">
                                    {quickSpouseImage ? (
                                        <img src={quickSpouseImage} alt="Spouse Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-stone-400" />
                                    )}
                                    {isUploadingSpouseImage && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                                        {t('প্রোফাইল ছবি', 'Profile Picture')}
                                    </label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-orange-800 border border-orange-300 rounded-lg hover:bg-orange-100 hover:border-orange-400 transition shadow-sm active:scale-95">
                                            <Camera size={14} className="text-orange-600" />
                                            <span>{isUploadingSpouseImage ? t('আপলোড হচ্ছে...', 'Uploading...') : quickSpouseImage ? t('ছবি পরিবর্তন', 'Change Photo') : t('ছবি আপলোড', 'Upload Photo')}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleSpouseImageUpload}
                                                disabled={isUploadingSpouseImage}
                                            />
                                        </label>
                                        {quickSpouseImage && (
                                            <button
                                                type="button"
                                                onClick={() => setQuickSpouseImage('')}
                                                className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition font-medium"
                                            >
                                                {t('মুছুন', 'Remove')}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-stone-400 mt-1">{t('JPG, PNG, বা WebP ছবি আপলোড করুন', 'Upload JPG, PNG, or WebP photo')}</p>
                                </div>
                            </div>

                            {/* Name Fields (Bangla & English) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                                        {t('নাম (বাংলা)', 'Name (Bangla)')}
                                    </label>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full p-2.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                                        value={quickSpouseNameBangla}
                                        onChange={e => setQuickSpouseNameBangla(e.target.value)}
                                        placeholder={t('যেমন: অনামিকা মণ্ডল', 'e.g. Anamika Mandal')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                                        {t('নাম (ইংরেজি)', 'Name (English)')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                                        value={quickSpouseNameEnglish}
                                        onChange={e => setQuickSpouseNameEnglish(e.target.value)}
                                        placeholder={t('যেমন: Anamika Mandal', 'e.g. Anamika Mandal')}
                                    />
                                </div>
                            </div>

                            {/* Profession & Workplace */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <OccupationSelect
                                        value={quickSpouseProfession}
                                        onChange={(val) => setQuickSpouseProfession(val)}
                                        label={t('পেশা', 'Profession')}
                                        placeholder={t('পেশা নির্বাচন করুন...', 'Select profession...')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                                        {t('কর্মস্থল', 'Workplace')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                                        value={quickSpouseWorkplace}
                                        onChange={e => setQuickSpouseWorkplace(e.target.value)}
                                        placeholder={t('যেমন: সরকারি প্রাথমিক বিদ্যালয়', 'e.g. Govt Primary School')}
                                    />
                                </div>
                            </div>

                            {/* Blood Group & Contact Number */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                                        {t('রক্তের গ্রুপ', 'Blood Group')}
                                    </label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-white text-stone-800"
                                        value={quickSpouseBloodGroup}
                                        onChange={e => setQuickSpouseBloodGroup(e.target.value)}
                                    >
                                        <option value="">{t('নির্বাচন করুন', 'Select')}</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                                        {t('মোবাইল নম্বর', 'Contact Number')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                                        value={quickSpouseContact}
                                        onChange={e => setQuickSpouseContact(e.target.value)}
                                        placeholder="+8801XXXXXXXXX"
                                    />
                                </div>
                            </div>

                            {/* Social Media */}
                            <div>
                                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                                    {t('সোশ্যাল মিডিয়া', 'Social Media')}
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                                    value={quickSpouseSocialMedia}
                                    onChange={e => setQuickSpouseSocialMedia(e.target.value)}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickAddOpen(false)}
                                    className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200 transition active:scale-[0.99] text-sm"
                                >
                                    {t('বাতিল', 'Cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleQuickAddSpouse}
                                    disabled={isSavingQuickSpouse}
                                    className="flex-1 py-2.5 bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition active:scale-[0.99] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                >
                                    {isSavingQuickSpouse ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>{t('সংরক্ষণ হচ্ছে...', 'Saving...')}</span>
                                        </>
                                    ) : (
                                        <span>{t('যোগ ও লিংক করুন', 'Create & Link')}</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberForm;
