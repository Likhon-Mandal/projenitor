/**
 * Genealogical Relationship Calculator Engine
 * Calculates familial relationships between two members in the tree.
 */

export const spousesOf = (x) => x?.spouses || [];

export const areDirectSpouses = (a, b) => {
    if (!a || !b) return false;
    return spousesOf(a).some(s => s.id === b.id) || spousesOf(b).some(s => s.id === a.id);
};

export const getRole = (p) => {
    if (!p) return 'son';
    if (p.gender !== 'Female') return 'son';
    if (p.father_id || p.mother_id) return 'daughter';
    return 'spouse';
};

export const calculateRelationshipEngine = (personA, personB, { t = (bn, en) => bn, formatNumber = (n) => n } = {}) => {
    if (!personA || !personB) return null;
    const A = personA;
    const B = personB;

    if (A.id === B.id) {
        return {
            diff: 0,
            text: t('একই ব্যক্তি', 'Same person'),
            depthStr: '0',
            emoji: '👤',
            isSamePerson: true
        };
    }

    const aLevel = Number(A.level) || 0;
    const bLevel = Number(B.level) || 0;
    const levelDiff = aLevel - bLevel;
    const gg = Math.abs(levelDiff);

    const rel = (text, emoji = '🔗') => ({
        diff: levelDiff,
        text,
        depthStr: gg === 0 ? '0' : formatNumber(gg),
        emoji,
        isSamePerson: false
    });

    const older   = aLevel <= bLevel ? A : B;
    const younger = aLevel <= bLevel ? B : A;
    const oRole = getRole(older);
    const yRole = getRole(younger);

    const isDirect = (() => {
        if (gg === 0) return areDirectSpouses(A, B);
        if (gg === 1) {
            if (younger.father_id === older.id || younger.mother_id === older.id) return true;
            if (yRole === 'spouse' && younger.spouses) {
                for (const sp of younger.spouses) {
                    if (sp.father_id === older.id || sp.mother_id === older.id) return true;
                }
            }
        }
        return false;
    })();

    const result = (titles, emoji) => {
        const titlePair = (B.id === older.id) ? titles[0] : titles[1];
        return rel(t(titlePair[0], titlePair[1] || titlePair[0]), emoji);
    };

    if (gg >= 4) {
        return result([
            [formatNumber(gg) + ' প্রজন্ম আগের পূর্বসূরী', gg + ' generations older Ancestor'],
            [formatNumber(gg) + ' প্রজন্ম নিচের উত্তরসূরী', gg + ' generations younger Descendant']
        ], '🌳');
    }

    if (gg === 0) {
        if (oRole === 'son' && yRole === 'son') return result([['ভাই (দাদা / ভাই)', 'Brother'], ['ভাই (দাদা / ভাই)', 'Brother']], '🤝');
        if (oRole === 'daughter' && yRole === 'daughter') return result([['বোন (দিদি / বোন)', 'Sister'], ['বোন (দিদি / বোন)', 'Sister']], '💞');
        if (oRole === 'spouse' && yRole === 'spouse') return result([['জা', 'Co-sister-in-law'], ['জা', 'Co-sister-in-law']], '🌸');
        if (oRole === 'son' && yRole === 'daughter') return result([['ভাই', 'Brother'], ['বোন', 'Sister']], '🤝');
        if (oRole === 'daughter' && yRole === 'son') return result([['বোন', 'Sister'], ['ভাই', 'Brother']], '🤝');
        if (oRole === 'son' && yRole === 'spouse') {
            return isDirect
                ? result([['স্বামী', 'Husband'], ['স্ত্রী', 'Wife']], '💍')
                : result([['দেবর / ভাসুর', 'Brother-in-law'], ['বৌদি / ছোট ভাইয়ের বউ', 'Sister-in-law']], '🔗');
        }
        if (oRole === 'spouse' && yRole === 'son') {
            return isDirect
                ? result([['স্ত্রী', 'Wife'], ['স্বামী', 'Husband']], '💍')
                : result([['বৌদি / ছোট ভাইয়ের বউ', 'Sister-in-law'], ['দেবর / ভাসুর', 'Brother-in-law']], '🔗');
        }
        if (oRole === 'daughter' && yRole === 'spouse') return result([['ননদ', 'Sister-in-law (Nanad)'], ['বৌদি', 'Sister-in-law (Boudi)']], '🌸');
        if (oRole === 'spouse' && yRole === 'daughter') return result([['বৌদি', 'Sister-in-law (Boudi)'], ['ননদ', 'Sister-in-law (Nanad)']], '🌸');
    }

    if (gg === 1) {
        if (oRole === 'son' && yRole === 'son') {
            return isDirect
                ? result([['বাবা', 'Father'], ['ছেলে', 'Son']], '👨‍👦')
                : result([['কাকা / জেঠা', 'Uncle'], ['ভাইপো', 'Nephew']], '👨‍👦');
        }
        if (oRole === 'son' && yRole === 'daughter') {
            return isDirect
                ? result([['বাবা', 'Father'], ['মেয়ে', 'Daughter']], '👨‍👧')
                : result([['কাকা / জেঠা', 'Uncle'], ['ভাইঝি', 'Niece']], '👨‍👧');
        }
        if (oRole === 'spouse' && yRole === 'son') {
            return isDirect
                ? result([['মা', 'Mother'], ['ছেলে', 'Son']], '👩‍👦')
                : result([['কাকী / জেঠী', 'Aunt'], ['ভাইপো', 'Nephew']], '👩‍👦');
        }
        if (oRole === 'son' && yRole === 'spouse') {
            return isDirect
                ? result([['শ্বশুর', 'Father-in-law'], ['পুত্রবধূ', 'Daughter-in-law']], '👨‍👩‍👦')
                : result([['কাকা / জেঠা শ্বশুর', 'Uncle-in-law'], ['ভাইপোর বউ', "Nephew's Wife"]], '🔗');
        }
        if (oRole === 'daughter' && yRole === 'son') return result([['পিসি', 'Aunt (Paternal)'], ['ভাইপো', 'Nephew']], '👩‍👦');
        if (oRole === 'spouse' && yRole === 'spouse') {
            return isDirect
                ? result([['শাশুড়ি', 'Mother-in-law'], ['পুত্রবধূ', 'Daughter-in-law']], '👩‍👩‍👦')
                : result([['কাকি / জেঠি শাশুড়ি', 'Aunt-in-law'], ['ভাইপোর বউ', "Nephew's Wife"]], '🔗');
        }
        if (oRole === 'daughter' && yRole === 'daughter') return result([['পিসি', 'Aunt (Paternal)'], ['ভাইঝি', 'Niece']], '👩‍👧');
        if (oRole === 'spouse' && yRole === 'daughter') {
            return isDirect
                ? result([['মা', 'Mother'], ['মেয়ে', 'Daughter']], '👩‍👧')
                : result([['কাকি / জেঠি', 'Aunt'], ['ভাইঝি', 'Niece']], '👩‍👧');
        }
        if (oRole === 'daughter' && yRole === 'spouse') return result([['পিসি শাশুড়ি', 'Aunt-in-law'], ['ভাইপোর বউ', "Nephew's Wife"]], '🔗');
    }

    if (gg === 2) {
        if (oRole === 'son' && yRole === 'son') return result([['ঠাকুরদা', 'Grandfather'], ['নাতি', 'Grandson']], '👴');
        if (oRole === 'son' && yRole === 'daughter') return result([['ঠাকুরদা', 'Grandfather'], ['নাতিনী', 'Granddaughter']], '👴');
        if (oRole === 'spouse' && yRole === 'son') return result([['ঠাকুরমা', 'Grandmother'], ['নাতি', 'Grandson']], '👵');
        if (oRole === 'son' && yRole === 'spouse') return result([['দাদুশ্বশুর', 'Grandfather-in-law'], ['নাতবউ', "Grandson's Wife"]], '🔗');
        if (oRole === 'daughter' && yRole === 'son') return result([['পিস-ঠাকুরমা', 'Great-Aunt'], ['ভাইপোর ছেলে', 'Grandnephew']], '👩‍👦');
        if (oRole === 'spouse' && yRole === 'spouse') return result([['ঠাকুরমা শাশুড়ি', 'Grandmother-in-law'], ['নাতবউ', "Grandson's Wife"]], '🔗');
        if (oRole === 'daughter' && yRole === 'daughter') return result([['পিস-ঠাকুরমা', 'Great-Aunt'], ['ভাইপোর মেয়ে', 'Grandniece']], '👩‍👧');
        if (oRole === 'daughter' && yRole === 'spouse') return result([['পিস-ঠাকুরমা শাশুড়ি', 'Great-Aunt-in-law'], ['নাতবউ', "Grandnephew's Wife"]], '🔗');
        if (oRole === 'spouse' && yRole === 'daughter') return result([['ঠাকুরমা', 'Grandmother'], ['নাতিনী', 'Granddaughter']], '👵');
    }

    if (gg === 3) {
        if (oRole === 'son' && yRole === 'son') return result([['প্রপিতামহ', 'Great-Grandfather'], ['প্রপৌত্র', 'Great-Grandson']], '🌳');
        if (oRole === 'son' && yRole === 'daughter') return result([['প্রপিতামহ', 'Great-Grandfather'], ['প্রপৌত্রী', 'Great-Granddaughter']], '🌳');
        if (oRole === 'spouse' && yRole === 'son') return result([['বড় ঠাকুরমা', 'Great-Grandmother'], ['প্রপৌত্র', 'Great-Grandson']], '🌳');
        if (oRole === 'son' && yRole === 'spouse') return result([['প্রপিতামহ শ্বশুর', 'Great-Grandfather-in-law'], ['প্রপৌত্রবধূ', "Great-Grandson's Wife"]], '🌳');
        if (oRole === 'daughter' && yRole === 'son') return result([['বড় পিসি', 'Great-Great-Aunt'], ['ভাইপোর নাতি', 'Great-Grandnephew']], '🌳');
        if (oRole === 'spouse' && yRole === 'spouse') return result([['বড় ঠাকুরমা শাশুড়ি', 'Great-Grandmother-in-law'], ['প্রপৌত্রবধূ', "Great-Grandson's Wife"]], '🌳');
        if (oRole === 'daughter' && yRole === 'daughter') return result([['বড় পিসি', 'Great-Great-Aunt'], ['ভাইপোর নাতিনী', 'Great-Grandniece']], '🌳');
        if (oRole === 'daughter' && yRole === 'spouse') return result([['বড় পিসি শাশুড়ি', 'Great-Great-Aunt-in-law'], ['নাতবউ', "Great-Grandnephew's Wife"]], '🌳');
        if (oRole === 'spouse' && yRole === 'daughter') return result([['বড় ঠাকুরমা', 'Great-Grandmother'], ['প্রপৌত্রী', 'Great-Granddaughter']], '🌳');
    }

    return rel(t('অজানা সম্পর্ক', 'Unknown Relation'), '❓');
};
