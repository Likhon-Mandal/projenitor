import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeftRight, GitBranch, Search, Sparkles } from 'lucide-react';
import MemberSelector from '../components/MemberSelector';
import { useLanguage } from '../context/LanguageContext';
import { calculateRelationshipEngine } from '../utils/relationCalculator';
import api from '../api/api';

/* ─── Animation Styles ──────────────────────────────────────────────────── */
const Styles = () => (
    <style>{`
        @keyframes fr-slideUp {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes fr-pulseRing {
            0%   { transform: scale(1);    opacity: 0.5; }
            100% { transform: scale(1.5);  opacity: 0;   }
        }
        .fr-animate-in { animation: fr-slideUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .fr-glass {
            background: rgba(255,255,255,0.72);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255,255,255,0.6);
            box-shadow: 0 8px 40px rgba(154,52,18,0.09), 0 1.5px 0 rgba(255,255,255,0.9) inset;
        }
        .fr-swap { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), background-color 0.2s; }
        .fr-swap:hover { transform: rotate(180deg) scale(1.12); }
        .fr-swap:active { transform: rotate(180deg) scale(0.94); }
        .fr-ring-wrap { position: relative; }
        .fr-ring-wrap::after {
            content:'';
            position:absolute; inset:-5px;
            border-radius:9999px;
            border:2px solid #ea580c;
            animation: fr-pulseRing 1.8s ease-out infinite;
            pointer-events:none;
        }
    `}</style>
);

const FindRelation = () => {
    const location = useLocation();
    const { t, isBn, formatNumber, formatName } = useLanguage();
    const [personA, setPersonA] = useState(null);
    const [personB, setPersonB] = useState(null);

    // Auto-populate personB if passed from profile card
    useEffect(() => {
        if (location.state?.targetMember) {
            setPersonB(location.state.targetMember);
        } else if (location.state?.targetMemberId) {
            api.get(`/members/${location.state.targetMemberId}`)
                .then(res => setPersonB(res.data))
                .catch(err => console.error('Failed to load target member for relation:', err));
        }
    }, [location.state]);

    const relationResult = calculateRelationshipEngine(personA, personB, { t, formatNumber });
    const bothSelected = personA && personB;

    const Avatar = ({ member, borderColor, textColor }) => (
        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 ${borderColor} bg-white overflow-hidden shadow-xl flex items-center justify-center shrink-0`}>
            {member.profile_image_url
                ? <img src={member.profile_image_url} alt="" className="w-full h-full object-cover" />
                : <span className={`font-serif text-3xl font-bold ${textColor}`}>{(formatName(member) || '?').charAt(0)}</span>}
        </div>
    );

    return (
        <div className="min-h-screen pb-16 font-sans">
            <Styles />

            {/* Page Header */}
            <div className="relative overflow-hidden mb-6">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-red-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
                <div className="relative z-10 fr-glass rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
                    <div className="fr-ring-wrap shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center shadow-xl shadow-orange-900/25">
                            <GitBranch size={28} className="text-white" />
                        </div>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.2em] text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full mb-2">
                            <Sparkles size={10} />
                            {t('\u09ac\u0982\u09b6 \u09aa\u09b0\u09bf\u099a\u09df', 'Family Lineage Tool')}
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 leading-tight mb-1">
                            {t('\u09b8\u09ae\u09cd\u09aa\u09b0\u09cd\u0995 ', 'Find ')}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-700">
                                {t('\u09a8\u09bf\u09b0\u09cd\u09a3\u09df', 'Relationship')}
                            </span>
                        </h1>
                        <p className="text-stone-500 text-sm max-w-lg leading-relaxed">
                            {t(
                                '\u09af\u09c7 \u0995\u09cb\u09a8\u09cb \u09a6\u09c1\u099c\u09a8 \u09aa\u09b0\u09bf\u09ac\u09be\u09b0\u09c7\u09b0 \u09b8\u09a6\u09b8\u09cd\u09af\u09c7\u09b0 \u09aa\u09cd\u09b0\u099c\u09a8\u09cd\u09ae\u09c7\u09b0 \u09ac\u09cd\u09af\u09ac\u09a7\u09be\u09a8 \u0993 \u09b8\u09ae\u09cd\u09aa\u09b0\u09cd\u0995 \u099c\u09be\u09a8\u09c1\u09a8\u0964',
                                'Discover the generational gap & relationship between any two family members.'
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Selector Grid */}
            <div className="relative z-30 fr-glass rounded-3xl p-5 sm:p-7 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_52px_1fr] gap-4 items-start">
                    <div className="space-y-2 relative z-30">
                        <p className="text-[10px] uppercase font-bold tracking-[0.18em] text-orange-700 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center">{t('\u09e7','1')}</span>
                            {t('\u09aa\u09cd\u09b0\u09a5\u09ae \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf', 'First Person')}
                        </p>
                        <div className="relative z-30">
                            <MemberSelector label="" onSelect={setPersonA} selectedMember={personA} />
                        </div>
                    </div>

                    <div className="flex sm:flex-col items-center justify-center gap-1 pt-0 sm:pt-8">
                        <button
                            onClick={() => { const tmp = personA; setPersonA(personB); setPersonB(tmp); }}
                            disabled={!bothSelected}
                            className={`fr-swap w-11 h-11 rounded-full flex items-center justify-center shadow-md border-2
                                ${bothSelected
                                    ? 'bg-orange-600 hover:bg-orange-700 border-orange-400 text-white shadow-orange-300/40 cursor-pointer'
                                    : 'bg-white border-stone-200 text-stone-300 cursor-not-allowed'}`}
                            title={t('\u0985\u09a6\u09b2\u09ac\u09a6\u09b2 \u0995\u09b0\u09c1\u09a8', 'Swap')}
                        >
                            <ArrowLeftRight size={16} />
                        </button>
                    </div>

                    <div className="space-y-2 relative z-20">
                        <p className="text-[10px] uppercase font-bold tracking-[0.18em] text-red-700 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-red-700 text-white text-[10px] font-black flex items-center justify-center">{t('\u09e8','2')}</span>
                            {t('\u09a6\u09cd\u09ac\u09bf\u09a4\u09c0\u09df \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf', 'Second Person')}
                        </p>
                        <div className="relative z-20">
                            <MemberSelector label="" onSelect={setPersonB} selectedMember={personB} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {!bothSelected && (
                <div className="relative z-0 fr-glass rounded-3xl p-8 sm:p-10 text-center">
                    <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search size={24} className="text-stone-300" />
                    </div>
                    <p className="text-stone-400 text-sm sm:text-base font-medium">
                        {!personA && !personB
                            ? t('\u0989\u09aa\u09b0\u09c7 \u09a6\u09c1\u099c\u09a8 \u09aa\u09b0\u09bf\u09ac\u09be\u09b0\u09c7\u09b0 \u09b8\u09a6\u09b8\u09cd\u09af \u09a8\u09bf\u09b0\u09cd\u09ac\u09be\u099a\u09a8 \u0995\u09b0\u09c1\u09a8\u0964', 'Select two family members above to discover their relationship.')
                            : t('\u098f\u09ac\u09be\u09b0 \u09a6\u09cd\u09ac\u09bf\u09a4\u09c0\u09df \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf \u09a8\u09bf\u09b0\u09cd\u09ac\u09be\u099a\u09a8 \u0995\u09b0\u09c1\u09a8\u0964', 'Now select the second person to compare.')}
                    </p>
                </div>
            )}

            {/* Result Card */}
            {relationResult && bothSelected && (
                <div className="relative z-0 fr-animate-in">
                    <div className="fr-glass rounded-3xl overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-yellow-400 to-red-500" />
                        <div className="bg-gradient-to-br from-stone-900 to-stone-800 px-5 sm:px-8 py-4 sm:py-5 flex items-center gap-3">
                            <span className="text-3xl">{relationResult.emoji}</span>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 mb-0.5">
                                    {t('\u09b8\u09ae\u09cd\u09aa\u09b0\u09cd\u0995\u09c7\u09b0 \u09ab\u09b2\u09be\u09ab\u09b2', 'Relationship Result')}
                                </p>
                                <h2 className="text-white font-serif font-bold text-xl sm:text-2xl leading-tight">
                                    {relationResult.text}
                                </h2>
                            </div>
                        </div>

                        <div className="p-5 sm:p-8 bg-gradient-to-b from-amber-50/50 to-white">
                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
                                <div className="flex flex-col items-center gap-1.5 flex-1">
                                    <Avatar member={personA} borderColor="border-orange-300" textColor="text-orange-800" />
                                    <p className="font-bold text-stone-800 text-sm text-center leading-tight">{formatName(personA)}</p>
                                    <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                                        {t('\u09b2\u09c7\u09ad\u09c7\u09b2', 'Lvl')} {formatNumber(personA.level)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center px-2 sm:px-4">
                                    <div className="flex flex-col items-center bg-white border-2 border-yellow-300 rounded-2xl px-4 py-2 shadow-md shadow-yellow-100 min-w-[60px]">
                                        <span className="text-3xl sm:text-4xl font-serif font-black text-orange-600 leading-none">
                                            {relationResult.depthStr}
                                        </span>
                                        <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400 text-center mt-0.5 leading-tight">
                                            {t('\u09aa\u09cd\u09b0\u099c\u09a8\u09cd\u09ae', 'Gen')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-1.5 flex-1">
                                    <Avatar member={personB} borderColor="border-red-300" textColor="text-red-800" />
                                    <p className="font-bold text-stone-800 text-sm text-center leading-tight">{formatName(personB)}</p>
                                    <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                                        {t('\u09b2\u09c7\u09ad\u09c7\u09b2', 'Lvl')} {formatNumber(personB.level)}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white border border-orange-100 rounded-2xl px-4 sm:px-6 py-4 shadow-inner text-center">
                                <p className="text-base sm:text-lg font-serif font-medium text-stone-700 leading-relaxed">
                                    {isBn ? (
                                        <>
                                            <span className="font-bold text-orange-700">{formatName(personB)}</span>
                                            {' \u09b9\u09b2\u09c7\u09a8 '}
                                            <span className="font-bold text-orange-700">{formatName(personA)}</span>
                                            {'-\u098f\u09b0 '}
                                            <span className="font-bold text-red-700 underline decoration-red-200 decoration-2 underline-offset-2">
                                                {relationResult.text}
                                            </span>।
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-bold text-orange-700">{formatName(personB)}</span>
                                            {' is the '}
                                            <span className="font-bold text-red-700 underline decoration-red-200 decoration-2 underline-offset-2">
                                                {relationResult.text}
                                            </span>
                                            {' of '}
                                            <span className="font-bold text-orange-700">{formatName(personA)}</span>.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindRelation;
