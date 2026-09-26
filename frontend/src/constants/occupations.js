/**
 * Standard occupations with dual Bangla and English representation
 * Format: "বাংলা / English"
 */
export const STANDARD_OCCUPATIONS = [
  { bangla: 'কৃষক', english: 'Farmer', label: 'কৃষক / Farmer', aliases: ['krishok', 'chashi', 'farmer'] },
  { bangla: 'শিক্ষক', english: 'Teacher', label: 'শিক্ষক / Teacher', aliases: ['shikkhok', 'teacher'] },
  { bangla: 'অধ্যাপক', english: 'Professor', label: 'অধ্যাপক / Professor', aliases: ['oddhapok', 'professor'] },
  { bangla: 'গৃহিণী', english: 'Housewife', label: 'গৃহিণী / Housewife', aliases: ['grihini', 'housewife', 'homemaker'] },
  { bangla: 'ব্যবসায়ী', english: 'Businessman', label: 'ব্যবসায়ী / Businessman', aliases: ['bebshayee', 'businessman'] },
  { bangla: 'সরকারি চাকরিজীবী', english: 'Civil Servant', label: 'সরকারি চাকরিজীবী / Civil Servant', aliases: ['sorkari', 'govt', 'civil servant'] },
  { bangla: 'বেসরকারি চাকরিজীবী', english: 'Private Service', label: 'বেসরকারি চাকরিজীবী / Private Service', aliases: ['besorkari', 'private service'] },
  { bangla: 'ডাক্তার', english: 'Doctor', label: 'ডাক্তার / Doctor', aliases: ['daktar', 'doctor', 'physician'] },
  { bangla: 'নার্স / সেবিকা', english: 'Nurse', label: 'নার্স / Nurse', aliases: ['nurse', 'sebika'] },
  { bangla: 'প্রকৌশলী', english: 'Engineer', label: 'প্রকৌশলী / Engineer', aliases: ['engineer', 'prokousholi'] },
  { bangla: 'ব্যাংকার', english: 'Banker', label: 'ব্যাংকার / Banker', aliases: ['banker', 'bank'] },
  { bangla: 'আইনজীবী', english: 'Lawyer', label: 'আইনজীবী / Lawyer', aliases: ['lawyer', 'ainjibi', 'advocate', 'ukil'] },
  { bangla: 'ছাত্র / ছাত্রী', english: 'Student', label: 'ছাত্র / ছাত্রী / Student', aliases: ['student', 'chhatro', 'chhatri'] },
  { bangla: 'প্রবাসী', english: 'Expatriate', label: 'প্রবাসী / Expatriate', aliases: ['probashi', 'expatriate', 'nri'] },
  { bangla: 'চালক', english: 'Driver', label: 'চালক / Driver', aliases: ['chalok', 'driver'] },
  { bangla: 'ছুতার / কাঠমিস্ত্রী', english: 'Carpenter', label: 'ছুতার / কাঠমিস্ত্রী / Carpenter', aliases: ['chutar', 'katmistri', 'carpenter'] },
  { bangla: 'দর্জি', english: 'Tailor', label: 'দর্জি / Tailor', aliases: ['dorji', 'tailor'] },
  { bangla: 'শিল্পী', english: 'Artist', label: 'শিল্পী / Artist', aliases: ['shilpi', 'artist'] },
  { bangla: 'বিজ্ঞানী', english: 'Scientist', label: 'বিজ্ঞানী / Scientist', aliases: ['biggani', 'scientist'] },
  { bangla: 'সেনাবাহিনী', english: 'Soldier', label: 'সেনাবাহিনী / Soldier', aliases: ['senabahini', 'army', 'soldier', 'military'] },
  { bangla: 'পুলিশ কর্মকর্তা', english: 'Police Officer', label: 'পুলিশ কর্মকর্তা / Police Officer', aliases: ['police', 'police officer'] },
  { bangla: 'পাইলট', english: 'Pilot', label: 'পাইলট / Pilot', aliases: ['pilot'] },
  { bangla: 'ব্যবসায়ী / সওদাগর', english: 'Merchant', label: 'ব্যবসায়ী / Merchant', aliases: ['merchant', 'soudagor'] },
  { bangla: 'সাংবাদিক', english: 'Journalist', label: 'সাংবাদিক / Journalist', aliases: ['sangbadik', 'journalist'] },
  { bangla: 'ইলেকট্রিশিয়ান', english: 'Electrician', label: 'ইলেকট্রিশিয়ান / Electrician', aliases: ['electrician'] },
  { bangla: 'সফটওয়্যার ডেভেলপার', english: 'Software Developer', label: 'সফটওয়্যার ডেভেলপার / Software Developer', aliases: ['software developer', 'programmer'] },
  { bangla: 'হিসাবরক্ষক', english: 'Accountant', label: 'হিসাবরক্ষক / Accountant', aliases: ['hisabrokkhok', 'accountant'] },
  { bangla: 'ফায়ার সার্ভিস কর্মী', english: 'Fire Fighter', label: 'ফায়ার সার্ভিস কর্মী / Fire Fighter', aliases: ['fire service', 'fire fighter'] },
  { bangla: 'সংস্থা কর্মী', english: 'NGO Worker', label: 'সংস্থা কর্মী / NGO Worker', aliases: ['ngo', 'songstha'] },
  { bangla: 'সমাজসেবক', english: 'Social Worker', label: 'সমাজসেবক / Social Worker', aliases: ['somajsebok', 'social worker'] },
  { bangla: 'অবসরপ্রাপ্ত', english: 'Retired', label: 'অবসরপ্রাপ্ত / Retired', aliases: ['obshorpropto', 'retired'] },
  { bangla: 'অন্যান্য', english: 'Other', label: 'অন্যান্য / Other', aliases: ['onnano', 'other'] }
];

/**
 * Mapping existing database entries (single-language or variants)
 * to their standardized "বাংলা / English" format
 */
export const LEGACY_OCCUPATION_MAP = {
  'farmer': 'কৃষক / Farmer',
  'কৃষক': 'কৃষক / Farmer',
  'teacher': 'শিক্ষক / Teacher',
  'teacher (retired)': 'অবসরপ্রাপ্ত শিক্ষক / Retired Teacher',
  'শিক্ষক': 'শিক্ষক / Teacher',
  'doctor': 'ডাক্তার / Doctor',
  'engineer': 'প্রকৌশলী / Engineer',
  'housewife': 'গৃহিণী / Housewife',
  'homemaker': 'গৃহিণী / Housewife',
  'grihini': 'গৃহিণী / Housewife',
  'গৃহিণী': 'গৃহিণী / Housewife',
  'ইঞ্জিনিয়ার': 'প্রকৌশলী / Engineer',
  'ডিপ্লোমা ইঞ্জিনিয়ার': 'ডিপ্লোমা প্রকৌশলী / Diploma Engineer',
  'lawyer': 'আইনজীবী / Lawyer',
  'banker': 'ব্যাংকার / Banker',
  'ব্যাংক কর্মকর্তা': 'ব্যাংকার / Banker',
  'ব্যাংক  কর্মকর্তা': 'ব্যাংকার / Banker',
  'merchant': 'ব্যবসায়ী / Merchant',
  'ব্যবসায়ী': 'ব্যবসায়ী / Businessman',
  'ব্যবসায়ী': 'ব্যবসায়ী / Businessman',
  'ব্যবসায়ী (প্রাক্তন মেম্বার)': 'ব্যবসায়ী / Businessman (Ex-Member)',
  'pilot': 'পাইলট / Pilot',
  'nurse': 'নার্স / Nurse',
  'civil servant': 'সরকারি চাকরিজীবী / Civil Servant',
  'scientist': 'বিজ্ঞানী / Scientist',
  'carpenter': 'ছুতার / কাঠমিস্ত্রী / Carpenter',
  'কাঠমিস্ত্রী': 'ছুতার / কাঠমিস্ত্রী / Carpenter',
  'artist': 'শিল্পী / Artist',
  'soldier': 'সেনাবাহিনী / Soldier',
  'সেনাবাহিনী': 'সেনাবাহিনী / Soldier',
  'police inspector': 'পুলিশ কর্মকর্তা / Police Officer',
  'student': 'ছাত্র / ছাত্রী / Student',
  'ছাত্র': 'ছাত্র / ছাত্রী / Student',
  'প্রবাসী': 'প্রবাসী / Expatriate',
  'ফায়ার সার্ভিস': 'ফায়ার সার্ভিস কর্মী / Fire Fighter',
  'সংস্থা কর্মী': 'সংস্থা কর্মী / NGO Worker',
  'চাকুরীজীবী': 'চাকরিজীবী / Service Holder',
  'বেসরকারী চাকুরীজীবী': 'বেসরকারি চাকরিজীবী / Private Service',
  'বেসরকারি চাকুরীজীবি': 'বেসরকারি চাকরিজীবী / Private Service',
  'তসিলদার': 'তহশিলদার / Revenue Officer (Tahsildar)',
};

/**
 * Check if a legacy string has a standardized counterpart
 */
export const getStandardEquivalent = (value) => {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return LEGACY_OCCUPATION_MAP[key] || LEGACY_OCCUPATION_MAP[value.trim()] || null;
};
