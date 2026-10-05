import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, Briefcase, GraduationCap, Phone, Droplet, X, Edit, Heart, Globe, Facebook, Twitter, Instagram, Linkedin, Lock, Network, ShieldCheck, GitBranch, ArrowRight, Award, Star, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMemberIdentity, MEMBER_THEMES } from '../utils/memberIdentity';
import { calculateRelationshipEngine } from '../utils/relationCalculator';
import MemberSelector from '../components/MemberSelector';
import api from '../api/api';
import VerifiedBadge from '../components/VerifiedBadge';

const Profile = ({ memberId, onClose, zIndex = 'z-[120]', onEdit }) => {
  const { user, isAdmin } = useAuth();
  const { t, isBn, formatOccupation, formatName, formatNumber } = useLanguage();
  const params = useParams();
  const navigate = useNavigate();
  const [currentId, setCurrentId] = useState(memberId || params.id);

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserMember, setCurrentUserMember] = useState(null);
  const [calculatingRelation, setCalculatingRelation] = useState(false);
  const [floatingRelation, setFloatingRelation] = useState(null);
  const [guestRelationOpen, setGuestRelationOpen] = useState(false);
  const [guestSelectedMember, setGuestSelectedMember] = useState(null);

  useEffect(() => {
    if (memberId || params.id) {
      setCurrentId(memberId || params.id);
    }
  }, [memberId, params.id]);

  useEffect(() => {
    if (currentId) {
      fetchMemberDetails(currentId);
    }
  }, [currentId]);

  const fetchMemberDetails = async (targetId) => {
    const fetchId = targetId || currentId;
    if (!fetchId) return;
    try {
      setLoading(true);
      const res = await api.get(`/members/${fetchId}`);
      setMember(res.data);
    } catch (error) {
      console.error(error);
      // Mock data
      setMember({
        id: fetchId,
        full_name: 'Amit Barai',
        occupation: 'Software Engineer',
        education: 'B.Sc in CSE, KUET',
        date_of_birth: '1995-10-15',
        blood_group: 'B+',
        contact_number: '+8801700000000',
        present_address: 'Dhaka, Bangladesh',
        permanent_address: 'Madaripur, Bangladesh',
        district: 'Madaripur',
        upazila: 'Kalkini',
        village: 'Enayetnagar',
        father_name: 'Father Name', // Placeholder
        mother_name: 'Mother Name', // Placeholder
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle relationship calculation between user and viewed profile
  const handleKnowRelation = async () => {
    // For non-logged-in persons / guests: open the floating relation box over the profile card
    if (!user || !user.member_id) {
      setGuestRelationOpen(true);
      return;
    }

    try {
      setCalculatingRelation(true);
      let userMember = currentUserMember;
      if (!userMember || userMember.id !== user.member_id) {
        try {
          const res = await api.get(`/members/${user.member_id}`);
          userMember = res.data;
          setCurrentUserMember(userMember);
        } catch (e) {
          console.warn('Could not fetch user member details:', e);
        }
      }

      if (!userMember) {
        // GUEST MODE: Open floating relation modal directly over the profile card
        setGuestRelationOpen(true);
        return;
      }

      const targetName = formatName(member);
      if (String(userMember.id) === String(member?.id)) {
        setFloatingRelation({
          personName: targetName,
          relationText: isBn ? 'আপনি নিজে (একই ব্যক্তি)' : 'You yourself (Same person)',
          emoji: '👤',
          isSamePerson: true
        });
        return;
      }

      const relResult = calculateRelationshipEngine(userMember, member, { t, formatNumber });
      setFloatingRelation({
        personName: targetName,
        relationText: relResult?.text || (isBn ? 'আত্মীয়' : 'Relative'),
        emoji: relResult?.emoji || '🔗',
        isSamePerson: false
      });
    } catch (err) {
      console.error('Failed to compute relation:', err);
      setGuestRelationOpen(true);
    } finally {
      setCalculatingRelation(false);
    }
  };

  useEffect(() => {
    if (!floatingRelation && !guestRelationOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFloatingRelation(null);
        setGuestRelationOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [floatingRelation, guestRelationOpen]);

  if (!currentId) return null;

  if (loading) return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/40 backdrop-blur-sm p-4`}>
      <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
        <span className="w-8 h-8 rounded-full bg-orange-500 animate-ping mb-4"></span>
        <p className="font-bold text-stone-600">Loading profile...</p>
      </div>
    </div>
  );
  if (!member) return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/40 backdrop-blur-sm p-4`}>
      <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center max-w-sm text-center relative">
        <button onClick={() => { if (onClose) onClose(); else navigate(-1); }} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"><X size={20} /></button>
        <p className="font-bold text-red-500 text-lg mb-2">Member not found</p>
        <p className="text-stone-500 text-sm">The member you are looking for does not exist or has been removed.</p>
      </div>
    </div>
  );
  const identity = getMemberIdentity(member);
  const theme = MEMBER_THEMES[identity] || MEMBER_THEMES.default;

  const displayName = formatName(member);

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            if (onClose) onClose();
            else navigate(-1);
          }
        }}
        className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto custom-scroll py-6`}
      >
        <div className={`max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border ${theme.cardBorder} animate-fade-in animate-slide-up relative mt-auto mb-auto transition-all duration-200 ${(floatingRelation || guestRelationOpen) ? 'filter blur-[1.5px] select-none pointer-events-none' : ''}`}>
          <button
            onClick={() => { if (onClose) onClose(); else navigate(-1); }}
            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Header / Cover */}
          <div className={`h-24 sm:h-28 ${theme.headerBg} relative overflow-hidden transition-all duration-300`}>
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />

            {/* Identity Role Badge positioned on cover banner (top-left) */}
            <div className="absolute top-4 left-4 z-20">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs backdrop-blur-md bg-white/95 ${theme.badge}`}>
                <span>{theme.symbol}</span>
                <span>{isBn ? theme.labelBn : theme.labelEn}</span>
              </span>
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-6 relative">
            <div className="flex flex-col items-center -mt-12 sm:-mt-14 mb-4">
              <div className="h-24 w-24 sm:h-28 sm:w-28 bg-white rounded-full p-1.5 shadow-lg mb-3">
                <div className={`h-full w-full ${theme.avatarBigBg} border-2 ${theme.avatarBigBorder} rounded-full flex items-center justify-center overflow-hidden transition-colors duration-300`}>
                  {member.profile_image_url ? (
                    <img src={member.profile_image_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <User className={`h-12 w-12 sm:h-14 sm:w-14 ${theme.itemIcon}`} />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-1 flex-wrap px-2">
                <h1 className="text-xl sm:text-3xl font-serif font-bold text-stone-800 text-center">
                  {displayName}
                </h1>
                {(member.is_active || member.user_status === 'active' || member.user_account?.status === 'active') && (
                  <VerifiedBadge size={20} />
                )}
              </div>

              {/* Eminent Figure Badge */}
              {(member.eminent_category || member.category) && (
                <div className="flex flex-col items-center gap-1 my-1.5 px-2 animate-fade-in">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs transition-all duration-300 hover:scale-105 ${
                    (member.eminent_category || member.category) === 'কৃতি শিক্ষার্থী'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800'
                      : (member.eminent_category || member.category) === 'মরণোত্তর জ্ঞাতি'
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-800'
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900'
                  }`}>
                    {(member.eminent_category || member.category) === 'কৃতি শিক্ষার্থী' ? (
                      <GraduationCap className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    ) : (member.eminent_category || member.category) === 'মরণোত্তর জ্ঞাতি' ? (
                      <Flame className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Star className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    )}
                    <span>
                      {isBn
                        ? (member.eminent_category || member.category)
                        : (member.eminent_category || member.category) === 'কৃতি শিক্ষার্থী'
                        ? 'Brilliant Student'
                        : (member.eminent_category || member.category) === 'মরণোত্তর জ্ঞাতি'
                        ? 'Posthumous Honor'
                        : (member.eminent_category || member.category) === 'আজীবন জ্ঞাতি'
                        ? 'Lifetime Honor'
                        : (member.eminent_category || member.category)}
                    </span>
                  </div>

                  {member.eminent_title && (
                    <span className="text-[11px] sm:text-xs font-medium text-amber-800/90 italic text-center max-w-xs px-2.5 py-0.5 rounded-md bg-amber-50/80 border border-amber-200/60 shadow-2xs">
                      "{member.eminent_title}"
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center text-stone-500 justify-center text-xs sm:text-sm text-center px-4">
                <MapPin className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 ${theme.iconColor} shrink-0`} />
                <span>{[member.village, member.upazila, member.district].filter(Boolean).join(', ') || t('অজানা স্থান', 'Unknown Location')}</span>
              </div>

              {/* Profile Action Buttons: Clean & Centered */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-3.5">
                <button
                  onClick={async () => {
                    let targetMember = member;
                    let parts = [targetMember.country, targetMember.district, targetMember.upazila, targetMember.village, targetMember.home_name].filter(Boolean);
                    if (parts.length < 5 && targetMember.spouses && targetMember.spouses.length > 0) {
                      try {
                        const hRes = await api.get(`/members/${targetMember.spouses[0].id}`);
                        if (hRes.data) {
                          const hParts = [hRes.data.country, hRes.data.district, hRes.data.upazila, hRes.data.village, hRes.data.home_name].filter(Boolean);
                          if (hParts.length === 5) {
                            parts = hParts;
                          }
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    if (parts.length === 5) {
                      if (onClose) onClose();
                      navigate(`/explorer/${parts.join('/')}?expand=${member.id}`);
                    } else {
                      alert(t('বংশবৃক্ষ দেখার জন্য সদস্যের অবস্থান তথ্য অসম্পূর্ণ।', 'Member location data is incomplete to view the tree.'));
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 px-4 py-1.5 rounded-full shadow-2xs hover:shadow-xs transition text-xs sm:text-sm font-medium transform hover:scale-105 active:scale-95 duration-200 cursor-pointer`}
                >
                  <Network size={14} className="text-white" />
                  <span>{t('বংশবৃক্ষ দেখুন', 'View Tree')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleKnowRelation}
                  disabled={calculatingRelation}
                  className={`inline-flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white border border-orange-800 px-4 py-1.5 rounded-full shadow-2xs hover:shadow-xs transition text-xs sm:text-sm font-medium transform hover:scale-105 active:scale-95 duration-200 cursor-pointer disabled:opacity-75`}
                >
                  {calculatingRelation ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GitBranch size={14} className="text-white" />
                  )}
                  <span>{t('সম্পর্ক জানুন', 'Know Relation')}</span>
                </button>

                {isAdmin && onEdit && (
                  <button
                    onClick={() => {
                      if (onClose) onClose();
                      onEdit(member);
                    }}
                    className={`inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 px-4 py-1.5 rounded-full shadow-2xs hover:shadow-xs transition text-xs sm:text-sm font-medium transform hover:scale-105 active:scale-95 duration-200 cursor-pointer`}
                  >
                    <Edit size={14} />
                    <span>{t('সম্পাদনা', 'Edit')}</span>
                  </button>
                )}

                {!user && !member.is_active && !member.is_claimed && !member.user_account && (
                  <button
                    onClick={() => {
                      if (onClose) onClose();
                      navigate('/user-auth', { state: { memberId: member.id, memberName: displayName } });
                    }}
                    className={`inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white border border-orange-700 px-4 py-1.5 rounded-full shadow-2xs hover:shadow-xs transition text-xs sm:text-sm font-medium transform hover:scale-105 active:scale-95 duration-200 cursor-pointer`}
                  >
                    <ShieldCheck size={14} />
                    <span>{t('প্রোফাইল ক্লেইম করুন', 'Claim Profile')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <h2 className={`text-lg sm:text-xl font-serif font-bold ${theme.heading} pb-2`}>
                  {t('ব্যক্তিগত তথ্য', 'Personal Info')}
                </h2>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <Briefcase className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('পেশা', 'Occupation')}</span>
                    <span className="font-medium text-stone-800 text-sm">{formatOccupation(member.occupation) || 'N/A'}</span>
                  </div>
                </div>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <Briefcase className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('কর্মস্থল', 'Workplace')}</span>
                    <span className="font-medium text-stone-800 text-sm">{member.workplace || 'N/A'}</span>
                  </div>
                </div>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <GraduationCap className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('শিক্ষাগত যোগ্যতা', 'Education')}</span>
                    <span className="font-medium text-stone-800 text-sm">{member.education || 'N/A'}</span>
                  </div>
                </div>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <Droplet className="h-5 w-5 text-red-600 fill-red-600 mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('রক্তের গ্রুপ', 'Blood Group')}</span>
                    <span className="font-extrabold text-red-700 text-sm">{member.blood_group || 'N/A'}</span>
                  </div>
                </div>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <Calendar className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('জন্ম তারিখ', 'Birth Date')}</span>
                    <span className="font-medium text-stone-800 text-sm">{member.birth_date ? new Date(member.birth_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className={`text-lg sm:text-xl font-serif font-bold ${theme.heading} pb-2`}>
                  {t('যোগাযোগ ও পরিবার', 'Contact & Family')}
                </h2>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <Phone className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('যোগাযোগ নম্বর', 'Phone')}</span>
                    {member.contact_number ? (
                      user ? (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {member.contact_number.split(/[,;\/\n\r]+/).map((num, i) => {
                            const cleanNum = num.trim();
                            if (!cleanNum) return null;
                            return (
                              <a
                                key={i}
                                href={`tel:${cleanNum}`}
                                className="font-medium text-stone-800 hover:text-orange-700 hover:underline text-sm bg-orange-50 hover:bg-orange-100 border border-orange-200/60 px-2 py-0.5 rounded transition"
                              >
                                {cleanNum}
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800 text-sm blur-sm select-none">01700000000</span>
                          <Lock className="h-3 w-3 text-stone-400" />
                        </div>
                      )
                    ) : (
                      <span className="font-medium text-stone-400 text-sm">N/A</span>
                    )}
                  </div>
                </div>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  {(() => {
                    const s = (member.social_media || '').toLowerCase();
                    const SocialIcon = s.includes('facebook') ? Facebook :
                      s.includes('instagram') ? Instagram :
                        s.includes('twitter') || s.includes('x.com') ? Twitter :
                          s.includes('linkedin') ? Linkedin : Globe;
                    return <SocialIcon className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />;
                  })()}
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('সামাজিক যোগাযোগ', 'Social Media')}</span>
                    {member.social_media && member.social_media.trim() ? (
                      user ? (
                        <a
                          href={member.social_media.startsWith('http') ? member.social_media : `https://${member.social_media}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 mt-0.5 break-all text-sm"
                        >
                          <span className="truncate">{member.social_media.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-blue-600 text-sm blur-sm select-none">facebook.com/username</span>
                          <Lock className="h-3 w-3 text-stone-400" />
                        </div>
                      )
                    ) : (
                      <span className="font-medium text-stone-400 text-sm">N/A</span>
                    )}
                  </div>
                </div>

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <MapPin className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('ঠিকানা', 'Address')}</span>
                    <span className="font-medium text-stone-800 text-sm">{[member.village, member.upazila, member.district].filter(Boolean).join(', ') || 'N/A'}</span>
                  </div>
                </div>

                {member.spouses && member.spouses.length > 0 && (
                  <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500 mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('সহধর্মিণী', 'Spouses')}</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {member.spouses.filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setCurrentId(s.id)}
                            className="flex items-center gap-2 bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 px-3 py-1 rounded-full text-xs font-semibold text-stone-800 shadow-2xs transition-all active:scale-95 cursor-pointer text-left"
                            title={t('প্রোফাইল দেখুন', 'View Profile')}
                          >
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white ring-1 ring-stone-200 shrink-0">
                              {s.profile_image_url ? (
                                <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={12} className="m-auto text-stone-400" />
                              )}
                            </div>
                            <span>{formatName(s)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                  <User className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">{t('পিতা-মাতা', 'Parents')}</span>
                    <div className="flex flex-col gap-1 mt-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-bold">{t('পিতা', 'Father')}</span>
                        <span className="font-medium text-stone-700">{formatName({ full_name: member.father_name, name_bangla: member.father_name_bangla, name_english: member.father_name_english }) || t('অজানা', 'Unknown')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold">{t('মাতা', 'Mother')}</span>
                        <span className="font-medium text-stone-700">{formatName({ full_name: member.mother_name, name_bangla: member.mother_name_bangla, name_english: member.mother_name_english }) || t('অজানা', 'Unknown')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {member.children && member.children.length > 0 && (
                  <div className={`flex items-start group ${theme.itemHover} p-2 rounded-xl transition-colors`}>
                    <User className={`h-5 w-5 ${theme.itemIcon} mr-3 mt-0.5 group-hover:scale-110 transition-transform`} />
                    <div className="w-full">
                      <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold mb-1">{t('সন্তানসন্ততি', 'Children')}</span>
                      <div className="flex flex-col gap-2">
                        {member.children.map(child => (
                          <div key={child.id} className="flex items-center space-x-2">
                            <div className={`h-8 w-8 ${theme.avatarBg} rounded-full flex items-center justify-center border ${theme.avatarBorder} overflow-hidden shrink-0`}>
                              {child.profile_image_url ? (
                                <img src={child.profile_image_url} alt={formatName(child)} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <span className={`font-medium text-sm text-stone-700 ${theme.nameText} cursor-pointer transition-colors`}>
                              {formatName(child)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Single-Line Relationship Card Modal */}
      {floatingRelation && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setFloatingRelation(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#ea580c',
              boxShadow: '0 25px 60px -12px rgba(67, 20, 7, 0.35), 0 0 0 1px rgba(251, 191, 36, 0.6), 0 8px 24px -4px rgba(154, 52, 18, 0.2)'
            }}
            className="border-2 rounded-2xl sm:rounded-full px-6 py-3.5 sm:px-8 sm:py-4.5 flex items-center gap-3.5 sm:gap-4 max-w-2xl mx-auto transform animate-slide-up transition-all hover:scale-[1.01] cursor-default"
          >
            <div 
              style={{ backgroundColor: '#fff7ed', borderColor: '#ea580c' }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-sm select-none"
            >
              {floatingRelation.emoji || '🔗'}
            </div>

            <p className="font-serif text-base sm:text-lg md:text-xl font-medium tracking-wide flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 text-stone-800">
              {floatingRelation.isSamePerson ? (
                <>
                  <span className="font-bold text-stone-900 text-lg sm:text-xl md:text-2xl">{floatingRelation.personName}</span>
                  <span 
                    style={{ background: '#2563eb', color: '#ffffff', border: '1.5px solid #93c5fd' }}
                    className="inline-flex items-center px-4 py-1 sm:px-5 sm:py-1.5 rounded-full font-bold shadow-sm text-sm sm:text-base md:text-lg"
                  >
                    {isBn ? 'আপনি নিজে (একই ব্যক্তি)' : 'You yourself (Same person)'}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-bold text-stone-900 text-lg sm:text-xl md:text-2xl tracking-tight">{floatingRelation.personName}</span>
                  <span className="font-semibold text-stone-700 text-base sm:text-lg md:text-xl">{isBn ? 'আপনার' : 'is your'}</span>
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 50%, #991b1b 100%)',
                      color: '#ffffff',
                      border: '2px solid #fef08a',
                      boxShadow: '0 4px 14px rgba(154, 52, 18, 0.35)'
                    }}
                    className="inline-flex items-center px-4 py-1 sm:px-5 sm:py-1.5 rounded-full font-extrabold tracking-wide text-base sm:text-lg md:text-xl shadow-md transform hover:scale-105 transition-transform duration-200 select-all"
                  >
                    {floatingRelation.relationText}
                  </span>
                  <span className="font-semibold text-stone-700 text-base sm:text-lg md:text-xl">{isBn ? 'হয়' : ''}</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Guest Mode Floating Relation Modal over Profile Card */}
      {guestRelationOpen && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setGuestRelationOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#ea580c',
              boxShadow: '0 25px 60px -12px rgba(67, 20, 7, 0.35), 0 0 0 1px rgba(251, 191, 36, 0.6), 0 8px 24px -4px rgba(154, 52, 18, 0.2)'
            }}
            className="relative w-full max-w-lg bg-white border-2 rounded-3xl p-5 sm:p-7 shadow-2xl animate-slide-up transition-all"
          >
            {/* Close Button on Top Right Corner */}
            <button
              type="button"
              onClick={() => setGuestRelationOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer z-20"
              title={t('বন্ধ করুন', 'Close')}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-orange-900/20 shrink-0">
                <GitBranch size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 leading-snug">
                  {t('সম্পর্ক নির্ণয় করুন', 'Find Relationship')}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500">
                  {isBn ? `${displayName}-এর সাথে আপনার সম্পর্ক জানুন` : `Discover relation with ${displayName}`}
                </p>
              </div>
            </div>

            {/* Target Profile Summary (Person B) */}
            <div className="flex items-center justify-between p-3 bg-orange-50/80 border border-orange-200/90 rounded-2xl mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-orange-300 shadow-2xs shrink-0 flex items-center justify-center">
                  {member.profile_image_url ? (
                    <img src={member.profile_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif font-bold text-base text-orange-800">{(displayName || '?').charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-700 block">
                    {t('উদ্দিষ্ট সদস্য (২য় ব্যক্তি)', 'Target Member (2nd Person)')}
                  </span>
                  <span className="font-bold text-stone-900 text-sm sm:text-base truncate block">
                    {displayName}
                  </span>
                </div>
              </div>
              <span className="text-xs bg-white text-orange-800 font-bold px-2.5 py-1 rounded-full border border-orange-200 shadow-2xs shrink-0">
                {isBn ? `লেভেল ${formatNumber(member.level)}` : `Level ${member.level}`}
              </span>
            </div>

            {/* 1st Person Selection (Guest user selector) */}
            <div className="mb-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">১</span>
                {t('আপনার নাম বা প্রথম ব্যক্তি নির্বাচন করুন', 'Search your name or select 1st person')}
              </p>
              <MemberSelector
                label=""
                onSelect={(m) => setGuestSelectedMember(m)}
                selectedMember={guestSelectedMember}
              />
            </div>

            {/* Live Relationship Result Output */}
            {(() => {
              if (!guestSelectedMember) {
                return (
                  <div className="p-4 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center">
                    <p className="text-xs sm:text-sm text-stone-500">
                      {isBn
                        ? '👆 উপরের ঘরে আপনার নাম লিখে নির্বাচন করলেই সম্পর্ক দেখা যাবে।'
                        : '👆 Search and select your name above to calculate the relationship.'}
                    </p>
                  </div>
                );
              }

              if (String(guestSelectedMember.id) === String(member.id)) {
                return (
                  <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 text-stone-900 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl shrink-0">
                      👤
                    </div>
                    <div>
                      <span className="font-bold text-base block">{displayName}</span>
                      <span className="text-xs text-blue-700 font-bold">
                        {isBn ? 'আপনি নিজে (একই ব্যক্তি)' : 'You yourself (Same person)'}
                      </span>
                    </div>
                  </div>
                );
              }

              const res = calculateRelationshipEngine(guestSelectedMember, member, { t, formatNumber });
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50/60 to-orange-100/70 border-2 border-orange-300 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center text-2xl shadow-xs shrink-0 select-none">
                      {res?.emoji || '🔗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base sm:text-lg flex items-center flex-wrap gap-2 text-stone-800">
                        <span className="font-bold text-stone-900 tracking-tight">{displayName}</span>
                        <span className="font-semibold text-stone-700">{isBn ? 'আপনার' : 'is your'}</span>
                        <span
                          style={{
                            background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 50%, #991b1b 100%)',
                            color: '#ffffff',
                            border: '1.5px solid #fef08a',
                            boxShadow: '0 3px 10px rgba(154, 52, 18, 0.3)'
                          }}
                          className="inline-flex items-center px-3.5 py-0.5 sm:px-4 sm:py-1 rounded-full font-extrabold text-base sm:text-lg shadow-sm"
                        >
                          {res?.text || (isBn ? 'আত্মীয়' : 'Relative')}
                        </span>
                        <span className="font-semibold text-stone-700">{isBn ? 'হয়' : ''}</span>
                      </p>
                      {res?.depthStr && res.depthStr !== '0' && (
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          <span>
                            {isBn
                              ? `${res.depthStr} প্রজন্মের ব্যবধান`
                              : `${res.depthStr} generation gap`}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Optional Full Find Relation Link */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>{t('বিস্তারিত বিশ্লেষণ চান?', 'Want detailed analysis?')}</span>
              <button
                type="button"
                onClick={() => {
                  setGuestRelationOpen(false);
                  if (onClose) onClose();
                  navigate('/relation', {
                    state: {
                      targetMemberId: member?.id,
                      targetMember: member
                    }
                  });
                }}
                className="text-orange-700 hover:text-orange-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('সম্পূর্ণ সম্পর্ক পৃষ্ঠা খুলুন', 'Open full relation page')}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
