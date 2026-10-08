import React, { useState, useEffect } from 'react';
import { 
    X, GraduationCap, Upload, FileText, CheckCircle2, AlertCircle, 
    User, Search, Building2, BookOpen, Calendar, Award, Sparkles, Eye, ArrowRight, ExternalLink, RefreshCw, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import MemberSelector from './MemberSelector';

const ACHIEVEMENT_OPTIONS = [
    { id: 'এসএসসি (GPA-5.00)', bn: 'এসএসসি (GPA 5.00)', en: 'Got GPA-5 in SSC' },
    { id: 'এইচএসসি (GPA-5.00)', bn: 'এইচএসসি (GPA 5.00)', en: 'Got GPA-5 in HSC' },
    { id: 'পাবলিক বিশ্ববিদ্যালয়ে ভর্তি', bn: 'পাবলিক বিশ্ববিদ্যালয়ে ভর্তি', en: 'Got Chance in Public University', isUni: true },
    { id: 'প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (বুয়েট/কুয়েট/রুয়েট ইত্যাদি)', bn: 'প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (বুয়েট/ইত্যাদি)', en: 'Got Chance in Engineering University (BUET/etc.)', isUni: true },
    { id: 'সরকারি মেডিকেল কলেজে ভর্তি', bn: 'সরকারি মেডিকেল কলেজে ভর্তি (এমবিবিএস)', en: 'Got Chance in Medical College', isUni: true },
    { id: 'জাতীয় / আন্তর্জাতিক বৃত্তিপ্রাপ্ত', bn: 'জাতীয় / আন্তর্জাতিক মেধা বৃত্তি', en: 'National / International Scholarship' },
    { id: 'জেএসসি (বৃত্তি / GPA-5)', bn: 'জেএসসি (বৃত্তি / GPA 5.00)', en: 'Got GPA-5 in JSC' },
    { id: 'পিএসসি / সমাপনী (বৃত্তি / GPA-5)', bn: 'পিএসসি / সমাপনী (বৃত্তি / GPA 5.00)', en: 'Got GPA-5 in PSC / Primary' },
    { id: 'অন্যান্য বিশেষ মেধা ও স্বীকৃতি', bn: 'অন্যান্য বিশেষ মেধা ও স্বীকৃতি', en: 'Other Academic Excellence' }
];

const BrilliantStudentRequestModal = ({ isOpen, onClose, onSuccess, initialMember = null }) => {
    const { user } = useAuth();
    const { t, isBn, formatName } = useLanguage();

    const [forWhom, setForWhom] = useState('self'); // 'self' | 'other'
    const [selectedCandidate, setSelectedCandidate] = useState(initialMember);
    const [selfMemberLoading, setSelfMemberLoading] = useState(false);

    // Form inputs
    const [achievementType, setAchievementType] = useState('এসএসসি (GPA-5.00)');
    const [examYear, setExamYear] = useState(new Date().getFullYear().toString());
    const [institution, setInstitution] = useState('');
    const [subjectDepartment, setSubjectDepartment] = useState('');
    const [resultGrade, setResultGrade] = useState('GPA 5.00');
    const [description, setDescription] = useState('');

    // Multiple documents upload & preview state
    // Array of: { id, file, url, localUrl, name, size, isPdf, type, uploading, error }
    const [documents, setDocuments] = useState([]);
    const [activeLightboxDoc, setActiveLightboxDoc] = useState(null);
    const fileInputRef = React.useRef(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Clean up all local blob URLs on unmount
    useEffect(() => {
        return () => {
            documents.forEach(doc => {
                if (doc.localUrl && doc.localUrl.startsWith('blob:')) {
                    try {
                        URL.revokeObjectURL(doc.localUrl);
                    } catch (e) {}
                }
            });
        };
    }, [documents]);

    // Fetch user's own linked member data when modal opens
    useEffect(() => {
        if (!isOpen) return;

        setError('');
        setSuccessMessage('');

        if (initialMember) {
            setSelectedCandidate(initialMember);
            setForWhom(user?.member_id === initialMember.id ? 'self' : 'other');
            return;
        }

        const fetchUserMember = async () => {
            const memberId = user?.member_id;
            if (memberId) {
                try {
                    setSelfMemberLoading(true);
                    const res = await api.get(`/members/${memberId}`);
                    setSelectedCandidate(res.data);
                    setForWhom('self');
                } catch (err) {
                    console.error('Failed to load user member profile:', err);
                    setForWhom('other');
                } finally {
                    setSelfMemberLoading(false);
                }
            } else {
                setForWhom('other');
                setSelectedCandidate(null);
            }
        };

        fetchUserMember();
    }, [isOpen, user?.member_id, initialMember]);

    const handleForWhomChange = async (target) => {
        setForWhom(target);
        setError('');
        if (target === 'self') {
            if (user?.member_id) {
                try {
                    setSelfMemberLoading(true);
                    const res = await api.get(`/members/${user.member_id}`);
                    setSelectedCandidate(res.data);
                } catch (err) {
                    console.error('Failed to load user member profile:', err);
                } finally {
                    setSelfMemberLoading(false);
                }
            } else {
                setSelectedCandidate(null);
            }
        } else {
            // For someone else
            setSelectedCandidate(null);
        }
    };

    const handleFileUpload = async (e) => {
        const rawFiles = Array.from(e.target.files || []);
        if (rawFiles.length === 0) return;

        setError('');

        const validFiles = [];
        for (const file of rawFiles) {
            // Check 10MB limit per file
            if (file.size > 10 * 1024 * 1024) {
                setError(t(`"${file.name}" ফাইলের আকার ১০MB-এর বেশি। অনুগ্রহ করে ১০MB-এর নিচের ফাইল যুক্ত করুন।`, `"${file.name}" exceeds 10MB. Please select files under 10MB.`));
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            if (e.target) e.target.value = '';
            return;
        }

        // Generate immediate document items with local preview blob URLs
        const newItems = validFiles.map(file => {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const formattedSize = file.size > 1024 * 1024
                ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                : (file.size / 1024).toFixed(1) + ' KB';
            let localUrl = null;
            try {
                localUrl = URL.createObjectURL(file);
            } catch (err) {
                console.warn('Could not create object URL:', err);
            }
            return {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                file,
                url: '',
                localUrl,
                name: file.name,
                size: formattedSize,
                isPdf,
                type: isPdf ? 'document' : 'photo',
                uploading: true
            };
        });

        // Add to state immediately so previews appear in a line
        setDocuments(prev => [...prev, ...newItems]);

        // Upload files in parallel
        await Promise.all(
            newItems.map(async (item) => {
                try {
                    const formData = new FormData();
                    formData.append('file', item.file);

                    const res = await api.post('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    const uploadedUrl = res.data?.filePath || res.data?.fileUrl;

                    if (uploadedUrl) {
                        setDocuments(prev => prev.map(d => 
                            d.id === item.id 
                                ? { ...d, url: uploadedUrl, uploading: false } 
                                : d
                        ));
                    } else {
                        throw new Error('Upload succeeded without file url');
                    }
                } catch (uploadErr) {
                    console.error('File upload failed for', item.name, uploadErr);
                    setDocuments(prev => prev.map(d => 
                        d.id === item.id 
                            ? { ...d, uploading: false, error: 'Upload failed' } 
                            : d
                    ));
                    setError(t(`"${item.name}" আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।`, `Failed to upload "${item.name}". Please try again.`));
                }
            })
        );

        if (e.target) {
            e.target.value = '';
        }
    };

    const handleRemoveDoc = (docId) => {
        setDocuments(prev => {
            const target = prev.find(d => d.id === docId);
            if (target?.localUrl && target.localUrl.startsWith('blob:')) {
                try {
                    URL.revokeObjectURL(target.localUrl);
                } catch (err) {}
            }
            return prev.filter(d => d.id !== docId);
        });
        if (activeLightboxDoc?.id === docId) {
            setActiveLightboxDoc(null);
        }
    };

    const selectedOptionInfo = ACHIEVEMENT_OPTIONS.find(o => o.id === achievementType) || ACHIEVEMENT_OPTIONS[0];
    const isUniversityOrHigher = selectedOptionInfo?.isUni || achievementType.includes('বিশ্ববিদ্যালয়') || achievementType.includes('মেডিকেল');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!user) {
            setError(t('আবেদন পাঠাতে অনুগ্রহ করে প্রথমে লগইন করুন।', 'Please login to submit a recognition request.'));
            return;
        }

        if (!selectedCandidate?.id) {
            setError(t('অনুগ্রহ করে কৃতি শিক্ষার্থী হিসেবে কাঙ্ক্ষিত সদস্যকে নির্বাচন করুন।', 'Please select the candidate member from the directory.'));
            return;
        }

        if (!institution.trim()) {
            setError(t('শিক্ষা প্রতিষ্ঠান বা বিশ্ববিদ্যালয়ের নাম আবশ্যক।', 'Institution or University name is required.'));
            return;
        }

        if (!examYear.trim()) {
            setError(t('পরীক্ষা বা ভর্তির সাল আবশ্যক।', 'Exam or admission year is required.'));
            return;
        }

        if (isUniversityOrHigher && !subjectDepartment.trim()) {
            setError(t('বিশ্ববিদ্যালয় বা উচ্চশিক্ষার ক্ষেত্রে বিষয় / বিভাগ উল্লেখ করা আবশ্যক।', 'Subject / Department is required for university admission.'));
            return;
        }

        const uploadingCount = documents.filter(d => d.uploading).length;
        if (uploadingCount > 0) {
            setError(t('কিছু ডকুমেন্ট এখনও আপলোড হচ্ছে। অনুগ্রহ করে এক মুহূর্ত অপেক্ষা করুন।', 'Some documents are still uploading. Please wait a moment.'));
            return;
        }

        const validDocs = documents.filter(d => d.url && !d.error);
        if (validDocs.length === 0) {
            setError(t('প্রমাণস্বরূপ মার্কশিট, এডমিট কার্ড বা প্রশংসাপত্রের ছবি অথবা পিডিএফ যুক্ত করা আবশ্যক।', 'Please upload a certificate, marksheet, or admit card (Photo or PDF).'));
            return;
        }

        try {
            setLoading(true);
            const payload = {
                member_id: selectedCandidate.id,
                achievement_type: achievementType,
                exam_year: examYear.trim(),
                institution: institution.trim(),
                subject_department: subjectDepartment ? subjectDepartment.trim() : null,
                result_grade: resultGrade ? resultGrade.trim() : null,
                documents: validDocs.map(d => ({
                    url: d.url,
                    type: d.type,
                    name: d.name,
                    size: d.size
                })),
                document_url: validDocs[0].url,
                document_type: validDocs.length > 1 ? 'multiple' : validDocs[0].type,
                description: description ? description.trim() : null
            };

            const res = await api.post('/brilliant-students/request', payload);
            setSuccessMessage(res.data?.message || t('আবেদনটি সফলভাবে এডমিনদের পর্যালোচনার জন্য জমা দেওয়া হয়েছে!', 'Request submitted successfully for admin review!'));

            if (onSuccess) {
                onSuccess(res.data);
            }

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Request submission error:', err);
            setError(err.response?.data?.error || t('আবেদন পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'Failed to submit request. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto" onClick={onClose}>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity animate-fade-in" />

            {/* Modal Card */}
            <div 
                className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto border border-orange-100 animate-zoom-in max-h-[92vh] flex flex-col font-sans"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-900 via-orange-800 to-amber-700 px-6 py-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                            <GraduationCap className="w-6 h-6 text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-white drop-shadow-xs">
                                {t('কৃতি শিক্ষার্থী স্বীকৃতির আবেদন', 'Brilliant Student Recognition Request')}
                            </h2>
                            <p className="text-xs text-orange-200/90 font-light mt-0.5">
                                {t('বংশের কৃতি সন্তানকে বিশিষ্ট ব্যক্তিত্ব তালিকায় অন্তর্ভুক্ত করতে আবেদন করুন', 'Nominate exceptional academic achievers for eminent recognition')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="relative z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        title={t('বন্ধ করুন', 'Close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Feedback Messages */}
                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm p-4 rounded-2xl animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    {successMessage && (
                        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm p-4 rounded-2xl animate-fade-in">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="flex-1 font-semibold">{successMessage}</div>
                        </div>
                    )}

                    {/* Step 1: Who is this request for? */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                            {t('১. এই আবেদনটি কার জন্য?', '1. Who is this application for?')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleForWhomChange('self')}
                                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all cursor-pointer ${
                                    forWhom === 'self'
                                        ? 'bg-orange-50/80 border-orange-600 text-orange-900 shadow-sm'
                                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
                                }`}
                            >
                                <User size={18} className={forWhom === 'self' ? 'text-orange-700' : 'text-stone-400'} />
                                <span>{t('আমার নিজের জন্য', 'For Myself')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleForWhomChange('other')}
                                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all cursor-pointer ${
                                    forWhom === 'other'
                                        ? 'bg-orange-50/80 border-orange-600 text-orange-900 shadow-sm'
                                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
                                }`}
                            >
                                <Search size={18} className={forWhom === 'other' ? 'text-orange-700' : 'text-stone-400'} />
                                <span>{t('অন্য কোনো সদস্যের জন্য', 'For Someone Else')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Candidate Member Selector */}
                    <div>
                        {forWhom === 'self' ? (
                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                    {t('আপনার বংশতালিকা প্রোফাইল', 'Your Directory Profile')}
                                </label>
                                {selfMemberLoading ? (
                                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-center text-sm text-stone-400 animate-pulse">
                                        {t('সদস্য তথ্য লোড হচ্ছে...', 'Loading your profile...')}
                                    </div>
                                ) : selectedCandidate ? (
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/60 to-amber-50/60 border-2 border-orange-200 rounded-2xl shadow-inner">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-orange-300 shadow-sm shrink-0 flex items-center justify-center">
                                                {selectedCandidate.profile_image_url ? (
                                                    <img src={selectedCandidate.profile_image_url} alt={formatName(selectedCandidate)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-serif font-bold text-lg text-orange-800">{(formatName(selectedCandidate) || 'M').charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-serif font-bold text-base text-stone-900 truncate">
                                                    {formatName(selectedCandidate)}
                                                </h4>
                                                <p className="text-xs text-stone-500 truncate">
                                                    {selectedCandidate.village ? `${t('গ্রাম', 'Village')}: ${selectedCandidate.village}` : ''}
                                                    {selectedCandidate.father_name ? ` • ${t('পিতা', 'Father')}: ${formatName({ full_name: selectedCandidate.father_name, name_bangla: selectedCandidate.father_name_bangla, name_english: selectedCandidate.father_name_english })}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                                            <CheckCircle2 size={13} /> {t('সংযুক্ত', 'Linked')}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
                                        <p className="text-xs text-amber-800 mb-2 font-medium">
                                            {t(
                                                'আপনার অ্যাকাউন্টটির সাথে এখনও বংশতালিকায় কোনো সদস্য প্রোফাইল সরাসরি লিংক করা নেই। অনুগ্রহ করে নিচে থেকে আপনার নাম অনুসন্ধান করে সিলেক্ট করুন:',
                                                'No directory profile is directly linked to your account. Please search and select your name from the directory below:'
                                            )}
                                        </p>
                                        <MemberSelector
                                            label={t('আপনার প্রোফাইল নির্বাচন করুন', 'Select Your Profile')}
                                            selectedMember={selectedCandidate}
                                            onSelect={setSelectedCandidate}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <MemberSelector
                                    label={t('২. কাঙ্ক্ষিত সদস্য নির্বাচন করুন (নাম বা ম্যাপ দিয়ে)', '2. Select Candidate Member (By Name or Map)')}
                                    selectedMember={selectedCandidate}
                                    onSelect={setSelectedCandidate}
                                />
                            </div>
                        )}
                    </div>

                    {/* Step 2: Achievement Details Form */}
                    <div className="space-y-4 pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-700" />
                            <h3 className="font-serif font-bold text-stone-800 text-sm sm:text-base">
                                {t('কৃতিত্ব ও যোগ্যতার বিবরণ', 'Academic Excellence Details')}
                            </h3>
                        </div>

                        {/* Category selection */}
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5">
                                {t('অর্জনের ধরণ / ক্যাটাগরি *', 'Achievement Category *')}
                            </label>
                            <select
                                value={achievementType}
                                onChange={(e) => setAchievementType(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all cursor-pointer"
                            >
                                {ACHIEVEMENT_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>
                                        {isBn ? opt.bn : opt.en}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Institution Name */}
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                                <span>{t('শিক্ষা প্রতিষ্ঠান / বিশ্ববিদ্যালয়ের নাম *', 'Institution / University Name *')}</span>
                                <Building2 size={14} className="text-stone-400" />
                            </label>
                            <input
                                type="text"
                                value={institution}
                                onChange={(e) => setInstitution(e.target.value)}
                                placeholder={isUniversityOrHigher ? t('যেমন: ঢাকা বিশ্ববিদ্যালয় / বুয়েট / চবি', 'e.g. University of Dhaka, BUET') : t('যেমন: নটর ডেম কলেজ / সেন্ট যোসেফ / রাজশাহী কলেজ', 'e.g. Notre Dame College, Rajshahi College')}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-stone-400"
                            />
                        </div>

                        {/* Subject / Department (Mandatory if university, optional otherwise) */}
                        <div className={`p-4 rounded-2xl border transition-all ${isUniversityOrHigher ? 'bg-orange-50/60 border-orange-200' : 'bg-stone-50/50 border-stone-100'}`}>
                            <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen size={14} className={isUniversityOrHigher ? 'text-orange-700' : 'text-stone-500'} />
                                    {t('বিভাগ / বিষয় / ফ্যাকাল্টি', 'Subject / Department / Faculty')}
                                    {isUniversityOrHigher && <span className="text-red-600 font-bold">*</span>}
                                </span>
                                {isUniversityOrHigher && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                                        {t('উচ্চশিক্ষার জন্য আবশ্যক', 'Required for Higher Ed')}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={subjectDepartment}
                                onChange={(e) => setSubjectDepartment(e.target.value)}
                                placeholder={t('যেমন: কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং / এমবিবিএস / আইন / অর্থনীতি', 'e.g. Computer Science, MBBS, Law, Economics')}
                                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-stone-400"
                            />
                        </div>

                        {/* Exam Year & Result Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                                    <span>{t('পরীক্ষা / ভর্তির বছর *', 'Exam / Admission Year *')}</span>
                                    <Calendar size={14} className="text-stone-400" />
                                </label>
                                <input
                                    type="text"
                                    value={examYear}
                                    onChange={(e) => setExamYear(e.target.value)}
                                    placeholder="2024"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-stone-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                                    <span>{t('ফলাফল / জিপিএ / মেধা স্থান', 'Result / GPA / Merit Rank')}</span>
                                    <Award size={14} className="text-stone-400" />
                                </label>
                                <input
                                    type="text"
                                    value={resultGrade}
                                    onChange={(e) => setResultGrade(e.target.value)}
                                    placeholder={t('যেমন: GPA 5.00 / মেধা স্থান ১২তম', 'e.g. GPA 5.00 / Merit Rank 12th')}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-stone-400"
                                />
                            </div>
                        </div>

                        {/* Certificate / Document Upload */}
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <span>{t('প্রমাণপত্র (মার্কশিট / প্রশংসাপত্র / এডমিট কার্ডের ছবি অথবা PDF) *', 'Proof Document(s) (Certificate / Marksheet / PDF) *')}</span>
                                </span>
                                <Upload size={14} className="text-stone-400" />
                            </label>

                            {/* Hidden file input supporting multiple files */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            {documents.length > 0 ? (
                                <div className="p-3.5 sm:p-4 bg-orange-50/50 border-2 border-orange-200/90 rounded-2xl space-y-3 animate-fade-in shadow-2xs">
                                    {/* Small Previews in a Line */}
                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                        {documents.map((doc) => {
                                            const isPdf = doc.isPdf || doc.type === 'document';
                                            return (
                                                <div 
                                                    key={doc.id} 
                                                    className="relative group shrink-0 animate-zoom-in"
                                                >
                                                    {/* Cancel Cross Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveDoc(doc.id);
                                                        }}
                                                        className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-all cursor-pointer border-2 border-white"
                                                        title={t('মুছুন', 'Remove document')}
                                                    >
                                                        <X size={12} strokeWidth={2.5} />
                                                    </button>

                                                    {/* Small Preview Box */}
                                                    <div 
                                                        onClick={() => setActiveLightboxDoc(doc)}
                                                        className={`w-18 h-20 sm:w-20 sm:h-22 rounded-2xl overflow-hidden border-2 relative flex flex-col items-center justify-center shadow-2xs cursor-pointer transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${
                                                            doc.error 
                                                                ? 'border-red-400 bg-red-50' 
                                                                : isPdf 
                                                                    ? 'border-red-200 bg-gradient-to-b from-red-50 via-white to-amber-50 group-hover:border-red-400' 
                                                                    : 'border-orange-200 bg-stone-100 group-hover:border-orange-400'
                                                        }`}
                                                        title={doc.name}
                                                    >
                                                        {isPdf ? (
                                                            /* PDF Mini Preview */
                                                            <div className="w-full h-full flex flex-col items-center justify-between p-1.5 text-center">
                                                                <span className="bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded tracking-wider shadow-2xs">
                                                                    PDF
                                                                </span>
                                                                <FileText className="w-7 h-7 text-red-600 group-hover:scale-110 transition-transform" />
                                                                <span className="text-[9px] text-stone-600 font-semibold truncate max-w-full px-0.5">
                                                                    {doc.name}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            /* Image Mini Preview */
                                                            <div className="w-full h-full relative">
                                                                <img 
                                                                    src={doc.localUrl || doc.url} 
                                                                    alt={doc.name} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                                <div className="absolute inset-0 bg-stone-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-2xs">
                                                                    <Eye size={16} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Uploading spinner overlay */}
                                                        {doc.uploading && (
                                                            <div className="absolute inset-0 bg-white/85 backdrop-blur-2xs rounded-2xl flex flex-col items-center justify-center z-10">
                                                                <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                                                                <span className="text-[8px] text-orange-900 font-bold mt-1">আপলোড...</span>
                                                            </div>
                                                        )}

                                                        {/* Error overlay */}
                                                        {doc.error && (
                                                            <div className="absolute inset-0 bg-red-100/90 rounded-2xl flex items-center justify-center text-red-700 font-bold text-[9px] p-1 text-center z-10">
                                                                ব্যর্থ
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add More Documents Tile Button */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-18 h-20 sm:w-20 sm:h-22 rounded-2xl border-2 border-dashed border-orange-300 hover:border-orange-600 bg-white hover:bg-orange-50/80 flex flex-col items-center justify-center text-orange-800 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 group shrink-0"
                                            title={t('আরো ডকুমেন্ট যোগ করুন', 'Add more documents')}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-orange-100 group-hover:bg-orange-600 text-orange-800 group-hover:text-white flex items-center justify-center transition-colors">
                                                <Plus size={16} />
                                            </div>
                                            <span className="text-[10px] font-bold mt-1 text-stone-700 group-hover:text-orange-900">
                                                {t('আরো যোগ', 'Add More')}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Document Count & Size Summary */}
                                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-orange-200/50">
                                        <span className="flex items-center gap-1 font-semibold text-emerald-800">
                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                            {isBn 
                                                ? `${documents.length}টি ডকুমেন্ট সংযুক্ত রয়েছে` 
                                                : `${documents.length} document(s) attached`}
                                        </span>
                                        <span>{t('প্রতিটি সর্বোচ্চ ১০MB (ছবি বা PDF)', 'Max 10MB each (Photo or PDF)')}</span>
                                    </div>
                                </div>
                            ) : (
                                /* Empty upload dropzone */
                                <label 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-stone-300 hover:border-orange-500 hover:bg-orange-50/40 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-orange-100/70 text-orange-800 group-hover:scale-110 flex items-center justify-center mb-2 shadow-inner transition-transform">
                                        <Upload size={22} />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-stone-800 group-hover:text-orange-900 transition-colors">
                                        {t('ছবি বা PDF ফাইল নির্বাচন করুন (এক বা একাধিক)', 'Click to upload Photo(s) or PDF file(s)')}
                                    </span>
                                    <span className="text-[11px] text-stone-400 mt-1">
                                        JPG, PNG, WEBP অথবা PDF (প্রতিটি ফাইল সর্বোচ্চ ১০MB)
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Optional description */}
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5">
                                {t('অতিরিক্ত বিবরণ বা মন্তব্য (ঐচ্ছিক)', 'Additional Remarks / Story (Optional)')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder={t('বিশেষ কোনো স্কলারশিপ, প্রতিযোগিতার ফলাফল বা অর্জনের তথ্য...', 'Any additional details about scholarship, competitions, or achievements...')}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-stone-400 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-stone-50 border-t border-stone-200/80 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-bold transition-colors cursor-pointer"
                    >
                        {t('বাতিল', 'Cancel')}
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || documents.some(d => d.uploading) || !selectedCandidate || documents.filter(d => d.url && !d.error).length === 0}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-800 hover:bg-orange-900 active:scale-95 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>{t('আবেদন পাঠানো হচ্ছে...', 'Submitting Request...')}</span>
                            </>
                        ) : (
                            <>
                                <span>{t('আবেদন জমা দিন', 'Submit Recognition Request')}</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Document Preview Lightbox Modal */}
            {activeLightboxDoc && (
                <div 
                    className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fade-in"
                    onClick={() => setActiveLightboxDoc(null)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col border border-orange-200 animate-zoom-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Lightbox Header */}
                        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-orange-400 shrink-0">
                                    {activeLightboxDoc.isPdf || activeLightboxDoc.type === 'document' ? <FileText size={18} /> : <Eye size={18} />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold truncate">
                                        {activeLightboxDoc.name || t('ডকুমেন্ট প্রিভিউ', 'Document Preview')}
                                    </h4>
                                    <p className="text-[11px] text-stone-400">
                                        {activeLightboxDoc.size || ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={activeLightboxDoc.localUrl || activeLightboxDoc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <ExternalLink size={13} />
                                    <span>{t('নতুন ট্যাবে খুলুন', 'Open in new tab')}</span>
                                </a>
                                <button
                                    onClick={() => setActiveLightboxDoc(null)}
                                    className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Lightbox Content */}
                        <div className="p-4 bg-stone-100 flex items-center justify-center overflow-auto max-h-[calc(90vh-60px)]">
                            {activeLightboxDoc.isPdf || activeLightboxDoc.type === 'document' ? (
                                <iframe
                                    src={activeLightboxDoc.localUrl || activeLightboxDoc.url}
                                    className="w-full h-[70vh] rounded-xl border border-stone-300 bg-white shadow-inner"
                                    title="PDF Document Preview"
                                />
                            ) : (
                                <img
                                    src={activeLightboxDoc.localUrl || activeLightboxDoc.url}
                                    alt={activeLightboxDoc.name}
                                    className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-stone-200"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrilliantStudentRequestModal;
