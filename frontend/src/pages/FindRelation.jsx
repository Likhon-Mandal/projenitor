import React, { useState } from 'react';
import { ArrowRightLeft, Users } from 'lucide-react';
import MemberSelector from '../components/MemberSelector';
import { useLanguage } from '../context/LanguageContext';

const FindRelation = () => {
    const { t, isBn, formatNumber, formatName } = useLanguage();
    const [personA, setPersonA] = useState(null);
    const [personB, setPersonB] = useState(null);

    // ─── Pure helpers ──────────────────────────────────────────────────────────
    const spousesOf = (x) => x.spouses || [];

    const areDirectSpouses = (a, b) =>
        spousesOf(a).some(s => s.id === b.id) || spousesOf(b).some(s => s.id === a.id);

    // Helper: identify role in tree (Based on provided Master Reference logic)
    // 1. Son (বংশের ছেলে): Male
    // 2. Daughter (বংশের মেয়ে): Female with a blood parent in tree
    // 3. Spouse (পুত্রবধূ): Female with no blood parent in tree
    const getRole = (p) => {
        if (p.gender !== 'Female') return 'son';
        if (p.father_id || p.mother_id) return 'daughter';
        return 'spouse';
    };

    // ─── Relationship Engine ───────────────────────────────────────────────────
    const calculateRelationship = () => {
        if (!personA || !personB) return null;

        const A = personA;
        const B = personB;

        if (A.id === B.id) {
            return { diff: 0, text: t('একই ব্যক্তি', 'Same person'), depthStr: '0' };
        }

        const levelDiff = A.level - B.level;
        const gg = Math.abs(levelDiff);
        const rel = (text) => ({ diff: levelDiff, text, depthStr: gg === 0 ? '0' : formatNumber(gg) });

        // 1. Determine who is older (higher generation = smaller level number)
        // If levels are equal, A is arbitrarily 'older' for logic mapping purposes.
        const older = A.level <= B.level ? A : B;
        const younger = A.level <= B.level ? B : A;

        const oRole = getRole(older);
        const yRole = getRole(younger);

        // 2. Check Direct Connection (For gg=0 and gg=1 cases)
        const isDirect = (() => {
            if (gg === 0) return areDirectSpouses(A, B);
            if (gg === 1) {
                // Direct blood child?
                if (younger.father_id === older.id || younger.mother_id === older.id) return true;
                // Daughter-in-law? (younger is spouse, older is parent of younger's husband)
                if (yRole === 'spouse' && younger.spouses) {
                    for (const sp of younger.spouses) {
                        if (sp.father_id === older.id || sp.mother_id === older.id) return true;
                    }
                }
            }
            return false;
        })();

        // 3. Helper to format result based on B's position
        const result = (titles) => {
            // titles = [ [olderBn, olderEn], [youngerBn, youngerEn] ]
            const titlePair = (B.id === older.id) ? titles[0] : titles[1];
            return rel(t(titlePair[0], titlePair[1] || titlePair[0])); 
        };

        // ── MASTER REFERENCE CHART MAPPING ─────────────────────────────────────
        
        if (gg >= 4) {
            return result([
                [`${formatNumber(gg)} প্রজন্ম আগের পূর্বসূরী`, `${gg} generations older Ancestor`], 
                [`${formatNumber(gg)} প্রজন্ম নিচের উত্তরসূরী`, `${gg} generations younger Descendant`]
            ]);
        }

        if (gg === 0) {
            if (oRole === 'son' && yRole === 'son') return result([['ভাই (দাদা / ভাই)', 'Brother'], ['ভাই (দাদা / ভাই)', 'Brother']]);
            if (oRole === 'daughter' && yRole === 'daughter') return result([['বোন (দিদি / বোন)', 'Sister'], ['বোন (দিদি / বোন)', 'Sister']]);
            if (oRole === 'spouse' && yRole === 'spouse') return result([['জা', 'Co-sister-in-law'], ['জা', 'Co-sister-in-law']]);
            
            if (oRole === 'son' && yRole === 'daughter') return result([['ভাই (দাদা / ভাই)', 'Brother'], ['বোন (দিদি / বোন)', 'Sister']]);
            if (oRole === 'daughter' && yRole === 'son') return result([['বোন (দিদি / বোন)', 'Sister'], ['ভাই (দাদা / ভাই)', 'Brother']]);

            if (oRole === 'son' && yRole === 'spouse') return isDirect ? result([['স্বামী', 'Husband'], ['স্ত্রী', 'Wife']]) : result([['দেবর / ভাসুর', 'Brother-in-law'], ['বৌদি / ছোট ভাইয়ের বউ', 'Sister-in-law']]);
            if (oRole === 'spouse' && yRole === 'son') return isDirect ? result([['স্ত্রী', 'Wife'], ['স্বামী', 'Husband']]) : result([['বৌদি / ছোট ভাইয়ের বউ', 'Sister-in-law'], ['দেবর / ভাসুর', 'Brother-in-law']]);

            if (oRole === 'daughter' && yRole === 'spouse') return result([['ননদ', 'Sister-in-law (Nanad)'], ['বৌদি / ছোট ভাইয়ের বউ', 'Sister-in-law (Boudi)']]);
            if (oRole === 'spouse' && yRole === 'daughter') return result([['বৌদি / ছোট ভাইয়ের বউ', 'Sister-in-law (Boudi)'], ['ননদ', 'Sister-in-law (Nanad)']]);
        }

        if (gg === 1) {
            if (oRole === 'son' && yRole === 'son') return isDirect ? result([['বাবা', 'Father'], ['ছেলে', 'Son']]) : result([['কাকা / জেঠা', 'Uncle'], ['ভাইপো', 'Nephew']]);
            if (oRole === 'son' && yRole === 'daughter') return isDirect ? result([['বাবা', 'Father'], ['মেয়ে', 'Daughter']]) : result([['কাকা / জেঠা', 'Uncle'], ['ভাইঝি', 'Niece']]);
            if (oRole === 'spouse' && yRole === 'son') return isDirect ? result([['মা', 'Mother'], ['ছেলে', 'Son']]) : result([['কাকী / জেঠী', 'Aunt'], ['ভাইপো (ভাসুরপো / দেওরের ছেলে)', 'Nephew']]);
            if (oRole === 'son' && yRole === 'spouse') return isDirect ? result([['শ্বশুর', 'Father-in-law'], ['পুত্রবধূ (বৌমা)', 'Daughter-in-law']]) : result([['কাকা / জেঠা শ্বশুর', 'Uncle-in-law'], ['ভাইপোর বউ (বৌমা)', 'Nephew\'s Wife']]);
            if (oRole === 'daughter' && yRole === 'son') return result([['পিসি', 'Aunt (Paternal)'], ['ভাইপো', 'Nephew']]); 
            
            if (oRole === 'spouse' && yRole === 'spouse') return isDirect ? result([['শাশুড়ি', 'Mother-in-law'], ['পুত্রবধূ (বৌমা)', 'Daughter-in-law']]) : result([['কাকি / জেঠি শাশুড়ি', 'Aunt-in-law'], ['ভাইপোর বউ (বৌমা)', 'Nephew\'s Wife']]);
            if (oRole === 'daughter' && yRole === 'daughter') return result([['পিসি', 'Aunt (Paternal)'], ['ভাইঝি', 'Niece']]); 
            if (oRole === 'spouse' && yRole === 'daughter') return isDirect ? result([['মা', 'Mother'], ['মেয়ে', 'Daughter']]) : result([['কাকি / জেঠি', 'Aunt'], ['ভাইঝি (ভাসুরঝি / দেওরের মেয়ে)', 'Niece']]);
            if (oRole === 'daughter' && yRole === 'spouse') return result([['পিসি শাশুড়ি', 'Aunt-in-law'], ['ভাইপোর বউ / বৌমা', 'Nephew\'s Wife']]);
        }

        if (gg === 2) {
            if (oRole === 'son' && yRole === 'son') return result([['ঠাকুরদা', 'Grandfather'], ['নাতি', 'Grandson']]);
            if (oRole === 'son' && yRole === 'daughter') return result([['ঠাকুরদা', 'Grandfather'], ['নাতিনী', 'Granddaughter']]);
            if (oRole === 'spouse' && yRole === 'son') return result([['ঠাকুমা', 'Grandmother'], ['নাতি', 'Grandson']]);
            if (oRole === 'son' && yRole === 'spouse') return result([['দাদুশ্বশুর (ঠাকুরদা শ্বশুর)', 'Grandfather-in-law'], ['নাতবউ', 'Grandson\'s Wife']]);
            if (oRole === 'daughter' && yRole === 'son') return result([['পিস-ঠাকুমা (বুড়ি পিসি)', 'Great-Aunt'], ['ভাইপোর ছেলে (নাতি)', 'Grandnephew']]);
            
            if (oRole === 'spouse' && yRole === 'spouse') return result([['ঠাকুমা শাশুড়ি', 'Grandmother-in-law'], ['নাতবউ', 'Grandson\'s Wife']]);
            if (oRole === 'daughter' && yRole === 'daughter') return result([['পিস-ঠাকুমা (বুড়ি পিসি)', 'Great-Aunt'], ['ভাইপোর মেয়ে (নাতিন)', 'Grandniece']]);
            if (oRole === 'daughter' && yRole === 'spouse') return result([['পিস-ঠাকুমা শাশুড়ি', 'Great-Aunt-in-law'], ['ভাইপোর ছেলের বউ (নাতিবউ)', 'Grandnephew\'s Wife']]);
            if (oRole === 'spouse' && yRole === 'daughter') return result([['ঠাকুমা', 'Grandmother'], ['নাতিনী', 'Granddaughter']]);
        }

        if (gg === 3) {
            if (oRole === 'son' && yRole === 'son') return result([['প্রপিতামহ (বড় ঠাকুরদা)', 'Great-Grandfather'], ['প্রপৌত্র (পুতি)', 'Great-Grandson']]);
            if (oRole === 'son' && yRole === 'daughter') return result([['প্রপিতামহ (বড় ঠাকুরদা)', 'Great-Grandfather'], ['প্রপৌত্রী (পুতি)', 'Great-Granddaughter']]);
            if (oRole === 'spouse' && yRole === 'son') return result([['বড় ঠাকুমা (বড়মা / প্রপিতামহী)', 'Great-Grandmother'], ['প্রপৌত্র (পুতি)', 'Great-Grandson']]);
            if (oRole === 'son' && yRole === 'spouse') return result([['প্রপিতামহ শ্বশুর (বড় দাদু শ্বশুর)', 'Great-Grandfather-in-law'], ['প্রপৌত্রবধূ (পুতিবউ)', 'Great-Grandson\'s Wife']]);
            if (oRole === 'daughter' && yRole === 'son') return result([['বড় পিসি (প্রপিতামহী পিসি)', 'Great-Great-Aunt'], ['ভাইপোর নাতি', 'Great-Grandnephew']]);
            
            if (oRole === 'spouse' && yRole === 'spouse') return result([['বড় ঠাকুমা শাশুড়ি', 'Great-Grandmother-in-law'], ['প্রপৌত্রবধূ (পুতিবউ)', 'Great-Grandson\'s Wife']]);
            if (oRole === 'daughter' && yRole === 'daughter') return result([['বড় পিসি', 'Great-Great-Aunt'], ['ভাইপোর নাতিনী', 'Great-Grandniece']]);
            if (oRole === 'daughter' && yRole === 'spouse') return result([['বড় পিসি শাশুড়ি', 'Great-Great-Aunt-in-law'], ['ভাইপোর নাতবউ', 'Great-Grandnephew\'s Wife']]);
            if (oRole === 'spouse' && yRole === 'daughter') return result([['বড় ঠাকুমা (প্রপিতামহী)', 'Great-Grandmother'], ['প্রপৌত্রী (পুতি)', 'Great-Granddaughter']]);
        }

        return rel(t('অজানা সম্পর্ক', 'Unknown Relation'));
    };

    // ─── Display name helper ───────────────────────────────────────────────────
    const getDisplayName = (target) => {
        return formatName(target);
    };

    const relationResult = calculateRelationship();

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Header */}
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-orange-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -z-10 opacity-50 -translate-x-1/2 translate-y-1/2"></div>
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4 tracking-tight drop-shadow-sm">
                        {t('সম্পর্ক', 'Find')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-700 block sm:inline">{t('নির্ণয়', 'Relationship')}</span>
                    </h1>
                    <p className="text-stone-500 max-w-lg text-lg font-light">
                        {t('বংশগত স্তরের তুলনা করে যে কোনো দুজন পরিবারের সদস্যের মধ্যে প্রজন্মের ব্যবধান এবং সম্পর্ক জানুন।', 'Compare generational levels to discover the generational gap and relation between any two family members.')}
                    </p>
                </div>
                <div className="w-24 h-24 bg-white rounded-full shadow-lg border-4 border-orange-50 flex items-center justify-center shrink-0 relative z-10 animate-pulse-slow">
                    <Users size={40} className="text-orange-500" />
                </div>
            </div>

            {/* Person Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start relative z-20">
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-stone-100 hover:shadow-lg transition-shadow duration-300 relative z-30">
                    <MemberSelector
                        label={t('প্রথম ব্যক্তি নির্বাচন করুন', 'Select First Person')}
                        onSelect={setPersonA}
                        selectedMember={personA}
                    />
                </div>

                <div className="md:col-span-1 flex items-center justify-center h-full py-8 md:py-0 relative z-10">
                    <div className="hidden md:block absolute left-0 right-0 top-1/2 h-1 bg-stone-200 -z-10 rounded-full w-full"></div>
                    <button
                        onClick={() => { const tmp = personA; setPersonA(personB); setPersonB(tmp); }}
                        disabled={!personA && !personB}
                        className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-md transition-all duration-500 cursor-pointer
                            ${(personA || personB) ? 'hover:scale-105 active:scale-95' : ''}
                            ${(personA && personB) ? 'bg-orange-500 hover:bg-orange-600 border-white text-white scale-110 shadow-orange-500/20' : 'bg-white border-stone-100 text-stone-300 scale-100'}`}
                    >
                        <ArrowRightLeft size={24} className={(personA && personB) ? 'animate-pulse' : ''} />
                    </button>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-stone-100 hover:shadow-lg transition-shadow duration-300 relative z-30">
                    <MemberSelector
                        label={t('দ্বিতীয় ব্যক্তি নির্বাচন করুন', 'Select Second Person')}
                        onSelect={setPersonB}
                        selectedMember={personB}
                    />
                </div>
            </div>

            {/* Results */}
            {relationResult && (
                <div className="mt-8 animate-slide-up origin-top p-1">
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100/50">
                        <div className="bg-stone-900 px-8 py-6 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 to-red-900/20"></div>
                            <h2 className="text-sm font-bold tracking-[0.2em] text-orange-400 uppercase relative z-10">{t('সম্পর্কের দূরত্ব', 'Relationship Distance')}</h2>
                        </div>
                        <div className="p-8 md:p-12 text-center bg-gradient-to-b from-[#fffcf5] to-white">
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-10">

                                <div className="flex flex-col items-center group">
                                    <div className="w-24 h-24 rounded-full border-4 border-orange-200 bg-white overflow-hidden shadow-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        {personA.profile_image_url
                                            ? <img src={personA.profile_image_url} alt="" className="w-full h-full object-cover" />
                                            : <span className="font-serif text-3xl text-orange-800 font-bold">{personA.full_name?.charAt(0)}</span>}
                                    </div>
                                    <span className="font-bold text-stone-800 text-lg">{getDisplayName(personA)}</span>
                                    <span className="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full mt-1">{t('লেভেল', 'Level')} {formatNumber(personA.level)}</span>
                                </div>

                                <div className="flex flex-col items-center text-orange-500 px-4">
                                    <span className="text-5xl font-serif font-bold text-orange-600 drop-shadow-sm mb-1">{relationResult.depthStr}</span>
                                    <span className="text-xs uppercase tracking-widest font-bold text-stone-400">{t('প্রজন্মের ব্যবধান', 'Generation Gap')}</span>
                                </div>

                                <div className="flex flex-col items-center group">
                                    <div className="w-24 h-24 rounded-full border-4 border-red-200 bg-white overflow-hidden shadow-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        {personB.profile_image_url
                                            ? <img src={personB.profile_image_url} alt="" className="w-full h-full object-cover" />
                                            : <span className="font-serif text-3xl text-red-800 font-bold">{personB.full_name?.charAt(0)}</span>}
                                    </div>
                                    <span className="font-bold text-stone-800 text-lg">{getDisplayName(personB)}</span>
                                    <span className="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full mt-1">{t('লেভেল', 'Level')} {formatNumber(personB.level)}</span>
                                </div>

                            </div>

                            <div className="inline-block bg-orange-50 border border-orange-200 px-8 py-4 rounded-full shadow-inner relative max-w-2xl w-full mx-auto">
                                <p className="text-xl md:text-2xl font-serif font-medium text-stone-800 leading-snug">
                                    {isBn ? (
                                        <>
                                            <span className="font-bold text-orange-700">{getDisplayName(personB)}</span> হলেন <span className="font-bold text-orange-700">{getDisplayName(personA)}</span> -এর <span className="font-bold text-red-700 border-b-2 border-red-200">{relationResult.text}</span>।
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-bold text-orange-700">{getDisplayName(personB)}</span> is the <span className="font-bold text-red-700 border-b-2 border-red-200">{relationResult.text}</span> of <span className="font-bold text-orange-700">{getDisplayName(personA)}</span>.
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
