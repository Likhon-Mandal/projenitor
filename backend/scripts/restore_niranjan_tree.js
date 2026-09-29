/**
 * Full restoration of Niranjan Mandal Bari Subtree
 * Reconnects from Mahesh Mandal down to Likhon Mandal and all brothers/cousins
 */
require('dotenv').config();
const { pool } = require('../config/db');

const LOCATION = {
    home_id: 513,
    village_id: 129,
    upazila_id: 33,
    district_id: 9,
    division_id: 1,
    country_id: 1
};

// Generational nodes to restore (ordered top-down by generation)
const membersToRestore = [
    // Gen 2 Spouses of Tilok
    {
        id: 'e4994241-2db2-41c3-bd2c-ab74ced6cdf0',
        full_name: 'yyy',
        name_bangla: 'yyy',
        gender: 'Female',
        level: 2,
        father_id: null,
        mother_id: null,
        spouse_id: '5f416032-4791-4c4a-b918-5c779e49e659',
        is_alive: false
    },

    // Gen 3: Children of Tilok & Mahesh's siblings
    {
        id: '18bd716d-8abb-4525-8625-a8a5634ae53e',
        full_name: 'উত্তম মন্ডল',
        name_bangla: 'উত্তম মন্ডল',
        gender: 'Male',
        level: 3,
        father_id: '5f416032-4791-4c4a-b918-5c779e49e659',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: 'a1b2c3d4-0001-4000-8000-000000000001',
        full_name: 'সমীর মন্ডল',
        name_bangla: 'সমীর মন্ডল',
        gender: 'Male',
        level: 3,
        father_id: '5f416032-4791-4c4a-b918-5c779e49e659',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: '387f4ab1-2238-40ae-ac26-f38d9a51864c',
        full_name: 'মৃত সরোজনী মন্ডল',
        name_bangla: 'মৃত সরোজনী মন্ডল',
        gender: 'Female',
        level: 3,
        father_id: '5f416032-4791-4c4a-b918-5c779e49e659',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },

    // Gen 4: Children of Mahesh Mandal (29f491ae-cc03-4528-846e-62bd5fe308ac)
    {
        id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        full_name: 'মৃত প্রসন্ন মন্ডল',
        name_bangla: 'মৃত প্রসন্ন মন্ডল',
        gender: 'Male',
        level: 4,
        father_id: '29f491ae-cc03-4528-846e-62bd5fe308ac',
        mother_id: null,
        spouse_id: 'a227ba87-6f28-451b-90e3-c1eeab49c6c8',
        is_alive: false
    },
    {
        id: 'a227ba87-6f28-451b-90e3-c1eeab49c6c8',
        full_name: 'xxx',
        name_bangla: 'xxx',
        gender: 'Female',
        level: 4,
        father_id: null,
        mother_id: null,
        spouse_id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        is_alive: false
    },

    // Gen 5: Children of Prasanna Mandal
    {
        id: 'ec0a1c57-8272-4dd7-9ade-224a05968433',
        full_name: 'মৃত বলরাম মন্ডল',
        name_bangla: 'মৃত বলরাম মন্ডল',
        gender: 'Male',
        level: 5,
        father_id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: '78df7f42-b53a-449a-aa50-f57ca6f3011d',
        full_name: 'মৃত কানাইলাল মন্ডল',
        name_bangla: 'মৃত কানাইলাল মন্ডল',
        gender: 'Male',
        level: 5,
        father_id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: 'c5ccf5bc-fb82-458d-b15a-e5db62b81a00',
        full_name: 'মৃত রশিক মন্ডল',
        name_bangla: 'মৃত রশিক মন্ডল',
        gender: 'Male',
        level: 5,
        father_id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: 'e8ecfbe3-1b11-4e45-9a4e-af0fd60a1246',
        full_name: 'মৃত মোহন মন্ডল',
        name_bangla: 'মৃত মোহন মন্ডল',
        gender: 'Male',
        level: 5,
        father_id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: 'bee378d0-4a2d-445e-b40c-b3f76a2f443b',
        full_name: 'মৃত তারক মন্ডল',
        name_bangla: 'মৃত তারক মন্ডল',
        gender: 'Male',
        level: 5,
        father_id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: '99e75652-e7e8-4e7e-86b6-aa00926af384',
        full_name: 'মৃত ফুলমালা মন্ডল',
        name_bangla: 'মৃত ফুলমালা মন্ডল',
        gender: 'Female',
        level: 5,
        father_id: 'a0219d7c-459b-4dd9-b50c-f21a8af35694',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },

    // Gen 6: Children of Balaram Mandal (ec0a1c57-8272-4dd7-9ade-224a05968433)
    {
        id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        full_name: 'মৃত ভজন মন্ডল',
        name_bangla: 'মৃত ভজন মন্ডল',
        gender: 'Male',
        level: 6,
        father_id: 'ec0a1c57-8272-4dd7-9ade-224a05968433',
        mother_id: null,
        spouse_id: 'a1b2c3d4-0002-4000-8000-000000000002',
        is_alive: false
    },
    {
        id: 'a1b2c3d4-0002-4000-8000-000000000002',
        full_name: 'jani nah',
        name_bangla: 'jani nah',
        gender: 'Female',
        level: 6,
        father_id: null,
        mother_id: null,
        spouse_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        is_alive: false
    },
    {
        id: '55f2a9e3-2e9d-42fd-892a-dc725d801294',
        full_name: 'মৃত ব্রজেশ্বর মন্ডল',
        name_bangla: 'মৃত ব্রজেশ্বর মন্ডল',
        gender: 'Male',
        level: 6,
        father_id: 'ec0a1c57-8272-4dd7-9ade-224a05968433',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: '761127a5-d414-43b3-8b79-7949597cc4f9',
        full_name: 'বিনয় মন্ডল',
        name_bangla: 'বিনয় মন্ডল',
        gender: 'Male',
        level: 6,
        father_id: 'ec0a1c57-8272-4dd7-9ade-224a05968433',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    // Other Gen 6 cousins (from Kanailal / cousins)
    {
        id: '36f21962-cc83-4787-9003-e8378b9f2aad',
        full_name: 'মৃত সদানন্দ মন্ডল',
        name_bangla: 'মৃত সদানন্দ মন্ডল',
        gender: 'Male',
        level: 6,
        father_id: '78df7f42-b53a-449a-aa50-f57ca6f3011d',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: 'd88229d5-f0ad-4838-980d-60c9a56deb8b',
        full_name: 'মৃত রাধানাথ মন্ডল',
        name_bangla: 'মৃত রাধানাথ মন্ডল',
        gender: 'Male',
        level: 6,
        father_id: '78df7f42-b53a-449a-aa50-f57ca6f3011d',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: '6dbe7d52-7d98-474a-a341-aa18665af449',
        full_name: 'মৃত হরিপদ মন্ডল',
        name_bangla: 'মৃত হরিপদ মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: 'd88229d5-f0ad-4838-980d-60c9a56deb8b',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: 'ac97ad92-c9af-4fb8-a0cd-ce720ff512b1',
        full_name: 'মৃত অনিল মন্ডল',
        name_bangla: 'মৃত অনিল মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: 'd88229d5-f0ad-4838-980d-60c9a56deb8b',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },

    // Gen 7: Children of Bhajan Mandal (7106c650-e70a-4a68-8d15-fe69ca405469)
    {
        id: 'ee346364-6a58-43f9-98a6-70f7ab337d85',
        full_name: 'নিরঞ্জন মন্ডল',
        name_bangla: 'নিরঞ্জন মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: '4e6f8fa0-546e-4894-980b-37e8705ab388',
        full_name: 'স্বপন মন্ডল',
        name_bangla: 'স্বপন মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: '7368473c-eb88-4ab8-83e0-3c12b1556146',
        full_name: 'শংকর মন্ডল',
        name_bangla: 'শংকর মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: '1a6e4acf-c1fc-4c5d-a096-c4c063b78850',
        full_name: 'রমেশ মন্ডল',
        name_bangla: 'রমেশ মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: 'ba7521ae-39e2-41bd-bb41-cc54d15d71ec',
        full_name: 'সঞ্জিত মন্ডল',
        name_bangla: 'সঞ্জিত মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: '52707478-ccae-4cc5-add6-fae6eac1bba5',
        full_name: 'রনজিৎ মন্ডল',
        name_bangla: 'রনজিৎ মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: 'c8daaba9-77e4-4132-8c35-55fb8853bf06',
        full_name: 'মৃত বিবেক মন্ডল',
        name_bangla: 'মৃত বিবেক মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: false
    },
    {
        id: '3d69efc7-d3a5-473b-977e-8aa614ecf3af',
        full_name: 'মুকুন্দ মন্ডল',
        name_bangla: 'মুকুন্দ মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '7106c650-e70a-4a68-8d15-fe69ca405469',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    // Other Gen 7 from Sadananda (36f21962-cc83-4787-9003-e8378b9f2aad)
    {
        id: '4abfb0f1-c4cb-421f-88e6-63acbb1195b3',
        full_name: 'সুষেন মন্ডল',
        name_bangla: 'সুষেন মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '36f21962-cc83-4787-9003-e8378b9f2aad',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: 'eee5f031-7132-4e31-8999-9306867c5a1b',
        full_name: 'সুরেশ মন্ডল',
        name_bangla: 'সুরেশ মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '36f21962-cc83-4787-9003-e8378b9f2aad',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: 'bbe2e069-7eda-48e3-9121-5d024c173434',
        full_name: 'শরৎ মন্ডল',
        name_bangla: 'শরৎ মন্ডল',
        gender: 'Male',
        level: 7,
        father_id: '36f21962-cc83-4787-9003-e8378b9f2aad',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },

    // Gen 8: Children of Niranjan Mandal (ee346364-6a58-43f9-98a6-70f7ab337d85)
    {
        id: 'a9ce3458-a002-45f6-90c7-81a35c709c6a',
        full_name: 'দীপঙ্কর মন্ডল',
        name_bangla: 'দীপঙ্কর মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: 'ee346364-6a58-43f9-98a6-70f7ab337d85',
        mother_id: null,
        spouse_id: 'a0b954c0-5699-43bb-a011-b6d384145bb4',
        is_alive: true
    },
    {
        id: 'a0b954c0-5699-43bb-a011-b6d384145bb4',
        full_name: 'shova das',
        name_bangla: 'শোভা দাস',
        gender: 'Female',
        level: 8,
        father_id: null,
        mother_id: null,
        spouse_id: 'a9ce3458-a002-45f6-90c7-81a35c709c6a',
        is_alive: true
    },
    {
        id: 'e4cde630-c32b-44e9-8fc8-87d96fc47663',
        full_name: 'xxxx',
        name_bangla: 'xxxx',
        gender: 'Female',
        level: 8,
        father_id: null,
        mother_id: null,
        spouse_id: 'a9ce3458-a002-45f6-90c7-81a35c709c6a',
        is_alive: true
    },
    {
        id: '7653a976-6b7c-4516-82f8-8e68ac33f0fd',
        full_name: 'বিল্পব মন্ডল',
        name_bangla: 'বিল্পব মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: 'ee346364-6a58-43f9-98a6-70f7ab337d85',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: 'a1b2c3d4-0003-4000-8000-000000000003',
        full_name: 'রিপন মন্ডল',
        name_bangla: 'রিপন মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: 'ee346364-6a58-43f9-98a6-70f7ab337d85',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },

    // Gen 8: Children of Vivek Mandal (c8daaba9-77e4-4132-8c35-55fb8853bf06)
    {
        id: 'b6e2c44c-eced-44e9-8218-46b772c462dc',
        full_name: 'দেবাশীষ মন্ডল',
        name_bangla: 'দেবাশীষ মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: 'c8daaba9-77e4-4132-8c35-55fb8853bf06',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },
    {
        id: '0944aac1-82f7-4654-a0e1-7522db96393f',
        full_name: 'গৌতম মন্ডল',
        name_bangla: 'গৌতম মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: 'c8daaba9-77e4-4132-8c35-55fb8853bf06',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },

    // Gen 8: Children of Mukunda Mandal (3d69efc7-d3a5-473b-977e-8aa614ecf3af)
    {
        id: '9e498fa0-d3ac-4246-9c0e-ca3cf22ed9dc',
        full_name: 'হিরন্ময় মন্ডল',
        name_bangla: 'হিরন্ময় মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: '3d69efc7-d3a5-473b-977e-8aa614ecf3af',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },

    // Gen 8: Children of Shanker Mandal (7368473c-eb88-4ab8-83e0-3c12b1556146)
    {
        id: 'e5e8df8a-c25c-45db-a3cf-10d7d617818d',
        full_name: 'বুদ্ধদেব মন্ডল',
        name_bangla: 'বুদ্ধদেব মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: '7368473c-eb88-4ab8-83e0-3c12b1556146',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },

    // Gen 8: Children of Ranjit Mandal (52707478-ccae-4cc5-add6-fae6eac1bba5)
    {
        id: 'f6e781d9-a292-4ff5-8e33-ba322480355d',
        full_name: 'শুভ মন্ডল',
        name_bangla: 'শুভ মন্ডল',
        gender: 'Male',
        level: 8,
        father_id: '52707478-ccae-4cc5-add6-fae6eac1bba5',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    },

    // Gen 9: Children of Dipankar Mandal (a9ce3458-a002-45f6-90c7-81a35c709c6a) & Shova Das
    {
        id: '3364b00f-535c-440a-9f1f-fc5639480514',
        full_name: 'লিখন মন্ডল (Likhon Mandal)',
        name_bangla: 'লিখন মন্ডল',
        name_english: 'Likhon Mandal',
        gender: 'Male',
        level: 9,
        father_id: 'a9ce3458-a002-45f6-90c7-81a35c709c6a',
        mother_id: 'a0b954c0-5699-43bb-a011-b6d384145bb4',
        spouse_id: '7da465c9-9d42-442a-909d-dca37e40b7d6',
        is_alive: true
    },
    {
        id: '7da465c9-9d42-442a-909d-dca37e40b7d6',
        full_name: 'rupa',
        name_bangla: 'রূপা',
        gender: 'Female',
        level: 9,
        father_id: null,
        mother_id: null,
        spouse_id: '3364b00f-535c-440a-9f1f-fc5639480514',
        is_alive: true
    },

    // Gen 9: Children of Biplab Mandal (7653a976-6b7c-4516-82f8-8e68ac33f0fd)
    {
        id: '5adf81ae-18d2-4554-89f7-833567554316',
        full_name: 'রায়ান মন্ডল',
        name_bangla: 'রায়ান মন্ডল',
        gender: 'Male',
        level: 9,
        father_id: '7653a976-6b7c-4516-82f8-8e68ac33f0fd',
        mother_id: null,
        spouse_id: null,
        is_alive: true
    }
];

async function restore() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log(`Starting restoration of ${membersToRestore.length} members...`);

        // First pass: insert all members without parent links to avoid FK constraint issues
        for (const m of membersToRestore) {
            const existing = await client.query('SELECT id FROM members WHERE id = $1', [m.id]);
            if (existing.rows.length === 0) {
                console.log(`Inserting member placeholder: ${m.full_name} (${m.id})`);
                await client.query(`
                    INSERT INTO members (
                        id, full_name, name_bangla, name_english, gender, level,
                        home_id, village_id, upazila_id, district_id, division_id, country_id,
                        is_alive, deleted_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6,
                        $7, $8, $9, $10, $11, $12,
                        $13, NULL
                    )
                `, [
                    m.id,
                    m.full_name,
                    m.name_bangla || m.full_name,
                    m.name_english || null,
                    m.gender || 'Male',
                    m.level,
                    LOCATION.home_id,
                    LOCATION.village_id,
                    LOCATION.upazila_id,
                    LOCATION.district_id,
                    LOCATION.division_id,
                    LOCATION.country_id,
                    m.is_alive !== undefined ? m.is_alive : true
                ]);
            }
        }

        // Second pass: update all parent links, spouses, and details
        for (const m of membersToRestore) {
            console.log(`Linking member: ${m.full_name} (${m.id})`);
            await client.query(`
                UPDATE members SET
                    full_name = $1,
                    name_bangla = $2,
                    name_english = $3,
                    gender = $4,
                    level = $5,
                    father_id = $6,
                    mother_id = $7,
                    spouse_id = $8,
                    home_id = $9,
                    village_id = $10,
                    upazila_id = $11,
                    district_id = $12,
                    division_id = $13,
                    country_id = $14,
                    is_alive = $15,
                    deleted_at = NULL
                WHERE id = $16
            `, [
                m.full_name,
                m.name_bangla || m.full_name,
                m.name_english || null,
                m.gender || 'Male',
                m.level,
                m.father_id,
                m.mother_id,
                m.spouse_id,
                LOCATION.home_id,
                LOCATION.village_id,
                LOCATION.upazila_id,
                LOCATION.district_id,
                LOCATION.division_id,
                LOCATION.country_id,
                m.is_alive !== undefined ? m.is_alive : true,
                m.id
            ]);

            // Ensure member_spouses bidirectional link
            if (m.spouse_id) {
                await client.query(`
                    INSERT INTO member_spouses (member_id, spouse_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [m.id, m.spouse_id]);
                await client.query(`
                    INSERT INTO member_spouses (member_id, spouse_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [m.spouse_id, m.id]);
            }
        }

        // Ensure Mahesh Mandal is linked properly to Tilok
        await client.query(`
            UPDATE members 
            SET father_id = '5f416032-4791-4c4a-b918-5c779e49e659',
                mother_id = 'e4994241-2db2-41c3-bd2c-ab74ced6cdf0',
                level = 3,
                deleted_at = NULL
            WHERE id = '29f491ae-cc03-4528-846e-62bd5fe308ac'
        `);

        // Commit transaction
        await client.query('COMMIT');
        console.log("✅ Subtree successfully restored!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Restoration failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

restore();
