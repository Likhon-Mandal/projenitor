const { pool } = require('../config/db');

exports.getGeographicHierarchy = async (req, res) => {
    try {
        const { level, parent } = req.query;

        // Hierarchy: country -> division -> district -> upazila -> union -> village -> home

        let query = '';
        let params = [];
        let parentId = null;

        // If parent is provided (name), we need to find its ID first to use as FK
        // Ideally frontend should send ID, but our current URL structure uses names. 
        // We will fetch ID based on parent name. This assumes names are unique within their scope (handled by UNIQUE constraints).

        if (parent && level !== 'country') {
            // Find parent ID.
            // Parent level is the one *above* current level.
            let parentTable = '';
            if (level === 'division') parentTable = 'countries';
            else if (level === 'district') parentTable = 'countries';
            else if (level === 'upazila') parentTable = 'districts';
            // Union removed
            else if (level === 'village') parentTable = 'upazilas';
            else if (level === 'home') parentTable = 'villages';

            if (parentTable) {
                const parentRes = await pool.query(`SELECT id FROM ${parentTable} WHERE name = $1`, [parent]);
                if (parentRes.rows.length > 0) {
                    parentId = parentRes.rows[0].id;
                } else {
                    // Parent not found? Return empty
                    return res.json([]);
                }
            }
        }

        if (!level || level === 'country') {
            query = 'SELECT name FROM countries WHERE deleted_at IS NULL ORDER BY name ASC';
        } else if (level === 'division') {
            query = 'SELECT name FROM divisions WHERE country_id = $1 AND deleted_at IS NULL ORDER BY name ASC';
            params = [parentId];
        } else if (level === 'district') {
            query = 'SELECT districts.name FROM districts JOIN divisions ON districts.division_id = divisions.id WHERE divisions.country_id = $1 AND districts.deleted_at IS NULL AND divisions.deleted_at IS NULL ORDER BY districts.name ASC';
            params = [parentId];
        } else if (level === 'upazila') {
            query = 'SELECT name FROM upazilas WHERE district_id = $1 AND deleted_at IS NULL ORDER BY name ASC';
            params = [parentId];
        } else if (level === 'village') {
            // Village now child of Upazila
            query = 'SELECT name FROM villages WHERE upazila_id = $1 AND deleted_at IS NULL ORDER BY name ASC';
            params = [parentId];
        } else if (level === 'home') {
            query = 'SELECT id, name, map_link FROM homes WHERE village_id = $1 AND deleted_at IS NULL ORDER BY name ASC';
            params = [parentId];
        }

        const result = await pool.query(query, params);
        if (req.query.include_details === 'true') {
            return res.json(result.rows);
        }
        const items = result.rows.map(row => row.name);
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addLocationItem = async (req, res) => {
    try {
        const { level, name, parentName, map_link } = req.body;

        let table = '';
        let parentTable = '';
        let foreignKey = '';

        if (level === 'country') {
            table = 'countries';
        } else if (level === 'division') {
            table = 'divisions'; parentTable = 'countries'; foreignKey = 'country_id';
        } else if (level === 'district') {
            table = 'districts'; parentTable = 'countries'; // Direct connect to countries visually
        } else if (level === 'upazila') {
            table = 'upazilas'; parentTable = 'districts'; foreignKey = 'district_id';
        } else if (level === 'village') {
            table = 'villages'; parentTable = 'upazilas'; foreignKey = 'upazila_id';
        } else if (level === 'home') {
            table = 'homes'; parentTable = 'villages'; foreignKey = 'village_id';
        } else {
            return res.status(400).json({ error: 'Invalid level' });
        }

        let parentId = null;
        if (parentTable && parentName) {
            const parentRes = await pool.query(`SELECT id FROM ${parentTable} WHERE name = $1`, [parentName]);
            if (parentRes.rows.length === 0) {
                return res.status(404).json({ error: `Parent ${parentTable} not found` });
            }
            parentId = parentRes.rows[0].id;
        }

        let query = '';
        let params = [];

        if (table === 'countries') {
            query = `INSERT INTO ${table} (name) VALUES ($1) RETURNING *`;
            params = [name];
        } else if (level === 'district') {
            // Find or create 'Default Division' for this country
            let divRes = await pool.query('SELECT id FROM divisions WHERE country_id = $1 LIMIT 1', [parentId]);
            let divisionId;
            if (divRes.rows.length === 0) {
                const newDiv = await pool.query('INSERT INTO divisions (name, country_id) VALUES ($1, $2) RETURNING id', [`Default Division - ${parentName}`, parentId]);
                divisionId = newDiv.rows[0].id;
            } else {
                divisionId = divRes.rows[0].id;
            }
            query = `INSERT INTO districts (name, division_id) VALUES ($1, $2) RETURNING *`;
            params = [name, divisionId];
        } else if (table === 'homes') {
            query = `INSERT INTO homes (name, village_id, map_link) VALUES ($1, $2, $3) RETURNING *`;
            params = [name, parentId, map_link && typeof map_link === 'string' && map_link.trim() ? map_link.trim() : null];
        } else {
            query = `INSERT INTO ${table} (name, ${foreignKey}) VALUES ($1, $2) RETURNING *`;
            params = [name, parentId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Item already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
};

exports.editLocationItem = async (req, res) => {
    try {
        const { level, oldName, newName, parentName, map_link } = req.body;

        if (!level || !oldName || !newName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let table = '';
        let parentTable = '';
        let foreignKey = '';

        if (level === 'country') {
            table = 'countries';
        } else if (level === 'division') {
            table = 'divisions'; parentTable = 'countries'; foreignKey = 'country_id';
        } else if (level === 'district') {
            // Note: Our DB schema uses districts pointing to divisions. 
            // In addLocationItem, we create a default division if linking district directly to country.
            // When editing a district by its visually-apparent parent (Country), we need to find that default division or join.
            table = 'districts'; parentTable = 'divisions'; // Because district.division_id exists
        } else if (level === 'upazila') {
            table = 'upazilas'; parentTable = 'districts'; foreignKey = 'district_id';
        } else if (level === 'village') {
            table = 'villages'; parentTable = 'upazilas'; foreignKey = 'upazila_id';
        } else if (level === 'home') {
            table = 'homes'; parentTable = 'villages'; foreignKey = 'village_id';
        } else {
            return res.status(400).json({ error: 'Invalid level' });
        }

        let query = '';
        let params = [];

        if (level === 'country') {
            // Country is top level, just update by name
            query = `UPDATE ${table} SET name = $1 WHERE name = $2 RETURNING *`;
            params = [newName, oldName];
        } else if (level === 'district' && parentName) {
            // To securely rename a district, make sure it belongs to the intended Country 
            // (via its intermediate division). This prevents renaming ALL districts named X globally.
            query = `
                UPDATE districts 
                SET name = $1 
                WHERE name = $2 AND division_id IN (
                    SELECT id FROM divisions WHERE country_id = (
                        SELECT id FROM countries WHERE name = $3
                    )
                )
                RETURNING *
             `;
            params = [newName, oldName, parentName];
        } else if (parentName) {
            if (level === 'home') {
                query = `
                    UPDATE homes 
                    SET name = COALESCE($1, name),
                        map_link = CASE WHEN $4::text IS NOT NULL THEN NULLIF($4, '') ELSE map_link END
                    WHERE name = $2 AND village_id = (
                        SELECT id FROM villages WHERE name = $3 AND deleted_at IS NULL
                    )
                    RETURNING *
                `;
                params = [newName || oldName, oldName, parentName, map_link !== undefined ? (map_link ? map_link.trim() : '') : null];
            } else {
                // Secure update for all other levels relying on foreignKey to specific parent
                query = `
                    UPDATE ${table} 
                    SET name = $1 
                    WHERE name = $2 AND ${foreignKey} = (
                        SELECT id FROM ${parentTable} WHERE name = $3
                    )
                    RETURNING *
                `;
                params = [newName, oldName, parentName];
            }
        } else {
            // Fallback unsafe query (should only happen if frontend doesn't send parentName)
            query = `UPDATE ${table} SET name = $1 WHERE name = $2 RETURNING *`;
            params = [newName, oldName];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found or parent mismatch' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique constraint violation on update
            res.status(409).json({ error: 'A location with this new name already exists here' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
};

exports.deleteLocationItem = async (req, res) => {
    try {
        const { level, name, parentName } = req.query; // Use query params for DELETE

        if (!level || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let table = '';
        let parentTable = '';
        let foreignKey = '';

        if (level === 'country') {
            table = 'countries';
        } else if (level === 'division') {
            table = 'divisions'; parentTable = 'countries'; foreignKey = 'country_id';
        } else if (level === 'district') {
            table = 'districts'; parentTable = 'divisions'; // Because district.division_id exists
        } else if (level === 'upazila') {
            table = 'upazilas'; parentTable = 'districts'; foreignKey = 'district_id';
        } else if (level === 'village') {
            table = 'villages'; parentTable = 'upazilas'; foreignKey = 'upazila_id';
        } else if (level === 'home') {
            table = 'homes'; parentTable = 'villages'; foreignKey = 'village_id';
        } else {
            return res.status(400).json({ error: 'Invalid level' });
        }

        let query = '';
        let params = [];

        if (level === 'country') {
            query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE name = $1 RETURNING *`;
            params = [name];
        } else if (level === 'district' && parentName) {
            query = `
                UPDATE districts SET deleted_at = CURRENT_TIMESTAMP 
                WHERE name = $1 AND division_id IN (
                    SELECT id FROM divisions WHERE country_id = (
                        SELECT id FROM countries WHERE name = $2
                    )
                )
                RETURNING *
             `;
            params = [name, parentName];
        } else if (parentName) {
            query = `
                UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP 
                WHERE name = $1 AND ${foreignKey} = (
                    SELECT id FROM ${parentTable} WHERE name = $2
                )
                RETURNING *
            `;
            params = [name, parentName];
        } else {
            // Unsafe fallback, not recommended but handled
            query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE name = $1 RETURNING *`;
            params = [name];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found or parent mismatch' });
        }

        res.json({ message: 'Location deleted successfully', deleted: result.rows[0] });

    } catch (err) {
        console.error(err);
        if (err.code === '23503') { // Foreign key constraint (trying to delete something with children)
            res.status(409).json({ error: 'Cannot delete location because it contains sub-locations or members. Please delete them first.' });
        } else {
            res.status(500).json({ error: 'Server error: ' + err.message });
        }
    }
};

exports.getFamilyMembers = async (req, res) => {
    // Get members of a specific household
    try {
        const { home_name, village } = req.query;

        // We need to join with homes and villages to filter by their strings
        const query = `
            SELECT m.*, h.name as home_name, h.map_link as home_map_link, v.name as village, ef.category as eminent_category,
            f.name_bangla as father_name_bangla, f.name_english as father_name_english, f.full_name as father_name, mo.name_bangla as mother_name_bangla, mo.name_english as mother_name_english, mo.full_name as mother_name,
            u_acc.status as user_status,
            (u_acc.status = 'active') as is_active,
            (u_acc.id IS NOT NULL) as is_claimed,
            (
                SELECT json_agg(json_build_object('id', s_inner.id, 'full_name', s_inner.full_name, 'name_bangla', s_inner.name_bangla, 'name_english', s_inner.name_english, 'level', s_inner.level, 'profile_image_url', s_inner.profile_image_url))
                FROM (
                    SELECT DISTINCT s.id, s.full_name, s.name_bangla, s.name_english, s.level, s.profile_image_url
                    FROM members s
                    WHERE (
                        s.id IN (SELECT spouse_id FROM member_spouses WHERE member_id = m.id)
                        OR s.id IN (SELECT member_id FROM member_spouses WHERE spouse_id = m.id)
                        OR s.spouse_id = m.id 
                        OR m.spouse_id = s.id
                    )
                    AND s.id != m.id
                    AND s.deleted_at IS NULL
                ) s_inner
            ) as spouses
            FROM members m
            LEFT JOIN (
                SELECT DISTINCT ON (member_id) member_id, id, status, role 
                FROM users 
                WHERE member_id IS NOT NULL 
                ORDER BY member_id, CASE WHEN status = 'active' THEN 1 WHEN status = 'approved' THEN 2 WHEN status = 'pending' THEN 3 ELSE 4 END
            ) u_acc ON m.id = u_acc.member_id
            LEFT JOIN members f ON m.father_id = f.id
            LEFT JOIN members mo ON m.mother_id = mo.id
            JOIN homes h ON m.home_id = h.id
            JOIN villages v ON m.village_id = v.id
            LEFT JOIN eminent_figures ef ON m.id = ef.member_id
            WHERE h.name = $1 AND v.name = $2 AND m.deleted_at IS NULL
            ORDER BY 
                CASE 
                    WHEN m.gender = 'Male' THEN 1
                    WHEN m.gender = 'Female' THEN 2
                    ELSE 3
                END ASC,
                m.created_at ASC
        `;

        const result = await pool.query(query, [home_name, village]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getRelatives = async (req, res) => {
    try {
        const { id } = req.params;

        // Get the member first
        const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        const member = memberResult.rows[0];

        // Get Parents
        const parentsQuery = 'SELECT * FROM members WHERE id IN ($1, $2) AND deleted_at IS NULL';
        const parentsResult = await pool.query(parentsQuery, [member.father_id, member.mother_id]);

        // Get Spouses
        const spouseQuery = `
            SELECT DISTINCT m.* 
            FROM members m
            LEFT JOIN member_spouses ms ON m.id = ms.spouse_id
            WHERE (ms.member_id = $1 OR m.spouse_id = $1)
            AND m.id != $1
            AND m.deleted_at IS NULL
        `;
        const spouseResult = await pool.query(spouseQuery, [id]);

        // Get Children
        const childrenQuery = 'SELECT * FROM members WHERE (father_id = $1 OR mother_id = $1) AND deleted_at IS NULL ORDER BY created_at ASC';
        const childrenResult = await pool.query(childrenQuery, [id]);

        const response = {
            self: member,
            parents: parentsResult.rows,
            spouses: spouseResult.rows,
            children: childrenResult.rows
        };

        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllSpouses = async (req, res) => {
    try {
        const { home_name, village, generation, search } = req.query;

        let query = `
            SELECT 
                m.*,
                COALESCE(m.level, (
                    SELECT p.level FROM members p 
                    JOIN member_spouses ms ON (ms.member_id = p.id AND ms.spouse_id = m.id) OR (ms.spouse_id = p.id AND ms.member_id = m.id)
                    WHERE p.id != m.id AND p.deleted_at IS NULL LIMIT 1
                ), 1) as generation_level,
                (
                    SELECT json_agg(json_build_object(
                        'id', p.id,
                        'full_name', p.full_name,
                        'name_bangla', p.name_bangla,
                        'name_english', p.name_english,
                        'level', p.level
                    ))
                    FROM (
                        SELECT DISTINCT p.id, p.full_name, p.name_bangla, p.name_english, p.level
                        FROM members p
                        JOIN member_spouses ms ON (ms.member_id = p.id AND ms.spouse_id = m.id) OR (ms.spouse_id = p.id AND ms.member_id = m.id)
                        WHERE p.id != m.id AND p.deleted_at IS NULL
                    ) p
                ) as partners,
                COALESCE(h.name, (
                    SELECT h2.name FROM members p2
                    JOIN member_spouses ms2 ON (ms2.member_id = p2.id AND ms2.spouse_id = m.id) OR (ms2.spouse_id = p2.id AND ms2.member_id = m.id)
                    JOIN homes h2 ON p2.home_id = h2.id
                    WHERE p2.id != m.id AND p2.deleted_at IS NULL LIMIT 1
                )) as home_name,
                COALESCE(v.name, (
                    SELECT v2.name FROM members p2
                    JOIN member_spouses ms2 ON (ms2.member_id = p2.id AND ms2.spouse_id = m.id) OR (ms2.spouse_id = p2.id AND ms2.member_id = m.id)
                    JOIN villages v2 ON p2.village_id = v2.id
                    WHERE p2.id != m.id AND p2.deleted_at IS NULL LIMIT 1
                )) as village,
                COALESCE(u.name, (
                    SELECT u2.name FROM members p2
                    JOIN member_spouses ms2 ON (ms2.member_id = p2.id AND ms2.spouse_id = m.id) OR (ms2.spouse_id = p2.id AND ms2.member_id = m.id)
                    JOIN upazilas u2 ON p2.upazila_id = u2.id
                    WHERE p2.id != m.id AND p2.deleted_at IS NULL LIMIT 1
                )) as upazila,
                COALESCE(di.name, (
                    SELECT di2.name FROM members p2
                    JOIN member_spouses ms2 ON (ms2.member_id = p2.id AND ms2.spouse_id = m.id) OR (ms2.spouse_id = p2.id AND ms2.member_id = m.id)
                    JOIN districts di2 ON p2.district_id = di2.id
                    WHERE p2.id != m.id AND p2.deleted_at IS NULL LIMIT 1
                )) as district
            FROM members m
            LEFT JOIN homes h ON m.home_id = h.id
            LEFT JOIN villages v ON m.village_id = v.id
            LEFT JOIN upazilas u ON m.upazila_id = u.id
            LEFT JOIN districts di ON m.district_id = di.id
            WHERE m.gender = 'Female' 
              AND m.deleted_at IS NULL
              AND (
                EXISTS (SELECT 1 FROM member_spouses ms WHERE ms.spouse_id = m.id OR ms.member_id = m.id)
                OR m.spouse_id IS NOT NULL 
                OR EXISTS (SELECT 1 FROM members x WHERE x.spouse_id = m.id AND x.deleted_at IS NULL)
              )
        `;

        const params = [];

        if (home_name) {
            params.push(home_name);
            query += ` AND (h.name = $${params.length} OR EXISTS (
                SELECT 1 FROM members p2
                JOIN member_spouses ms2 ON (ms2.member_id = p2.id AND ms2.spouse_id = m.id) OR (ms2.spouse_id = p2.id AND ms2.member_id = m.id)
                JOIN homes h2 ON p2.home_id = h2.id
                WHERE p2.id != m.id AND h2.name = $${params.length}
            ))`;
        }

        if (village) {
            params.push(village);
            query += ` AND (v.name = $${params.length} OR EXISTS (
                SELECT 1 FROM members p2
                JOIN member_spouses ms2 ON (ms2.member_id = p2.id AND ms2.spouse_id = m.id) OR (ms2.spouse_id = p2.id AND ms2.member_id = m.id)
                JOIN villages v2 ON p2.village_id = v2.id
                WHERE p2.id != m.id AND v2.name = $${params.length}
            ))`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (
                m.full_name ILIKE $${params.length} 
                OR m.name_bangla ILIKE $${params.length} 
                OR m.name_english ILIKE $${params.length}
                OR m.occupation ILIKE $${params.length}
                OR m.workplace ILIKE $${params.length}
                OR EXISTS (
                    SELECT 1 FROM members p3
                    JOIN member_spouses ms3 ON (ms3.member_id = p3.id AND ms3.spouse_id = m.id) OR (ms3.spouse_id = p3.id AND ms3.member_id = m.id)
                    WHERE p3.id != m.id AND (p3.full_name ILIKE $${params.length} OR p3.name_bangla ILIKE $${params.length})
                )
            )`;
        }

        query += ` ORDER BY generation_level ASC, m.full_name ASC`;

        const result = await pool.query(query, params);

        let rows = result.rows;
        if (generation) {
            const genNum = parseInt(generation, 10);
            if (!isNaN(genNum)) {
                rows = rows.filter(r => r.generation_level === genNum);
            }
        }

        res.json(rows);
    } catch (err) {
        console.error('Error fetching spouses:', err);
        res.status(500).json({ error: 'Server error fetching spouses' });
    }
};

exports.getHomeDetails = async (req, res) => {
    try {
        const { home_name, village, home_id } = req.query;
        let query, params;
        if (home_id) {
            query = `
                SELECT h.id, h.name, h.map_link, h.village_id, v.name as village_name, u.name as upazila_name, d.name as district_name
                FROM homes h
                LEFT JOIN villages v ON h.village_id = v.id
                LEFT JOIN upazilas u ON v.upazila_id = u.id
                LEFT JOIN districts d ON u.district_id = d.id
                WHERE h.id = $1 AND h.deleted_at IS NULL
            `;
            params = [home_id];
        } else if (home_name && village) {
            query = `
                SELECT h.id, h.name, h.map_link, h.village_id, v.name as village_name, u.name as upazila_name, d.name as district_name
                FROM homes h
                JOIN villages v ON h.village_id = v.id
                LEFT JOIN upazilas u ON v.upazila_id = u.id
                LEFT JOIN districts d ON u.district_id = d.id
                WHERE h.name = $1 AND v.name = $2 AND h.deleted_at IS NULL
            `;
            params = [home_name, village];
        } else {
            return res.status(400).json({ error: 'home_name and village or home_id are required' });
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Home not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching home details:', err);
        res.status(500).json({ error: 'Server error fetching home details' });
    }
};

exports.updateHomeMapLink = async (req, res) => {
    try {
        const { home_id, home_name, village, map_link } = req.body;
        let query, params;
        const cleanLink = map_link && typeof map_link === 'string' && map_link.trim() ? map_link.trim() : null;

        if (home_id) {
            query = `UPDATE homes SET map_link = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *`;
            params = [cleanLink, home_id];
        } else if (home_name && village) {
            query = `
                UPDATE homes 
                SET map_link = $1 
                WHERE name = $2 
                  AND village_id = (SELECT id FROM villages WHERE name = $3 AND deleted_at IS NULL LIMIT 1)
                  AND deleted_at IS NULL
                RETURNING *
            `;
            params = [cleanLink, home_name, village];
        } else {
            return res.status(400).json({ error: 'home_id or (home_name and village) is required' });
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Home not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating home map link:', err);
        res.status(500).json({ error: 'Server error updating home map link' });
    }
};


