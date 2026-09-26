const { pool } = require('../config/db');

exports.getRecycleBin = async (req, res) => {
    try {
        const deletedItems = {
            members: [],
            countries: [],
            divisions: [],
            districts: [],
            upazilas: [],
            villages: [],
            homes: []
        };

        // Fetch members with rich context (Only if no parent location is also deleted)
        const membersQuery = `
            SELECT 
                m.id, 
                COALESCE(NULLIF(m.name_bangla, ''), m.full_name, m.name_english, 'অজ্ঞাত সদস্য') AS name,
                m.full_name,
                m.name_bangla,
                m.gender,
                m.level,
                m.deleted_at,
                h.name AS home_name,
                v.name AS village_name,
                f.full_name AS father_name,
                f.name_bangla AS father_name_bangla
            FROM members m 
            LEFT JOIN homes h ON h.id = m.home_id
            LEFT JOIN villages v ON v.id = m.village_id
            LEFT JOIN members f ON f.id = m.father_id
            WHERE m.deleted_at IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM homes h2 WHERE h2.id = m.home_id AND h2.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM villages v2 WHERE v2.id = m.village_id AND v2.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM upazilas u WHERE u.id = m.upazila_id AND u.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM districts d WHERE d.id = m.district_id AND d.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM divisions div WHERE div.id = m.division_id AND div.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM countries c WHERE c.id = m.country_id AND c.deleted_at IS NOT NULL)
            ORDER BY m.deleted_at DESC
        `;
        const membersRes = await pool.query(membersQuery);
        deletedItems.members = membersRes.rows;

        // Fetch locations dynamically with parent context based on their relationships
        const queryMap = {
            countries: `SELECT id, name, deleted_at FROM countries WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
            divisions: `SELECT d.id, d.name, d.deleted_at, c.name as country_name FROM divisions d LEFT JOIN countries c ON c.id = d.country_id WHERE d.deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM countries c2 WHERE c2.id = d.country_id AND c2.deleted_at IS NOT NULL) ORDER BY d.deleted_at DESC`,
            districts: `SELECT d.id, d.name, d.deleted_at, div.name as division_name FROM districts d LEFT JOIN divisions div ON div.id = d.division_id WHERE d.deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM divisions div2 WHERE div2.id = d.division_id AND div2.deleted_at IS NOT NULL) ORDER BY d.deleted_at DESC`,
            upazilas: `SELECT u.id, u.name, u.deleted_at, d.name as district_name FROM upazilas u LEFT JOIN districts d ON d.id = u.district_id WHERE u.deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM districts d2 WHERE d2.id = u.district_id AND d2.deleted_at IS NOT NULL) ORDER BY u.deleted_at DESC`,
            villages: `SELECT v.id, v.name, v.deleted_at, u.name as upazila_name FROM villages v LEFT JOIN upazilas u ON u.id = v.upazila_id WHERE v.deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM upazilas u2 WHERE u2.id = v.upazila_id AND u2.deleted_at IS NOT NULL) ORDER BY v.deleted_at DESC`,
            homes: `SELECT h.id, h.name, h.deleted_at, v.name as village_name FROM homes h LEFT JOIN villages v ON v.id = h.village_id WHERE h.deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM villages v2 WHERE v2.id = h.village_id AND v2.deleted_at IS NOT NULL) ORDER BY h.deleted_at DESC`
        };

        const fetchDeleted = async (table) => {
            const result = await pool.query(queryMap[table]);
            deletedItems[table] = result.rows;
        };

        await Promise.all([
            fetchDeleted('countries'),
            fetchDeleted('divisions'),
            fetchDeleted('districts'),
            fetchDeleted('upazilas'),
            fetchDeleted('villages'),
            fetchDeleted('homes')
        ]);

        res.json(deletedItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching recycle bin' });
    }
};

exports.restoreItem = async (req, res) => {
    try {
        const { table, id } = req.params;

        // Validate table name to prevent SQL Injection
        const allowedTables = ['members', 'countries', 'divisions', 'districts', 'upazilas', 'villages', 'homes'];
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        if (table === 'members') {
            // 1. Verify member exists in recycle bin and check parent location status
            const check = await pool.query(
                `SELECT m.id, m.home_id, m.village_id,
                        (SELECT deleted_at FROM homes WHERE id = m.home_id) as home_deleted,
                        (SELECT deleted_at FROM villages WHERE id = m.village_id) as village_deleted
                 FROM members m WHERE m.id = $1 AND m.deleted_at IS NOT NULL`,
                [id]
            );

            if (check.rows.length === 0) {
                return res.status(404).json({ error: 'Member not found in recycle bin' });
            }

            const { home_deleted, village_deleted } = check.rows[0];
            if (home_deleted || village_deleted) {
                return res.status(400).json({ 
                    error: 'Cannot restore this member because their home or village is currently in the recycle bin. Please restore the village/home first.' 
                });
            }

            // 2. Cascade restore member and all their subtree descendants & spouses
            const recursiveRestoreQuery = `
                WITH RECURSIVE lineage AS (
                    -- 1. Target node
                    SELECT id FROM members WHERE id = $1
                    UNION
                    -- 2. Traverse all biological children, grandchildren, and children connected via spouses
                    SELECT lat.id
                    FROM lineage l
                    CROSS JOIN LATERAL (
                        SELECT m.id FROM members m WHERE m.father_id = l.id OR m.mother_id = l.id
                        UNION
                        SELECT m.id FROM members m 
                        WHERE m.father_id IN (
                            SELECT ms.spouse_id FROM member_spouses ms WHERE ms.member_id = l.id
                            UNION
                            SELECT ms.member_id FROM member_spouses ms WHERE ms.spouse_id = l.id
                            UNION
                            SELECT s.spouse_id FROM members s WHERE s.id = l.id AND s.spouse_id IS NOT NULL
                            UNION
                            SELECT s.id FROM members s WHERE s.spouse_id = l.id
                        ) OR m.mother_id IN (
                            SELECT ms.spouse_id FROM member_spouses ms WHERE ms.member_id = l.id
                            UNION
                            SELECT ms.member_id FROM member_spouses ms WHERE ms.spouse_id = l.id
                            UNION
                            SELECT s.spouse_id FROM members s WHERE s.id = l.id AND s.spouse_id IS NOT NULL
                            UNION
                            SELECT s.id FROM members s WHERE s.spouse_id = l.id
                        )
                    ) lat
                ),
                all_spouses AS (
                    -- 3. All spouses of anyone in lineage
                    SELECT ms.spouse_id AS id 
                    FROM member_spouses ms 
                    JOIN members s ON s.id = ms.spouse_id
                    WHERE ms.member_id IN (SELECT id FROM lineage)

                    UNION

                    SELECT ms.member_id AS id 
                    FROM member_spouses ms 
                    JOIN members s ON s.id = ms.member_id
                    WHERE ms.spouse_id IN (SELECT id FROM lineage)

                    UNION

                    SELECT m.spouse_id AS id 
                    FROM members m 
                    JOIN members s ON s.id = m.spouse_id
                    WHERE m.id IN (SELECT id FROM lineage) AND m.spouse_id IS NOT NULL

                    UNION

                    SELECT m.id AS id 
                    FROM members m 
                    JOIN members s ON s.id = m.id
                    WHERE m.spouse_id IN (SELECT id FROM lineage)
                ),
                full_subtree AS (
                    SELECT id FROM lineage
                    UNION
                    SELECT id FROM all_spouses WHERE id IS NOT NULL
                )
                UPDATE members
                SET deleted_at = NULL
                WHERE id IN (SELECT id FROM full_subtree)
                  AND deleted_at IS NOT NULL
                RETURNING id, full_name, name_bangla;
            `;

            const result = await pool.query(recursiveRestoreQuery, [id]);

            return res.json({
                message: result.rows.length > 1
                    ? `সদস্য এবং পরিবারের আরও ${result.rows.length - 1} জন সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Member and ${result.rows.length - 1} related members restored)`
                    : 'সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Member restored successfully)',
                restored_count: result.rows.length,
                restored_members: result.rows,
                restored_item: result.rows[0]
            });
        }

        // For location tables: check if parent location is deleted first
        if (table === 'homes') {
            const check = await pool.query(
                `SELECT h.id, v.deleted_at as village_deleted
                 FROM homes h
                 LEFT JOIN villages v ON v.id = h.village_id
                 WHERE h.id = $1 AND h.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'Home not found in recycle bin' });
            if (check.rows[0].village_deleted) {
                return res.status(400).json({ error: 'Cannot restore home because its village is currently in the recycle bin. Please restore the village first.' });
            }
        } else if (table === 'villages') {
            const check = await pool.query(
                `SELECT v.id, u.deleted_at as upazila_deleted
                 FROM villages v
                 LEFT JOIN upazilas u ON u.id = v.upazila_id
                 WHERE v.id = $1 AND v.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'Village not found in recycle bin' });
            if (check.rows[0].upazila_deleted) {
                return res.status(400).json({ error: 'Cannot restore village because its upazila is currently in the recycle bin. Please restore the upazila first.' });
            }
        } else if (table === 'upazilas') {
            const check = await pool.query(
                `SELECT u.id, d.deleted_at as district_deleted
                 FROM upazilas u
                 LEFT JOIN districts d ON d.id = u.district_id
                 WHERE u.id = $1 AND u.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'Upazila not found in recycle bin' });
            if (check.rows[0].district_deleted) {
                return res.status(400).json({ error: 'Cannot restore upazila because its district is currently in the recycle bin. Please restore the district first.' });
            }
        } else if (table === 'districts') {
            const check = await pool.query(
                `SELECT d.id, div.deleted_at as division_deleted
                 FROM districts d
                 LEFT JOIN divisions div ON div.id = d.division_id
                 WHERE d.id = $1 AND d.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'District not found in recycle bin' });
            if (check.rows[0].division_deleted) {
                return res.status(400).json({ error: 'Cannot restore district because its division is currently in the recycle bin. Please restore the division first.' });
            }
        } else if (table === 'divisions') {
            const check = await pool.query(
                `SELECT div.id, c.deleted_at as country_deleted
                 FROM divisions div
                 LEFT JOIN countries c ON c.id = div.country_id
                 WHERE div.id = $1 AND div.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'Division not found in recycle bin' });
            if (check.rows[0].country_deleted) {
                return res.status(400).json({ error: 'Cannot restore division because its country is currently in the recycle bin. Please restore the country first.' });
            }
        }

        // Restore location item. PostgreSQL cascade_soft_delete trigger automatically restores all children!
        const query = `UPDATE ${table} SET deleted_at = NULL WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in recycle bin' });
        }

        res.json({ message: 'Item restored successfully', restored_item: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error restoring item' });
    }
};

exports.getPublicStats = async (req, res) => {
    try {
        const [members, homes, villages] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM members WHERE deleted_at IS NULL"),
            pool.query("SELECT COUNT(*) FROM homes WHERE deleted_at IS NULL"),
            pool.query("SELECT COUNT(*) FROM villages WHERE deleted_at IS NULL"),
        ]);

        res.json({
            totalMembers: parseInt(members.rows[0].count),
            totalHomes: parseInt(homes.rows[0].count),
            totalVillages: parseInt(villages.rows[0].count),
        });
    } catch (err) {
        console.error('Public stats error:', err);
        res.status(500).json({ error: 'Server error fetching public stats' });
    }
};
