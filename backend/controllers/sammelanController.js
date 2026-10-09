const { pool } = require('../config/db');

/**
 * Controller for সম্মেলন কথা (Sammelan Katha / Annual Gathering Chronicles)
 */

// 1. Get all sammelans
exports.getAllSammelans = async (req, res) => {
    try {
        const { search, sort } = req.query;
        let whereClauses = [];
        let params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            whereClauses.push(`(
                s.title ILIKE $${params.length} OR 
                s.venue_name ILIKE $${params.length} OR 
                s.venue_address ILIKE $${params.length} OR 
                s.president_name ILIKE $${params.length} OR 
                s.secretary_name ILIKE $${params.length} OR 
                s.bengali_date ILIKE $${params.length} OR 
                s.edition::text ILIKE $${params.length}
            )`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const orderSql = sort === 'asc' ? 'ORDER BY s.edition ASC' : 'ORDER BY s.edition DESC';

        const query = `
            SELECT 
                s.*,
                h.name as home_name,
                h.map_link as home_map_link,
                v.name as village_name,
                u.name as upazila_name,
                d.name as district_name,
                div.name as division_name
            FROM sammelans s
            LEFT JOIN homes h ON s.home_id = h.id
            LEFT JOIN villages v ON h.village_id = v.id
            LEFT JOIN upazilas u ON v.upazila_id = u.id
            LEFT JOIN districts d ON u.district_id = d.id
            LEFT JOIN divisions div ON d.division_id = div.id
            ${whereSql}
            ${orderSql}
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sammelans:', err);
        res.status(500).json({ error: 'সম্মেলন তালিকা লোড করতে সমস্যা হয়েছে' });
    }
};

// 2. Get the Next / Upcoming Sammelan (for homepage spotlight)
exports.getNextSammelan = async (req, res) => {
    try {
        // First look for explicitly marked is_next = true
        let query = `
            SELECT 
                s.*,
                h.name as home_name,
                h.map_link as home_map_link,
                v.name as village_name,
                u.name as upazila_name,
                d.name as district_name,
                div.name as division_name
            FROM sammelans s
            LEFT JOIN homes h ON s.home_id = h.id
            LEFT JOIN villages v ON h.village_id = v.id
            LEFT JOIN upazilas u ON v.upazila_id = u.id
            LEFT JOIN districts d ON u.district_id = d.id
            LEFT JOIN divisions div ON d.division_id = div.id
            WHERE s.is_next = true
            ORDER BY s.edition DESC
            LIMIT 1
        `;

        let result = await pool.query(query);

        // If none marked is_next = true, fallback to highest edition
        if (result.rows.length === 0) {
            query = `
                SELECT 
                    s.*,
                    h.name as home_name,
                    h.map_link as home_map_link,
                    v.name as village_name,
                    u.name as upazila_name,
                    d.name as district_name,
                    div.name as division_name
                FROM sammelans s
                LEFT JOIN homes h ON s.home_id = h.id
                LEFT JOIN villages v ON h.village_id = v.id
                LEFT JOIN upazilas u ON v.upazila_id = u.id
                LEFT JOIN districts d ON u.district_id = d.id
                LEFT JOIN divisions div ON d.division_id = div.id
                ORDER BY s.edition DESC
                LIMIT 1
            `;
            result = await pool.query(query);
        }

        res.json(result.rows[0] || null);
    } catch (err) {
        console.error('Error fetching next sammelan:', err);
        res.status(500).json({ error: 'আসন্ন সম্মেলন তথ্য লোড করতে সমস্যা হয়েছে' });
    }
};

// 3. Search & Lookup listed Baris (homes) with full auto-populated address
exports.getHomesLookup = async (req, res) => {
    try {
        const { q } = req.query;
        let whereSql = '';
        let params = [];

        if (q && q.trim()) {
            params.push(`%${q.trim()}%`);
            whereSql = `WHERE (
                h.name ILIKE $1 OR 
                v.name ILIKE $1 OR 
                u.name ILIKE $1 OR 
                d.name ILIKE $1
            )`;
        }

        const query = `
            SELECT 
                h.id,
                h.name as home_name,
                h.map_link,
                v.name as village_name,
                u.name as upazila_name,
                d.name as district_name,
                div.name as division_name,
                TRIM(BOTH ', ' FROM CONCAT_WS(', ', h.name, v.name, u.name, d.name)) as full_address
            FROM homes h
            LEFT JOIN villages v ON h.village_id = v.id
            LEFT JOIN upazilas u ON v.upazila_id = u.id
            LEFT JOIN districts d ON u.district_id = d.id
            LEFT JOIN divisions div ON d.division_id = div.id
            ${whereSql}
            ORDER BY 
                CASE WHEN h.name ILIKE '%বাড়ৈ%' OR h.name ILIKE '%মন্ডল%' THEN 0 ELSE 1 END,
                h.name ASC
            LIMIT 60
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error looking up homes for sammelan:', err);
        res.status(500).json({ error: 'বাড়ি অনুসন্ধানে সমস্যা হয়েছে' });
    }
};

// 4. Get single sammelan by ID
exports.getSammelanById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                s.*,
                h.name as home_name,
                h.map_link as home_map_link,
                v.name as village_name,
                u.name as upazila_name,
                d.name as district_name,
                div.name as division_name
            FROM sammelans s
            LEFT JOIN homes h ON s.home_id = h.id
            LEFT JOIN villages v ON h.village_id = v.id
            LEFT JOIN upazilas u ON v.upazila_id = u.id
            LEFT JOIN districts d ON u.district_id = d.id
            LEFT JOIN divisions div ON d.division_id = div.id
            WHERE s.id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'সম্মেলনের তথ্য পাওয়া যায়নি' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching sammelan by id:', err);
        res.status(500).json({ error: 'সার্ভার ত্রুটি' });
    }
};

// 5. Create new sammelan (Admin only)
exports.createSammelan = async (req, res) => {
    const {
        edition,
        title,
        bengali_date,
        date,
        time,
        home_id,
        venue_name,
        venue_address,
        map_link,
        president_name,
        secretary_name,
        description,
        special_notes,
        cover_image_url,
        images,
        is_next
    } = req.body;

    if (!edition || isNaN(edition)) {
        return res.status(400).json({ error: 'সম্মেলন সংখ্যা/সংস্করণ (যেমন: ৪৫ বা ৪৬) আবশ্যক' });
    }

    if (!venue_name || !venue_name.trim()) {
        return res.status(400).json({ error: 'সম্মেলনের স্থান বা বাড়ির নাম আবশ্যক' });
    }

    try {
        // If this one is marked as next, unset is_next on all other sammelans
        if (Boolean(is_next)) {
            await pool.query('UPDATE sammelans SET is_next = false');
        }

        const autoTitle = title && title.trim() 
            ? title.trim() 
            : `${edition}তম বার্ষিক জ্ঞাতি সম্মেলন`;

        const query = `
            INSERT INTO sammelans (
                edition, title, bengali_date, date, time, home_id,
                venue_name, venue_address, map_link, president_name, secretary_name,
                description, special_notes, cover_image_url, images, is_next
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const result = await pool.query(query, [
            parseInt(edition, 10),
            autoTitle,
            bengali_date?.trim() || null,
            date || null,
            time?.trim() || null,
            home_id ? parseInt(home_id, 10) : null,
            venue_name.trim(),
            venue_address?.trim() || null,
            map_link?.trim() || null,
            president_name?.trim() || null,
            secretary_name?.trim() || null,
            description?.trim() || null,
            special_notes?.trim() || null,
            cover_image_url?.trim() || null,
            JSON.stringify(images || []),
            Boolean(is_next)
        ]);

        res.status(201).json({
            message: 'সম্মেলনের তথ্য সফলভাবে সংরক্ষিত হয়েছে',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating sammelan:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: `ইতোমধ্যে ${edition}তম সম্মেলনের তথ্য বিদ্যমান রয়েছে। অনুগ্রহ করে সম্পাদনা করুন।` });
        }
        res.status(500).json({ error: 'সম্মেলনের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে' });
    }
};

// 6. Update sammelan (Admin only)
exports.updateSammelan = async (req, res) => {
    const { id } = req.params;
    const {
        edition,
        title,
        bengali_date,
        date,
        time,
        home_id,
        venue_name,
        venue_address,
        map_link,
        president_name,
        secretary_name,
        description,
        special_notes,
        cover_image_url,
        images,
        is_next
    } = req.body;

    if (!edition || isNaN(edition)) {
        return res.status(400).json({ error: 'সম্মেলন সংখ্যা আবশ্যক' });
    }

    if (!venue_name || !venue_name.trim()) {
        return res.status(400).json({ error: 'স্থান বা বাড়ির নাম আবশ্যক' });
    }

    try {
        // If this one is marked as next, unset others
        if (Boolean(is_next)) {
            await pool.query('UPDATE sammelans SET is_next = false WHERE id != $1', [id]);
        }

        const autoTitle = title && title.trim() 
            ? title.trim() 
            : `${edition}তম বার্ষিক জ্ঞাতি সম্মেলন`;

        const query = `
            UPDATE sammelans SET
                edition = $1,
                title = $2,
                bengali_date = $3,
                date = $4,
                time = $5,
                home_id = $6,
                venue_name = $7,
                venue_address = $8,
                map_link = $9,
                president_name = $10,
                secretary_name = $11,
                description = $12,
                special_notes = $13,
                cover_image_url = $14,
                images = $15,
                is_next = $16,
                updated_at = NOW()
            WHERE id = $17
            RETURNING *
        `;

        const result = await pool.query(query, [
            parseInt(edition, 10),
            autoTitle,
            bengali_date?.trim() || null,
            date || null,
            time?.trim() || null,
            home_id ? parseInt(home_id, 10) : null,
            venue_name.trim(),
            venue_address?.trim() || null,
            map_link?.trim() || null,
            president_name?.trim() || null,
            secretary_name?.trim() || null,
            description?.trim() || null,
            special_notes?.trim() || null,
            cover_image_url?.trim() || null,
            JSON.stringify(images || []),
            Boolean(is_next),
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'সম্মেলন পাওয়া যায়নি' });
        }

        res.json({
            message: 'সম্মেলন তথ্য আপডেট করা হয়েছে',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating sammelan:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: `ইতোমধ্যে ${edition}তম সম্মেলনের তথ্য বিদ্যমান রয়েছে।` });
        }
        res.status(500).json({ error: 'সম্মেলন তথ্য আপডেট করতে সমস্যা হয়েছে' });
    }
};

// 7. Delete sammelan (Admin only)
exports.deleteSammelan = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM sammelans WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'সম্মেলন পাওয়া যায়নি' });
        }
        res.json({ message: 'সম্মেলন সফলভাবে মুছে ফেলা হয়েছে' });
    } catch (err) {
        console.error('Error deleting sammelan:', err);
        res.status(500).json({ error: 'সম্মেলন মুছতে সমস্যা হয়েছে' });
    }
};

// 8. Toggle / Set specific sammelan as Next Sammelan (Admin only)
exports.setNextSammelan = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE sammelans SET is_next = false');
        const result = await pool.query('UPDATE sammelans SET is_next = true, updated_at = NOW() WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'সম্মেলন পাওয়া যায়নি' });
        }
        res.json({
            message: `${result.rows[0].edition}তম সম্মেলনকে আসন্ন সম্মেলন হিসেবে নির্ধারণ করা হয়েছে`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error setting next sammelan:', err);
        res.status(500).json({ error: 'আসন্ন সম্মেলন নির্ধারণ করতে ব্যর্থ হয়েছে' });
    }
};
