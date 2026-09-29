/**
 * Utility to identify member role (Son, Daughter, Spouse, or Default)
 * and provide soft, elegant color themes for profile cards across the app.
 */

export const getMemberIdentity = (member) => {
  if (!member) return 'default';

  // Explicit relationType / role if provided
  if (member.relationType === 'spouse' || member.role === 'spouse' || member.is_spouse) return 'spouse';
  if (member.relationType === 'son') return 'son';
  if (member.relationType === 'daughter') return 'daughter';

  const g = (member.gender || '').toLowerCase().trim();
  const hasParents = Boolean(member.father_id || member.mother_id);
  const hasSpouse = Boolean(member.spouse_id || (member.spouses && member.spouses.length > 0));

  // In traditional lineage: female member married to a family descendant with no tree parents of her own
  if (g === 'female' && hasSpouse && !hasParents) {
    return 'spouse';
  }

  if (g === 'male') return 'son';
  if (g === 'female') return 'daughter';

  return 'default';
};

export const MEMBER_THEMES = {
  son: {
    id: 'son',
    labelBn: 'পুত্র',
    labelEn: 'Son',
    symbol: '♂',
    // Card styles (MemberCard)
    cardBorder: 'border-sky-100 hover:border-sky-300',
    cardBgHover: 'hover:bg-sky-50/15',
    cardGlow: 'hover:shadow-sky-100/60',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    avatarBg: 'bg-sky-50 text-sky-700',
    avatarBorder: 'border-sky-200',
    avatarHoverBorder: 'group-hover:border-sky-400',
    nameText: 'text-stone-900 group-hover:text-sky-800',
    iconColor: 'text-sky-600',
    button: 'border-sky-600 text-sky-700 hover:bg-sky-600 hover:text-white',
    // Big Modal styles (Profile)
    headerBg: 'bg-gradient-to-r from-sky-800 via-blue-800 to-indigo-900',
    avatarBigBg: 'bg-sky-50 text-sky-700',
    avatarBigBorder: 'border-sky-200',
    heading: 'text-sky-900 border-sky-100',
    itemHover: 'hover:bg-sky-50/60',
    itemIcon: 'text-sky-600',
    treeBtn: 'border-sky-200 text-sky-800 hover:bg-sky-50 hover:border-sky-300',
  },
  daughter: {
    id: 'daughter',
    labelBn: 'কন্যা',
    labelEn: 'Daughter',
    symbol: '♀',
    // Card styles (MemberCard)
    cardBorder: 'border-rose-100 hover:border-rose-300',
    cardBgHover: 'hover:bg-rose-50/15',
    cardGlow: 'hover:shadow-rose-100/60',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    avatarBg: 'bg-rose-50 text-rose-700',
    avatarBorder: 'border-rose-200',
    avatarHoverBorder: 'group-hover:border-rose-400',
    nameText: 'text-stone-900 group-hover:text-rose-800',
    iconColor: 'text-rose-500',
    button: 'border-rose-600 text-rose-700 hover:bg-rose-600 hover:text-white',
    // Big Modal styles (Profile)
    headerBg: 'bg-gradient-to-r from-rose-700 via-pink-700 to-rose-900',
    avatarBigBg: 'bg-rose-50 text-rose-700',
    avatarBigBorder: 'border-rose-200',
    heading: 'text-rose-900 border-rose-100',
    itemHover: 'hover:bg-rose-50/60',
    itemIcon: 'text-rose-500',
    treeBtn: 'border-rose-200 text-rose-800 hover:bg-rose-50 hover:border-rose-300',
  },
  spouse: {
    id: 'spouse',
    labelBn: 'সহধর্মিণী',
    labelEn: 'Spouse',
    symbol: '❤',
    // Card styles (MemberCard)
    cardBorder: 'border-emerald-100 hover:border-emerald-300',
    cardBgHover: 'hover:bg-emerald-50/15',
    cardGlow: 'hover:shadow-emerald-100/60',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-50 text-emerald-700',
    avatarBorder: 'border-emerald-200',
    avatarHoverBorder: 'group-hover:border-emerald-400',
    nameText: 'text-stone-900 group-hover:text-emerald-800',
    iconColor: 'text-emerald-600',
    button: 'border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white',
    // Big Modal styles (Profile)
    headerBg: 'bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-950',
    avatarBigBg: 'bg-emerald-50 text-emerald-700',
    avatarBigBorder: 'border-emerald-200',
    heading: 'text-emerald-900 border-emerald-100',
    itemHover: 'hover:bg-emerald-50/60',
    itemIcon: 'text-emerald-600',
    treeBtn: 'border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300',
  },
  default: {
    id: 'default',
    labelBn: 'সদস্য',
    labelEn: 'Member',
    symbol: '✦',
    // Card styles (MemberCard)
    cardBorder: 'border-orange-100 hover:border-orange-300',
    cardBgHover: 'hover:bg-orange-50/15',
    cardGlow: 'hover:shadow-orange-100/60',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    avatarBg: 'bg-orange-100 text-orange-800',
    avatarBorder: 'border-orange-200',
    avatarHoverBorder: 'group-hover:border-amber-400',
    nameText: 'text-stone-900 group-hover:text-orange-900',
    iconColor: 'text-orange-600',
    button: 'border-orange-800 text-orange-800 hover:bg-orange-800 hover:text-white',
    // Big Modal styles (Profile)
    headerBg: 'bg-gradient-to-r from-orange-800 via-orange-900 to-stone-900',
    avatarBigBg: 'bg-orange-100 text-orange-800',
    avatarBigBorder: 'border-orange-200',
    heading: 'text-orange-900 border-orange-100',
    itemHover: 'hover:bg-orange-50/60',
    itemIcon: 'text-orange-700',
    treeBtn: 'border-orange-200 text-orange-800 hover:bg-orange-50 hover:border-orange-300',
  },
};
