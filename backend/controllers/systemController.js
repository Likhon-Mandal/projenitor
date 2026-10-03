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

        // 1. Fetch Root Deleted Members:
        // A member is only shown if:
        // - They are soft-deleted (deleted_at IS NOT NULL)
        // - NONE of their geographic locations are deleted
        // - NEITHER their father nor mother is deleted (so child nodes of deleted parents are NOT displayed)
        // - If married to a spouse who is ALSO deleted: only show the primary lineage member (the one connected to ancestors or male partner)
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
                u.name AS upazila_name,
                d.name AS district_name,
                div.name AS division_name,
                c.name AS country_name,
                f.full_name AS father_name,
                f.name_bangla AS father_name_bangla
            FROM members m 
            LEFT JOIN homes h ON h.id = m.home_id
            LEFT JOIN villages v ON v.id = m.village_id
            LEFT JOIN upazilas u ON u.id = m.upazila_id
            LEFT JOIN districts d ON d.id = m.district_id
            LEFT JOIN divisions div ON div.id = m.division_id
            LEFT JOIN countries c ON c.id = m.country_id
            LEFT JOIN members f ON f.id = m.father_id
            WHERE m.deleted_at IS NOT NULL 
            -- No parent location is deleted
            AND NOT EXISTS (SELECT 1 FROM homes h2 WHERE h2.id = m.home_id AND h2.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM villages v2 WHERE v2.id = m.village_id AND v2.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM upazilas u2 WHERE u2.id = m.upazila_id AND u2.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM districts d2 WHERE d2.id = m.district_id AND d2.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM divisions div2 WHERE div2.id = m.division_id AND div2.deleted_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM countries c2 WHERE c2.id = m.country_id AND c2.deleted_at IS NOT NULL)
            -- Father is NOT deleted (if father is deleted, the father is the root node to restore)
            AND NOT EXISTS (SELECT 1 FROM members p WHERE p.id = m.father_id AND p.deleted_at IS NOT NULL)
            -- Mother is NOT deleted
            AND NOT EXISTS (SELECT 1 FROM members mot WHERE mot.id = m.mother_id AND mot.deleted_at IS NOT NULL)
            -- If married to a spouse who is ALSO deleted: only show one entry (the lineage holder or male)
            AND NOT (
                EXISTS (
                    SELECT 1 FROM members sp 
                    WHERE (sp.id = m.spouse_id OR sp.spouse_id = m.id OR EXISTS (
                        SELECT 1 FROM member_spouses ms 
                        WHERE (ms.member_id = m.id AND ms.spouse_id = sp.id) 
                           OR (ms.spouse_id = m.id AND ms.member_id = sp.id)
                    ))
                    AND sp.deleted_at IS NOT NULL
                    AND (
                        -- Partner has parents in tree while this member does not
                        ((sp.father_id IS NOT NULL OR sp.mother_id IS NOT NULL) AND m.father_id IS NULL AND m.mother_id IS NULL)
                        -- Or neither has parents (or both do), and partner is Male while this member is Female/NULL
                        OR (
                            ((sp.father_id IS NOT NULL OR sp.mother_id IS NOT NULL) = (m.father_id IS NOT NULL OR m.mother_id IS NOT NULL))
                            AND (sp.gender = 'Male' AND (m.gender = 'Female' OR m.gender IS NULL))
                        )
                        -- Or same gender, tie-break by ID
                        OR (
                            ((sp.father_id IS NOT NULL OR sp.mother_id IS NOT NULL) = (m.father_id IS NOT NULL OR m.mother_id IS NOT NULL))
                            AND sp.gender = m.gender
                            AND sp.id < m.id
                        )
                    )
                )
            )
            ORDER BY m.deleted_at DESC
        `;
        const membersRes = await pool.query(membersQuery);

        // Compute total subtree count for each root member (descendants + spouses to be restored)
        const membersWithSubtreeCount = await Promise.all(membersRes.rows.map(async (m) => {
            const countRes = await pool.query(`
                WITH RECURSIVE lineage AS (
                    SELECT id FROM members WHERE id = $1
                    UNION
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
                        ) OR m.mother_id IN (
                            SELECT ms.spouse_id FROM member_spouses ms WHERE ms.member_id = l.id
                            UNION
                            SELECT ms.member_id FROM member_spouses ms WHERE ms.spouse_id = l.id
                        )
                    ) lat
                ),
                all_spouses AS (
                    SELECT ms.spouse_id AS id FROM member_spouses ms WHERE ms.member_id IN (SELECT id FROM lineage)
                    UNION
                    SELECT ms.member_id AS id FROM member_spouses ms WHERE ms.spouse_id IN (SELECT id FROM lineage)
                    UNION
                    SELECT m.spouse_id AS id FROM members m WHERE m.id IN (SELECT id FROM lineage) AND m.spouse_id IS NOT NULL
                    UNION
                    SELECT m.id AS id FROM members m WHERE m.spouse_id IN (SELECT id FROM lineage)
                ),
                full_subtree AS (
                    SELECT id FROM lineage UNION SELECT id FROM all_spouses WHERE id IS NOT NULL
                )
                SELECT COUNT(*)::int as count FROM full_subtree fs 
                JOIN members m ON m.id = fs.id 
                WHERE m.deleted_at IS NOT NULL
            `, [m.id]);
            return {
                ...m,
                subtree_count: countRes.rows[0]?.count || 1
            };
        }));
        deletedItems.members = membersWithSubtreeCount;

        // 2. Fetch Locations Dynamically:
        // A location is only shown if NONE of its ancestor locations are deleted.
        const queryMap = {
            countries: `
                SELECT id, name, deleted_at 
                FROM countries 
                WHERE deleted_at IS NOT NULL 
                ORDER BY deleted_at DESC
            `,
            divisions: `
                SELECT d.id, d.name, d.deleted_at, c.name as country_name 
                FROM divisions d 
                LEFT JOIN countries c ON c.id = d.country_id 
                WHERE d.deleted_at IS NOT NULL 
                  AND NOT EXISTS (SELECT 1 FROM countries c2 WHERE c2.id = d.country_id AND c2.deleted_at IS NOT NULL) 
                ORDER BY d.deleted_at DESC
            `,
            districts: `
                SELECT d.id, d.name, d.deleted_at, div.name as division_name 
                FROM districts d 
                LEFT JOIN divisions div ON div.id = d.division_id 
                WHERE d.deleted_at IS NOT NULL 
                  AND NOT EXISTS (
                      SELECT 1 FROM divisions div2 
                      LEFT JOIN countries c2 ON c2.id = div2.country_id 
                      WHERE div2.id = d.division_id 
                        AND (div2.deleted_at IS NOT NULL OR c2.deleted_at IS NOT NULL)
                  ) 
                ORDER BY d.deleted_at DESC
            `,
            upazilas: `
                SELECT u.id, u.name, u.deleted_at, d.name as district_name 
                FROM upazilas u 
                LEFT JOIN districts d ON d.id = u.district_id 
                WHERE u.deleted_at IS NOT NULL 
                  AND NOT EXISTS (
                      SELECT 1 FROM districts d2 
                      LEFT JOIN divisions div2 ON div2.id = d2.division_id 
                      LEFT JOIN countries c2 ON c2.id = div2.country_id 
                      WHERE d2.id = u.district_id 
                        AND (d2.deleted_at IS NOT NULL OR div2.deleted_at IS NOT NULL OR c2.deleted_at IS NOT NULL)
                  ) 
                ORDER BY u.deleted_at DESC
            `,
            villages: `
                SELECT v.id, v.name, v.deleted_at, u.name as upazila_name 
                FROM villages v 
                LEFT JOIN upazilas u ON u.id = v.upazila_id 
                WHERE v.deleted_at IS NOT NULL 
                  AND NOT EXISTS (
                      SELECT 1 FROM upazilas u2 
                      LEFT JOIN districts d2 ON d2.id = u2.district_id 
                      LEFT JOIN divisions div2 ON div2.id = d2.division_id 
                      LEFT JOIN countries c2 ON c2.id = div2.country_id 
                      WHERE u2.id = v.upazila_id 
                        AND (u2.deleted_at IS NOT NULL OR d2.deleted_at IS NOT NULL OR div2.deleted_at IS NOT NULL OR c2.deleted_at IS NOT NULL)
                  ) 
                ORDER BY v.deleted_at DESC
            `,
            homes: `
                SELECT h.id, h.name, h.deleted_at, v.name as village_name 
                FROM homes h 
                LEFT JOIN villages v ON v.id = h.village_id 
                WHERE h.deleted_at IS NOT NULL 
                  AND NOT EXISTS (
                      SELECT 1 FROM villages v2 
                      LEFT JOIN upazilas u2 ON u2.id = v2.upazila_id 
                      LEFT JOIN districts d2 ON d2.id = u2.district_id 
                      LEFT JOIN divisions div2 ON div2.id = d2.division_id 
                      LEFT JOIN countries c2 ON c2.id = div2.country_id 
                      WHERE v2.id = h.village_id 
                        AND (v2.deleted_at IS NOT NULL OR u2.deleted_at IS NOT NULL OR d2.deleted_at IS NOT NULL OR div2.deleted_at IS NOT NULL OR c2.deleted_at IS NOT NULL)
                  ) 
                ORDER BY h.deleted_at DESC
            `
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
        console.error('Error fetching recycle bin:', err);
        res.status(500).json({ error: 'Server error fetching recycle bin' });
    }
};

exports.restoreItem = async (req, res) => {
    try {
        const { table, id } = req.params;

        const allowedTables = ['members', 'countries', 'divisions', 'districts', 'upazilas', 'villages', 'homes'];
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        // ==========================================
        // 1. RESTORE MEMBER & COMPLETE SUBTREE
        // ==========================================
        if (table === 'members') {
            const check = await pool.query(
                `SELECT m.id, m.home_id, m.village_id, m.upazila_id, m.district_id, m.division_id, m.country_id,
                        m.father_id, m.mother_id,
                        (SELECT deleted_at FROM homes WHERE id = m.home_id) as home_deleted,
                        (SELECT deleted_at FROM villages WHERE id = m.village_id) as village_deleted,
                        (SELECT deleted_at FROM upazilas WHERE id = m.upazila_id) as upazila_deleted,
                        (SELECT deleted_at FROM districts WHERE id = m.district_id) as district_deleted,
                        (SELECT deleted_at FROM divisions WHERE id = m.division_id) as division_deleted,
                        (SELECT deleted_at FROM countries WHERE id = m.country_id) as country_deleted,
                        (SELECT deleted_at FROM members WHERE id = m.father_id) as father_deleted,
                        (SELECT deleted_at FROM members WHERE id = m.mother_id) as mother_deleted
                 FROM members m WHERE m.id = $1 AND m.deleted_at IS NOT NULL`,
                [id]
            );

            if (check.rows.length === 0) {
                return res.status(404).json({ error: 'Member not found in recycle bin' });
            }

            const { 
                home_deleted, village_deleted, upazila_deleted, district_deleted, 
                division_deleted, country_deleted, father_deleted, mother_deleted 
            } = check.rows[0];

            if (home_deleted || village_deleted || upazila_deleted || district_deleted || division_deleted || country_deleted) {
                return res.status(400).json({ 
                    error: 'Cannot restore this member because their home or village/district is currently in the recycle bin. Please restore the parent location first.' 
                });
            }

            if (father_deleted || mother_deleted) {
                return res.status(400).json({ 
                    error: 'Cannot restore this child member directly because their parent node is currently in the recycle bin. Please restore the parent node to restore the family together.' 
                });
            }

            const recursiveRestoreQuery = `
                WITH RECURSIVE lineage AS (
                    SELECT id FROM members WHERE id = $1
                    UNION
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
                    ? `সদস্য এবং পরিবারের আরও ${result.rows.length - 1} জন সদস্য (মোট ${result.rows.length} জন) সফলভাবে পুনরুদ্ধার করা হয়েছে (Member and all subtree descendants/spouses restored)`
                    : 'সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Member restored successfully)',
                restored_count: result.rows.length,
                restored_members: result.rows,
                restored_item: result.rows[0]
            });
        }

        // ==========================================
        // 2. RESTORE BARI (HOME) & ALL MEMBERS
        // ==========================================
        if (table === 'homes') {
            const check = await pool.query(
                `SELECT h.id, 
                        v.deleted_at as village_deleted,
                        u.deleted_at as upazila_deleted,
                        d.deleted_at as district_deleted,
                        div.deleted_at as division_deleted,
                        c.deleted_at as country_deleted
                 FROM homes h
                 LEFT JOIN villages v ON v.id = h.village_id
                 LEFT JOIN upazilas u ON u.id = v.upazila_id
                 LEFT JOIN districts d ON d.id = u.district_id
                 LEFT JOIN divisions div ON div.id = d.division_id
                 LEFT JOIN countries c ON c.id = div.country_id
                 WHERE h.id = $1 AND h.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'Home not found in recycle bin' });
            if (check.rows[0].village_deleted || check.rows[0].upazila_deleted || check.rows[0].district_deleted || check.rows[0].division_deleted || check.rows[0].country_deleted) {
                return res.status(400).json({ error: 'Cannot restore home because its village or parent area is currently in the recycle bin. Please restore the parent area first.' });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const homeRes = await client.query('UPDATE homes SET deleted_at = NULL WHERE id = $1 RETURNING *', [id]);
                const memberRes = await client.query('UPDATE members SET deleted_at = NULL WHERE home_id = $1 AND deleted_at IS NOT NULL RETURNING id', [id]);
                await client.query('COMMIT');
                return res.json({ 
                    message: memberRes.rows.length > 0 
                        ? `বাড়ি এবং পরিবারের ${memberRes.rows.length} জন সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Home and ${memberRes.rows.length} members restored)` 
                        : 'বাড়ি সফলভাবে পুনরুদ্ধার করা হয়েছে (Home restored successfully)',
                    restored_item: homeRes.rows[0],
                    restored_count: 1 + memberRes.rows.length
                });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

        // ==========================================
        // 3. RESTORE GRAM (VILLAGE) & HOMES & MEMBERS
        // ==========================================
        if (table === 'villages') {
            const check = await pool.query(
                `SELECT v.id, 
                        u.deleted_at as upazila_deleted,
                        d.deleted_at as district_deleted,
                        div.deleted_at as division_deleted,
                        c.deleted_at as country_deleted
                 FROM villages v
                 LEFT JOIN upazilas u ON u.id = v.upazila_id
                 LEFT JOIN districts d ON d.id = u.district_id
                 LEFT JOIN divisions div ON div.id = d.division_id
                 LEFT JOIN countries c ON c.id = div.country_id
                 WHERE v.id = $1 AND v.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'Village not found in recycle bin' });
            if (check.rows[0].upazila_deleted || check.rows[0].district_deleted || check.rows[0].division_deleted || check.rows[0].country_deleted) {
                return res.status(400).json({ error: 'Cannot restore village because its upazila/district is currently in the recycle bin. Please restore the upazila first.' });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const villageRes = await client.query('UPDATE villages SET deleted_at = NULL WHERE id = $1 RETURNING *', [id]);
                const homesRes = await client.query('UPDATE homes SET deleted_at = NULL WHERE village_id = $1 AND deleted_at IS NOT NULL RETURNING id', [id]);
                const membersRes = await client.query(`
                    UPDATE members SET deleted_at = NULL 
                    WHERE (village_id = $1 OR home_id IN (SELECT id FROM homes WHERE village_id = $1))
                      AND deleted_at IS NOT NULL 
                    RETURNING id
                `, [id]);
                await client.query('COMMIT');
                return res.json({ 
                    message: `গ্রাম, ${homesRes.rows.length} টি বাড়ি এবং ${membersRes.rows.length} জন সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Village, ${homesRes.rows.length} homes, and ${membersRes.rows.length} members restored)`,
                    restored_item: villageRes.rows[0],
                    restored_count: 1 + homesRes.rows.length + membersRes.rows.length
                });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

        // ==========================================
        // 4. RESTORE UPOZILLA (UPAZILA) & SUB-AREAS & MEMBERS
        // ==========================================
        if (table === 'upazilas') {
            const check = await pool.query(
                `SELECT u.id, 
                        d.deleted_at as district_deleted,
                        div.deleted_at as division_deleted,
                        c.deleted_at as country_deleted
                 FROM upazilas u
                 LEFT JOIN districts d ON d.id = u.district_id
                 LEFT JOIN divisions div ON div.id = d.division_id
                 LEFT JOIN countries c ON c.id = div.country_id
                 WHERE u.id = $1 AND u.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'Upazila not found in recycle bin' });
            if (check.rows[0].district_deleted || check.rows[0].division_deleted || check.rows[0].country_deleted) {
                return res.status(400).json({ error: 'Cannot restore upazila because its district is currently in the recycle bin. Please restore the district first.' });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const upazilaRes = await client.query('UPDATE upazilas SET deleted_at = NULL WHERE id = $1 RETURNING *', [id]);
                const villagesRes = await client.query('UPDATE villages SET deleted_at = NULL WHERE upazila_id = $1 AND deleted_at IS NOT NULL RETURNING id', [id]);
                const homesRes = await client.query('UPDATE homes SET deleted_at = NULL WHERE village_id IN (SELECT id FROM villages WHERE upazila_id = $1) AND deleted_at IS NOT NULL RETURNING id', [id]);
                const membersRes = await client.query(`
                    UPDATE members SET deleted_at = NULL 
                    WHERE (upazila_id = $1 
                           OR village_id IN (SELECT id FROM villages WHERE upazila_id = $1)
                           OR home_id IN (SELECT h.id FROM homes h JOIN villages v ON v.id = h.village_id WHERE v.upazila_id = $1))
                      AND deleted_at IS NOT NULL 
                    RETURNING id
                `, [id]);
                await client.query('COMMIT');
                return res.json({ 
                    message: `উপজেলা, ${villagesRes.rows.length} টি গ্রাম, ${homesRes.rows.length} টি বাড়ি এবং ${membersRes.rows.length} জন সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Upazila, ${villagesRes.rows.length} villages, ${homesRes.rows.length} homes, and ${membersRes.rows.length} members restored)`,
                    restored_item: upazilaRes.rows[0],
                    restored_count: 1 + villagesRes.rows.length + homesRes.rows.length + membersRes.rows.length
                });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

        // ==========================================
        // 5. RESTORE ZILLA (DISTRICT) & ALL SUB-AREAS & MEMBERS
        // ==========================================
        if (table === 'districts') {
            const check = await pool.query(
                `SELECT d.id, 
                        div.deleted_at as division_deleted,
                        c.deleted_at as country_deleted
                 FROM districts d
                 LEFT JOIN divisions div ON div.id = d.division_id
                 LEFT JOIN countries c ON c.id = div.country_id
                 WHERE d.id = $1 AND d.deleted_at IS NOT NULL`,
                [id]
            );
            if (check.rows.length === 0) return res.status(404).json({ error: 'District not found in recycle bin' });
            if (check.rows[0].division_deleted || check.rows[0].country_deleted) {
                return res.status(400).json({ error: 'Cannot restore district because its division is currently in the recycle bin. Please restore the division first.' });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const districtRes = await client.query('UPDATE districts SET deleted_at = NULL WHERE id = $1 RETURNING *', [id]);
                const upazilasRes = await client.query('UPDATE upazilas SET deleted_at = NULL WHERE district_id = $1 AND deleted_at IS NOT NULL RETURNING id', [id]);
                const villagesRes = await client.query('UPDATE villages SET deleted_at = NULL WHERE upazila_id IN (SELECT id FROM upazilas WHERE district_id = $1) AND deleted_at IS NOT NULL RETURNING id', [id]);
                const homesRes = await client.query('UPDATE homes SET deleted_at = NULL WHERE village_id IN (SELECT v.id FROM villages v JOIN upazilas u ON u.id = v.upazila_id WHERE u.district_id = $1) AND deleted_at IS NOT NULL RETURNING id', [id]);
                const membersRes = await client.query(`
                    UPDATE members SET deleted_at = NULL 
                    WHERE (district_id = $1 
                           OR upazila_id IN (SELECT id FROM upazilas WHERE district_id = $1)
                           OR village_id IN (SELECT v.id FROM villages v JOIN upazilas u ON u.id = v.upazila_id WHERE u.district_id = $1)
                           OR home_id IN (SELECT h.id FROM homes h JOIN villages v ON v.id = h.village_id JOIN upazilas u ON u.id = v.upazila_id WHERE u.district_id = $1))
                      AND deleted_at IS NOT NULL 
                    RETURNING id
                `, [id]);
                await client.query('COMMIT');
                return res.json({ 
                    message: `জেলা, ${upazilasRes.rows.length} টি উপজেলা, ${villagesRes.rows.length} টি গ্রাম, ${homesRes.rows.length} টি বাড়ি এবং ${membersRes.rows.length} জন সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (District and all sub-locations and members restored)`,
                    restored_item: districtRes.rows[0],
                    restored_count: 1 + upazilasRes.rows.length + villagesRes.rows.length + homesRes.rows.length + membersRes.rows.length
                });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

        // ==========================================
        // 6. RESTORE DIVISION & ALL SUB-AREAS
        // ==========================================
        if (table === 'divisions') {
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

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const divRes = await client.query('UPDATE divisions SET deleted_at = NULL WHERE id = $1 RETURNING *', [id]);
                const distRes = await client.query('UPDATE districts SET deleted_at = NULL WHERE division_id = $1 AND deleted_at IS NOT NULL RETURNING id', [id]);
                const upRes = await client.query('UPDATE upazilas SET deleted_at = NULL WHERE district_id IN (SELECT id FROM districts WHERE division_id = $1) AND deleted_at IS NOT NULL RETURNING id', [id]);
                const vilRes = await client.query('UPDATE villages SET deleted_at = NULL WHERE upazila_id IN (SELECT id FROM upazilas WHERE district_id IN (SELECT id FROM districts WHERE division_id = $1)) AND deleted_at IS NOT NULL RETURNING id', [id]);
                const hmRes = await client.query('UPDATE homes SET deleted_at = NULL WHERE village_id IN (SELECT v.id FROM villages v JOIN upazilas u ON u.id = v.upazila_id JOIN districts d ON d.id = u.district_id WHERE d.division_id = $1) AND deleted_at IS NOT NULL RETURNING id', [id]);
                const memRes = await client.query(`
                    UPDATE members SET deleted_at = NULL 
                    WHERE (division_id = $1 
                           OR district_id IN (SELECT id FROM districts WHERE division_id = $1)
                           OR upazila_id IN (SELECT id FROM upazilas WHERE district_id IN (SELECT id FROM districts WHERE division_id = $1)))
                      AND deleted_at IS NOT NULL 
                    RETURNING id
                `, [id]);
                await client.query('COMMIT');
                return res.json({ 
                    message: `বিভাগ এবং অধীনস্থ সমস্ত এলাকা ও সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Division and all sub-locations/members restored)`,
                    restored_item: divRes.rows[0],
                    restored_count: 1 + distRes.rows.length + upRes.rows.length + vilRes.rows.length + hmRes.rows.length + memRes.rows.length
                });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

        // ==========================================
        // 7. RESTORE COUNTRY & ALL SUB-AREAS
        // ==========================================
        if (table === 'countries') {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const countryRes = await client.query('UPDATE countries SET deleted_at = NULL WHERE id = $1 RETURNING *', [id]);
                if (countryRes.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Country not found in recycle bin' });
                }
                await client.query('UPDATE divisions SET deleted_at = NULL WHERE country_id = $1', [id]);
                await client.query('UPDATE districts SET deleted_at = NULL WHERE division_id IN (SELECT id FROM divisions WHERE country_id = $1)', [id]);
                await client.query('UPDATE upazilas SET deleted_at = NULL WHERE district_id IN (SELECT d.id FROM districts d JOIN divisions div ON div.id = d.division_id WHERE div.country_id = $1)', [id]);
                await client.query('UPDATE villages SET deleted_at = NULL WHERE upazila_id IN (SELECT u.id FROM upazilas u JOIN districts d ON d.id = u.district_id JOIN divisions div ON div.id = d.division_id WHERE div.country_id = $1)', [id]);
                await client.query('UPDATE homes SET deleted_at = NULL WHERE village_id IN (SELECT v.id FROM villages v JOIN upazilas u ON u.id = v.upazila_id JOIN districts d ON d.id = u.district_id JOIN divisions div ON div.id = d.division_id WHERE div.country_id = $1)', [id]);
                const memRes = await client.query('UPDATE members SET deleted_at = NULL WHERE country_id = $1 AND deleted_at IS NOT NULL RETURNING id', [id]);
                await client.query('COMMIT');
                return res.json({ 
                    message: `দেশ এবং অধীনস্থ সমস্ত এলাকা ও সদস্য সফলভাবে পুনরুদ্ধার করা হয়েছে (Country and all sub-locations/members restored)`,
                    restored_item: countryRes.rows[0],
                    restored_count: 1 + memRes.rows.length
                });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

        return res.status(400).json({ error: 'Unsupported table for restore' });

    } catch (err) {
        console.error('Error restoring item:', err);
        res.status(500).json({ error: 'Server error restoring item: ' + err.message });
    }
};

// ==========================================
// PERMANENT DELETE SINGLE ITEM & ITS SUBTREE
// ==========================================
exports.permanentDeleteItem = async (req, res) => {
    try {
        const { table, id } = req.params;

        const allowedTables = ['members', 'countries', 'divisions', 'districts', 'upazilas', 'villages', 'homes'];
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            if (table === 'members') {
                const check = await client.query('SELECT id, full_name FROM members WHERE id = $1 AND deleted_at IS NOT NULL', [id]);
                if (check.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Member not found in recycle bin' });
                }

                const superAdminCheck = await client.query(
                    `SELECT id FROM admin_users WHERE member_id = $1 AND role = 'superadmin'
                     UNION
                     SELECT id FROM users WHERE member_id = $1 AND role = 'superadmin'`,
                    [id]
                );
                if (superAdminCheck.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'SuperAdmin profile is protected and cannot be deleted.' });
                }

                const recursiveDeleteQuery = `
                    WITH RECURSIVE lineage AS (
                        SELECT id FROM members WHERE id = $1 AND deleted_at IS NOT NULL
                        UNION
                        SELECT lat.id
                        FROM lineage l
                        CROSS JOIN LATERAL (
                            SELECT m.id FROM members m WHERE (m.father_id = l.id OR m.mother_id = l.id) AND m.deleted_at IS NOT NULL
                            UNION
                            SELECT m.id FROM members m 
                            WHERE ((m.father_id IN (
                                SELECT ms.spouse_id FROM member_spouses ms WHERE ms.member_id = l.id
                                UNION
                                SELECT ms.member_id FROM member_spouses ms WHERE ms.spouse_id = l.id
                                UNION
                                SELECT s.spouse_id FROM members s WHERE s.id = l.id AND s.spouse_id IS NOT NULL
                                UNION
                                SELECT s.id FROM members s WHERE s.spouse_id = l.id
                            )) OR (m.mother_id IN (
                                SELECT ms.spouse_id FROM member_spouses ms WHERE ms.member_id = l.id
                                UNION
                                SELECT ms.member_id FROM member_spouses ms WHERE ms.spouse_id = l.id
                                UNION
                                SELECT s.spouse_id FROM members s WHERE s.id = l.id AND s.spouse_id IS NOT NULL
                                UNION
                                SELECT s.id FROM members s WHERE s.spouse_id = l.id
                            ))) AND m.deleted_at IS NOT NULL
                        ) lat
                    ),
                    all_spouses AS (
                        SELECT ms.spouse_id AS id FROM member_spouses ms 
                        JOIN members m_sp ON ms.spouse_id = m_sp.id
                        WHERE ms.member_id IN (SELECT id FROM lineage) AND m_sp.deleted_at IS NOT NULL
                        UNION
                        SELECT ms.member_id AS id FROM member_spouses ms 
                        JOIN members m_sp ON ms.member_id = m_sp.id
                        WHERE ms.spouse_id IN (SELECT id FROM lineage) AND m_sp.deleted_at IS NOT NULL
                        UNION
                        SELECT m.spouse_id AS id FROM members m 
                        JOIN members m_sp ON m.spouse_id = m_sp.id
                        WHERE m.id IN (SELECT id FROM lineage) AND m.spouse_id IS NOT NULL AND m_sp.deleted_at IS NOT NULL
                        UNION
                        SELECT m.id AS id FROM members m 
                        WHERE m.spouse_id IN (SELECT id FROM lineage) AND m.deleted_at IS NOT NULL
                    ),
                    full_subtree AS (
                        SELECT id FROM lineage UNION SELECT id FROM all_spouses WHERE id IS NOT NULL
                    )
                    DELETE FROM members
                    WHERE id IN (SELECT id FROM full_subtree) 
                      AND deleted_at IS NOT NULL
                      AND id NOT IN (
                          SELECT member_id FROM admin_users WHERE role = 'superadmin' AND member_id IS NOT NULL
                          UNION
                          SELECT member_id FROM users WHERE role = 'superadmin' AND member_id IS NOT NULL
                      )
                    RETURNING id, full_name;
                `;
                const delRes = await client.query(recursiveDeleteQuery, [id]);
                await client.query('COMMIT');
                return res.json({
                    message: delRes.rows.length > 1
                        ? `সদস্য এবং পরিবারের আরও ${delRes.rows.length - 1} জন সদস্যকে চিরতরে মুছে ফেলা হয়েছে (Member and ${delRes.rows.length - 1} subtree members permanently deleted)`
                        : 'সদস্য ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে (Member permanently deleted)',
                    deleted_count: delRes.rows.length
                });
            }

            if (table === 'homes') {
                const check = await client.query('SELECT id, name FROM homes WHERE id = $1 AND deleted_at IS NOT NULL', [id]);
                if (check.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Home not found in recycle bin' });
                }
                const delMembers = await client.query('DELETE FROM members WHERE home_id = $1 RETURNING id', [id]);
                const delHome = await client.query('DELETE FROM homes WHERE id = $1 RETURNING *', [id]);
                await client.query('COMMIT');
                return res.json({
                    message: `বাড়ি এবং ${delMembers.rows.length} জন সদস্য স্থায়ীভাবে মুছে ফেলা হয়েছে (Home and members permanently deleted)`,
                    deleted_count: 1 + delMembers.rows.length
                });
            }

            if (table === 'villages') {
                const check = await client.query('SELECT id, name FROM villages WHERE id = $1 AND deleted_at IS NOT NULL', [id]);
                if (check.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Village not found in recycle bin' });
                }
                const delMembers = await client.query('DELETE FROM members WHERE village_id = $1 OR home_id IN (SELECT id FROM homes WHERE village_id = $1) RETURNING id', [id]);
                const delHomes = await client.query('DELETE FROM homes WHERE village_id = $1 RETURNING id', [id]);
                const delVillage = await client.query('DELETE FROM villages WHERE id = $1 RETURNING *', [id]);
                await client.query('COMMIT');
                return res.json({
                    message: `গ্রাম, ${delHomes.rows.length} টি বাড়ি এবং ${delMembers.rows.length} জন সদস্য চিরতরে মুছে ফেলা হয়েছে (Village, homes, and members permanently deleted)`,
                    deleted_count: 1 + delHomes.rows.length + delMembers.rows.length
                });
            }

            if (table === 'upazilas') {
                const check = await client.query('SELECT id, name FROM upazilas WHERE id = $1 AND deleted_at IS NOT NULL', [id]);
                if (check.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Upazila not found in recycle bin' });
                }
                const delMembers = await client.query(`
                    DELETE FROM members 
                    WHERE upazila_id = $1 
                       OR village_id IN (SELECT id FROM villages WHERE upazila_id = $1)
                       OR home_id IN (SELECT h.id FROM homes h JOIN villages v ON v.id = h.village_id WHERE v.upazila_id = $1)
                    RETURNING id
                `, [id]);
                const delHomes = await client.query('DELETE FROM homes WHERE village_id IN (SELECT id FROM villages WHERE upazila_id = $1) RETURNING id', [id]);
                const delVillages = await client.query('DELETE FROM villages WHERE upazila_id = $1 RETURNING id', [id]);
                const delUpazila = await client.query('DELETE FROM upazilas WHERE id = $1 RETURNING *', [id]);
                await client.query('COMMIT');
                return res.json({
                    message: `উপজেলা এবং অধীনস্থ সমস্ত গ্রাম, বাড়ি ও সদস্য চিরতরে মুছে ফেলা হয়েছে (Upazila and sub-locations/members permanently deleted)`,
                    deleted_count: 1 + delVillages.rows.length + delHomes.rows.length + delMembers.rows.length
                });
            }

            if (table === 'districts') {
                const check = await client.query('SELECT id, name FROM districts WHERE id = $1 AND deleted_at IS NOT NULL', [id]);
                if (check.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'District not found in recycle bin' });
                }
                const delMembers = await client.query(`
                    DELETE FROM members 
                    WHERE district_id = $1 
                       OR upazila_id IN (SELECT id FROM upazilas WHERE district_id = $1)
                       OR village_id IN (SELECT v.id FROM villages v JOIN upazilas u ON u.id = v.upazila_id WHERE u.district_id = $1)
                       OR home_id IN (SELECT h.id FROM homes h JOIN villages v ON v.id = h.village_id JOIN upazilas u ON u.id = v.upazila_id WHERE u.district_id = $1)
                    RETURNING id
                `, [id]);
                const delHomes = await client.query('DELETE FROM homes WHERE village_id IN (SELECT v.id FROM villages v JOIN upazilas u ON u.id = v.upazila_id WHERE u.district_id = $1) RETURNING id', [id]);
                const delVillages = await client.query('DELETE FROM villages WHERE upazila_id IN (SELECT id FROM upazilas WHERE district_id = $1) RETURNING id', [id]);
                const delUpazilas = await client.query('DELETE FROM upazilas WHERE district_id = $1 RETURNING id', [id]);
                const delDistrict = await client.query('DELETE FROM districts WHERE id = $1 RETURNING *', [id]);
                await client.query('COMMIT');
                return res.json({
                    message: `জেলা এবং অধীনস্থ সমস্ত উপজেলা, গ্রাম, বাড়ি ও সদস্য চিরতরে মুছে ফেলা হয়েছে (District and sub-locations/members permanently deleted)`,
                    deleted_count: 1 + delUpazilas.rows.length + delVillages.rows.length + delHomes.rows.length + delMembers.rows.length
                });
            }

            if (table === 'divisions') {
                const check = await client.query('SELECT id, name FROM divisions WHERE id = $1 AND deleted_at IS NOT NULL', [id]);
                if (check.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Division not found in recycle bin' });
                }
                const delMembers = await client.query(`
                    DELETE FROM members 
                    WHERE division_id = $1 
                       OR district_id IN (SELECT id FROM districts WHERE division_id = $1)
                    RETURNING id
                `, [id]);
                const delHomes = await client.query('DELETE FROM homes WHERE village_id IN (SELECT v.id FROM villages v JOIN upazilas u ON u.id = v.upazila_id JOIN districts d ON d.id = u.district_id WHERE d.division_id = $1) RETURNING id', [id]);
                const delVillages = await client.query('DELETE FROM villages WHERE upazila_id IN (SELECT u.id FROM upazilas u JOIN districts d ON d.id = u.district_id WHERE d.division_id = $1) RETURNING id', [id]);
                const delUpazilas = await client.query('DELETE FROM upazilas WHERE district_id IN (SELECT id FROM districts WHERE division_id = $1) RETURNING id', [id]);
                const delDistricts = await client.query('DELETE FROM districts WHERE division_id = $1 RETURNING id', [id]);
                const delDivision = await client.query('DELETE FROM divisions WHERE id = $1 RETURNING *', [id]);
                await client.query('COMMIT');
                return res.json({
                    message: `বিভাগ এবং অধীনস্থ সমস্ত এলাকা ও সদস্য চিরতরে মুছে ফেলা হয়েছে (Division and all sub-locations/members permanently deleted)`,
                    deleted_count: 1 + delDistricts.rows.length + delUpazilas.rows.length + delVillages.rows.length + delHomes.rows.length + delMembers.rows.length
                });
            }

            if (table === 'countries') {
                const check = await client.query('SELECT id, name FROM countries WHERE id = $1 AND deleted_at IS NOT NULL', [id]);
                if (check.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Country not found in recycle bin' });
                }
                await client.query('DELETE FROM members WHERE country_id = $1', [id]);
                await client.query('DELETE FROM divisions WHERE country_id = $1', [id]);
                const delCountry = await client.query('DELETE FROM countries WHERE id = $1 RETURNING *', [id]);
                await client.query('COMMIT');
                return res.json({
                    message: `দেশ এবং অধীনস্থ সমস্ত এলাকা ও সদস্য চিরতরে মুছে ফেলা হয়েছে (Country and all sub-locations/members permanently deleted)`,
                    deleted_count: 1
                });
            }

            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Unsupported table for permanent deletion' });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error in permanentDeleteItem:', err);
        res.status(500).json({ error: 'Server error permanently deleting item: ' + err.message });
    }
};

// ==========================================
// EMPTY ENTIRE RECYCLE BIN
// ==========================================
exports.emptyRecycleBin = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const delMembers = await client.query(`
            DELETE FROM members 
            WHERE deleted_at IS NOT NULL 
              AND id NOT IN (
                  SELECT member_id FROM admin_users WHERE role = 'superadmin' AND member_id IS NOT NULL
                  UNION
                  SELECT member_id FROM users WHERE role = 'superadmin' AND member_id IS NOT NULL
              ) 
            RETURNING id
        `);
        const delHomes = await client.query('DELETE FROM homes WHERE deleted_at IS NOT NULL RETURNING id');
        const delVillages = await client.query('DELETE FROM villages WHERE deleted_at IS NOT NULL RETURNING id');
        const delUpazilas = await client.query('DELETE FROM upazilas WHERE deleted_at IS NOT NULL RETURNING id');
        const delDistricts = await client.query('DELETE FROM districts WHERE deleted_at IS NOT NULL RETURNING id');
        const delDivisions = await client.query('DELETE FROM divisions WHERE deleted_at IS NOT NULL RETURNING id');
        const delCountries = await client.query('DELETE FROM countries WHERE deleted_at IS NOT NULL RETURNING id');
        await client.query('COMMIT');

        const totalDeleted = delMembers.rows.length + delHomes.rows.length + delVillages.rows.length + delUpazilas.rows.length + delDistricts.rows.length + delDivisions.rows.length + delCountries.rows.length;

        res.json({
            message: `রিসাইকেল বিনের সমস্ত আইটেম (${totalDeleted} টি) চিরতরে মুছে ফেলা হয়েছে (Recycle bin emptied successfully)`,
            total_deleted: totalDeleted
        });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error emptying recycle bin:', e);
        res.status(500).json({ error: 'Server error emptying recycle bin: ' + e.message });
    } finally {
        client.release();
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
