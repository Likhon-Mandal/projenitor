CREATE TABLE IF NOT EXISTS history_records (
    id SERIAL PRIMARY KEY,
    title_bn VARCHAR(255),
    title_en VARCHAR(255),
    content_bn TEXT NOT NULL,
    content_en TEXT,
    display_order INT DEFAULT 0,
    is_lead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial records if table is newly created
INSERT INTO history_records (title_bn, title_en, content_bn, content_en, display_order, is_lead)
SELECT
    NULL,
    NULL,
    'আমাদের সমাজের শেকড় প্রোথিত পরম শ্রদ্ধেয় ক্ষণজন্মা পুরুষ ভগবান চন্দ্র বাড়ৈর আদর্শে। মাদারীপুর, গোপালগঞ্জ, বরিশাল ও পিরোজপুরসহ দেশ-বিদেশে বিস্তৃত আমাদের পরিবারটি আজ ১০,০০০-এরও বেশি সদস্যের এক সুদৃঢ় আত্মিক বন্ধন ও সমৃদ্ধ সমাজ।',
    'Our community traces its roots back to the visionary Bhagoban Chandra Barai. Spread across the districts of Madaripur, Gopalganj, Barishal, and Pirojpur, our family has grown into a vibrant community of over 10,000 members.',
    1,
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM history_records WHERE display_order = 1);

INSERT INTO history_records (title_bn, title_en, content_bn, content_en, display_order, is_lead)
SELECT
    '২০১৩ সালের ঐতিহাসিক কুলগ্রন্থ',
    'The 2013 Ancestral Book',
    '২০১৩ সালে আমাদের ঐতিহ্য সংরক্ষণে এক অনন্য ও ঐতিহাসিক প্রয়াস নেওয়া হয়। ৩০৫ পৃষ্ঠার এক সুপরিসর বংশবৃত্তান্ত পুস্তক প্রকাশিত হয়, যেখানে প্রতিটি পরিবারের বংশলতিকা ও ব্যক্তিগত তথ্য অত্যন্ত যত্নের সাথে লিপিবদ্ধ করা হয়েছিল। এই গ্রন্থটি আমাদের সবার যৌথ পরিচিতির মূল ভিত্তি হয়ে ওঠে, যা কালগর্ভে হারিয়ে যাওয়া থেকে রক্ষা করেছে আমাদের অমূল্য ইতিহাস।',
    'In 2013, a monumental effort was undertaken to document our history. A 305-page book was published, meticulously recording the lineage and personal details of our community members. This book served as the cornerstone of our shared identity, preserving information that might otherwise have been lost to time.',
    2,
    FALSE
WHERE NOT EXISTS (SELECT 1 FROM history_records WHERE display_order = 2);

INSERT INTO history_records (title_bn, title_en, content_bn, content_en, display_order, is_lead)
SELECT
    'বার্ষিক মিলনমেলা ও জ্ঞাতি সম্মেলন',
    'The Annual Gathering',
    'প্রতি বছর বাংলা পঞ্জিকা অনুযায়ী ১০ই ফাল্গুন আমাদের বংশের সকল জ্ঞাতিবর্গ একত্রে মিলিত হন। সম্প্রতি আমাদের গ্রামে ৯৩তম ঐতিহাসিক সম্মেলন অনুষ্ঠিত হয়েছে, যা প্রায় এক শতাব্দীর একতা ও ঐতিহ্যের এক চিরন্তন স্মারক। এই আয়োজন শুধু আনুষ্ঠানিকতা নয়; বরং এটি আমাদের রক্তের অবিচ্ছেদ্য সম্পর্কের এক জীবন্ত উৎসব।',
    'Every year, on the 10th of Falgun (Bengali Calendar), our community comes together to celebrate our bond. The 93rd gathering was recently hosted in our village, marking nearly a century of unity and tradition. These gatherings are not just events; they are a testament to our enduring connection.',
    3,
    FALSE
WHERE NOT EXISTS (SELECT 1 FROM history_records WHERE display_order = 3);

INSERT INTO history_records (title_bn, title_en, content_bn, content_en, display_order, is_lead)
SELECT
    'ডিজিটাল যুগের পদার্পণ',
    'Moving to the Digital Age',
    'আজ সেই ঐতিহ্যকে আধুনিক প্রজন্মের কাছে সহজে পৌঁছে দিতে আমরা ডিজিটাল রূপান্তর শুরু করেছি। প্রজেনিটর (Projenitor) প্ল্যাটফর্মের মাধ্যমে বিশ্বের যেকোনো প্রান্তে অবস্থানরত প্রতিটি জ্ঞাতির কাছে আমাদের এই ইতিহাস উন্মুক্ত ও জীবন্ত রাখা সম্ভব হচ্ছে। অতীতের ঐতিহ্য আর ভবিষ্যতের প্রযুক্তির মেলবন্ধনে আমরা নিশ্চিত করছি ভগবান চন্দ্র বাড়ৈর স্মৃতি ও চেতনা প্রজন্ম থেকে প্রজন্মান্তরে চির জাগ্রত থাকবে।',
    'Today, we are taking a significant step forward by digitizing our records. Projenitor, our new web-based platform, aims to make this rich history accessible to every member, wherever they may be in the world. By bridging the past with the future, we ensure that the legacy of Bhagoban Chandra Barai continues to thrive for generations to come.',
    4,
    FALSE
WHERE NOT EXISTS (SELECT 1 FROM history_records WHERE display_order = 4);
