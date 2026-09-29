const { pool } = require('../config/db');

// Bilingual synonyms mapping for seamless cross-language search
const OCCUPATION_SYNONYMS = {
  'শিক্ষক': ['Teacher', 'Professor'],
  'teacher': ['শিক্ষক', 'অধ্যাপক'],
  'ডাক্তার': ['Doctor', 'Physician'],
  'doctor': ['ডাক্তার', 'চিকিৎসক'],
  'চিকিৎসক': ['Doctor'],
  'কৃষক': ['Farmer', 'Agriculture'],
  'farmer': ['কৃষক'],
  'প্রকৌশলী': ['Engineer'],
  'engineer': ['প্রকৌশলী', 'ইঞ্জিনিয়ার'],
  'ইঞ্জিনিয়ার': ['Engineer', 'প্রকৌশলী'],
  'আইনজীবী': ['Lawyer', 'Advocate'],
  'উকিল': ['Lawyer'],
  'lawyer': ['আইনজীবী', 'উকিল'],
  'ব্যাংকার': ['Banker'],
  'banker': ['ব্যাংকার', 'ব্যাংক কর্মকর্তা'],
  'ব্যবসায়ী': ['Businessman', 'Merchant'],
  'ব্যবসায়ী': ['Businessman', 'Merchant'],
  'businessman': ['ব্যবসায়ী', 'ব্যবসায়ী'],
  'merchant': ['ব্যবসায়ী', 'সওদাগর'],
  'ছাত্র': ['Student'],
  'ছাত্রী': ['Student'],
  'student': ['ছাত্র', 'ছাত্রী'],
  'গৃহিণী': ['Housewife', 'Homemaker'],
  'housewife': ['গৃহিণী'],
  'grihini': ['গৃহিণী', 'Housewife'],
  'homemaker': ['গৃহিণী', 'Housewife'],
  'প্রবাসী': ['Expatriate'],
  'expatriate': ['প্রবাসী'],
  'পুলিশ': ['Police', 'Police Officer', 'Police inspector'],
  'police': ['পুলিশ'],
  'সেনাবাহিনী': ['Soldier', 'Army', 'Military'],
  'soldier': ['সেনাবাহিনী', 'সৈনিক'],
  'নার্স': ['Nurse'],
  'সেবিকা': ['Nurse'],
  'nurse': ['নার্স', 'সেবিকা'],
  'পাইলট': ['Pilot'],
  'pilot': ['পাইলট', 'বৈমানিক'],
  'শিল্পী': ['Artist'],
  'artist': ['শিল্পী'],
  'বিজ্ঞানী': ['Scientist'],
  'scientist': ['বিজ্ঞানী'],
  'ছুতার': ['Carpenter'],
  'কাঠমিস্ত্রী': ['Carpenter'],
  'carpenter': ['ছুতার', 'কাঠমিস্ত্রী'],
  'চাকুরীজীবী': ['Civil Servant', 'Service'],
  'চাকরিজীবী': ['Civil Servant', 'Service'],
  'civil servant': ['সরকারি চাকরিজীবী', 'চাকুরীজীবী'],
};

exports.getAllMembers = async (req, res) => {
  try {
    const { name, workplace, education, blood_group, country, division, district, upazila, village } = req.query;

    let query = `
        SELECT m.*,
      c.name as country,
      d.name as division,
      di.name as district,
      u.name as upazila,
      v.name as village,
      h.name as home_name,
      ef.category as eminent_category,
      f.full_name as father_name,
      mo.full_name as mother_name,
      (
          SELECT json_agg(json_build_object('id', s_inner.id, 'full_name', s_inner.full_name, 'name_bangla', s_inner.name_bangla, 'name_english', s_inner.name_english, 'level', s_inner.level, 'profile_image_url', s_inner.profile_image_url))
          FROM (
              SELECT DISTINCT s.id, s.full_name, s.name_bangla, s.name_english, s.level, s.profile_image_url
              FROM members s
              LEFT JOIN member_spouses ms ON s.id = ms.spouse_id
              WHERE (ms.member_id = m.id OR s.spouse_id = m.id OR m.spouse_id = s.id)
              AND s.id != m.id
              AND s.deleted_at IS NULL
          ) s_inner
      ) as spouses
        FROM members m
        LEFT JOIN countries c ON m.country_id = c.id
        LEFT JOIN divisions d ON m.division_id = d.id
        LEFT JOIN districts di ON m.district_id = di.id
        LEFT JOIN upazilas u ON m.upazila_id = u.id
        LEFT JOIN villages v ON m.village_id = v.id
        LEFT JOIN homes h ON m.home_id = h.id
        LEFT JOIN eminent_figures ef ON m.id = ef.member_id
        LEFT JOIN members f ON m.father_id = f.id
        LEFT JOIN members mo ON m.mother_id = mo.id
        WHERE m.deleted_at IS NULL
    `;

    const params = [];

    if (name) {
      params.push(`%${name}%`);
      query += ` AND (m.full_name ILIKE $${params.length} OR m.name_bangla ILIKE $${params.length} OR m.name_english ILIKE $${params.length})`;
    }
    if (workplace) {
      const trimmed = workplace.trim();
      params.push(`%${trimmed}%`);
      let occConditions = `(m.occupation ILIKE $${params.length} OR m.workplace ILIKE $${params.length})`;

      // Check cross-language synonyms for bilingual search
      const lower = trimmed.toLowerCase();
      const synonyms = OCCUPATION_SYNONYMS[lower] || OCCUPATION_SYNONYMS[trimmed] || [];
      for (const syn of synonyms) {
        params.push(`%${syn}%`);
        occConditions += ` OR (m.occupation ILIKE $${params.length} OR m.workplace ILIKE $${params.length})`;
      }
      query += ` AND (${occConditions})`;
    }
    if (education) {
      params.push(`%${education}%`);
      query += ` AND m.education ILIKE $${params.length}`;
    }
    if (blood_group) {
      params.push(blood_group);
      query += ` AND m.blood_group = $${params.length}`;
    }

    // Geographic filters (by Name)
    // Since frontend sends names, we filter on the joined table names
    if (country) {
      params.push(country);
      query += ` AND c.name = $${params.length}`;
    }
    if (division) {
      params.push(division);
      query += ` AND d.name = $${params.length}`;
    }
    if (district) {
      params.push(`%${district}%`);
      query += ` AND di.name ILIKE $${params.length}`;
    }
    if (upazila) {
      params.push(`%${upazila}%`);
      query += ` AND u.name ILIKE $${params.length}`;
    }
    if (village) {
      params.push(`%${village}%`);
      query += ` AND v.name ILIKE $${params.length}`;
    }

    query += ' LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT m.*,
        c.name as country,
        d.name as division,
        di.name as district,
        u.name as upazila,
        v.name as village,
        h.name as home_name,
        ef.category as eminent_category,
        f.full_name as father_name,
        f.name_bangla as father_name_bangla,
        mo.full_name as mother_name,
        mo.name_bangla as mother_name_bangla
      FROM members m
      LEFT JOIN countries c ON m.country_id = c.id
      LEFT JOIN divisions d ON m.division_id = d.id
      LEFT JOIN districts di ON m.district_id = di.id
      LEFT JOIN upazilas u ON m.upazila_id = u.id
      LEFT JOIN villages v ON m.village_id = v.id
      LEFT JOIN homes h ON m.home_id = h.id
      LEFT JOIN eminent_figures ef ON m.id = ef.member_id
      LEFT JOIN members f ON m.father_id = f.id
      LEFT JOIN members mo ON m.mother_id = mo.id
      WHERE m.id = $1 AND m.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = result.rows[0];

    // Fetch children (with rich data)
    const childrenQuery = `
      SELECT id, full_name, name_bangla, name_english, profile_image_url, gender, level, father_id, mother_id, created_at 
      FROM members 
      WHERE (father_id = $1 OR mother_id = $1) AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const childrenResult = await pool.query(childrenQuery, [id]);
    member.children = childrenResult.rows;

    // Fetch spouses (with rich data including father_id, mother_id, level)
    const spousesQuery = `
      SELECT DISTINCT m.id, m.full_name, m.name_bangla, m.name_english, m.profile_image_url, m.gender, m.occupation, m.workplace, m.blood_group, m.contact_number, m.social_media, m.level, m.father_id, m.mother_id
      FROM members m
      WHERE (
        m.id IN (SELECT ms.spouse_id FROM member_spouses ms WHERE ms.member_id = $1)
        OR m.id IN (SELECT ms.member_id FROM member_spouses ms WHERE ms.spouse_id = $1)
        OR m.spouse_id = $1
        OR (SELECT spouse_id FROM members WHERE id = $1) = m.id
      )
      AND m.id != $1
      AND m.deleted_at IS NULL
    `;
    const spousesResult = await pool.query(spousesQuery, [id]);
    member.spouses = spousesResult.rows;

    // Fetch siblings (same father or same mother)
    if (member.father_id || member.mother_id) {
      const siblingsQuery = `
        SELECT DISTINCT m.id, m.full_name, m.name_bangla, m.name_english, m.profile_image_url, m.gender, m.level, m.father_id, m.mother_id
        FROM members m
        WHERE m.id != $1 AND m.deleted_at IS NULL
          AND (
            ($2::uuid IS NOT NULL AND m.father_id = $2)
            OR ($3::uuid IS NOT NULL AND m.mother_id = $3)
          )
      `;
      const siblingsResult = await pool.query(siblingsQuery, [id, member.father_id || null, member.mother_id || null]);
      member.siblings = siblingsResult.rows;
    } else {
      member.siblings = [];
    }

    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createMember = async (req, res) => {
  try {
    const {
      full_name, name_bangla, name_english, gender, blood_group, occupation, education,
      birth_date, death_date, is_alive,
      contact_number, email, present_address, permanent_address,
      country, division, district, upazila, union_ward, village, home_name,
      father_id, mother_id, spouse_id,
      profile_image_url, bio, level, workplace, social_media
    } = req.body;

    // Helper to get ID or create if not exists (or just get)
    // For now, we assume locations exist or we fail?
    // User flow: Explorer adds locations first. Member form selects them (or passes them).
    // If strict FK, we must find IDs.

    // Function to find ID by name from a table
    const findId = async (table, name, parentCol, parentId) => {
      if (!name) return null;
      let query = `SELECT id FROM ${table} WHERE name = $1`;
      let params = [name];
      if (parentCol && parentId) {
        query += ` AND ${parentCol} = $2`;
        params.push(parentId);
      }
      const res = await pool.query(query, params);
      if (res.rows.length > 0) return res.rows[0].id;
      return null; // Or throw error?
    };

    // Resolve IDs hierarchy
    const country_id = await findId('countries', country);
    const division_id = await findId('divisions', division, 'country_id', country_id);
    const district_id = await findId('districts', district, 'division_id', division_id);
    const upazila_id = await findId('upazilas', upazila, 'district_id', district_id);
    // Union removed
    const village_id = await findId('villages', village, 'upazila_id', upazila_id);
    const home_id = await findId('homes', home_name, 'village_id', village_id);

    // Note: If any ID is missing but name was provided, it means data inconsistency or location not added yet.

    const trimmedBangla = name_bangla?.trim() || null;
    const trimmedEnglish = name_english?.trim() || null;
    const computedFullName = full_name?.trim() || (trimmedBangla && trimmedEnglish ? `${trimmedBangla} (${trimmedEnglish})` : (trimmedBangla || trimmedEnglish || ''));

    // Lock spouse generation level to her husband's level and gender to Female
    let finalLevel = level;
    let finalGender = gender;
    if (spouse_id || req.body.isSpouseFlag || req.body.role === 'spouse') {
      const husbandRes = await pool.query('SELECT level FROM members WHERE id = $1', [spouse_id]);
      if (husbandRes.rows.length > 0) {
        finalGender = 'Female';
        if (husbandRes.rows[0].level !== null) {
          finalLevel = husbandRes.rows[0].level;
        }
      } else if (req.body.isSpouseFlag || req.body.role === 'spouse') {
        finalGender = 'Female';
      }
    }

    const query = `
      INSERT INTO members (
        full_name, name_bangla, name_english, gender, blood_group, occupation, education,
        birth_date, death_date, is_alive,
        contact_number, email, present_address, permanent_address,
        country_id, division_id, district_id, upazila_id, village_id, home_id,
        father_id, mother_id, spouse_id,
        profile_image_url, bio, level, workplace, social_media
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23,
        $24, $25, $26, $27, $28
      ) RETURNING *`;

    const values = [
      computedFullName, trimmedBangla, trimmedEnglish, finalGender, blood_group, occupation, education,
      birth_date || null, death_date || null, is_alive,
      contact_number, email, present_address, permanent_address,
      country_id, division_id, district_id, upazila_id, village_id, home_id,
      father_id, mother_id, spouse_id,
      profile_image_url, bio, finalLevel, workplace, social_media
    ];

    const result = await pool.query(query, values);
    const newMember = result.rows[0];

    // Handle initial spouse link if provided
    if (spouse_id) {
      await pool.query(
        'INSERT INTO member_spouses (member_id, spouse_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
        [newMember.id, spouse_id]
      );
    }

    res.status(201).json(newMember);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message, stack: err.stack });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name, name_bangla, name_english, gender, blood_group, occupation, education,
      birth_date, death_date, is_alive,
      contact_number, email, present_address, permanent_address,
      country, division, district, upazila, village, home_name,
      father_id, mother_id, spouse_id,
      profile_image_url, bio, level, workplace, social_media
    } = req.body;

    // Helper to find ID (same as create)
    const findId = async (table, name, parentCol, parentId) => {
      if (!name) return null;
      let query = `SELECT id FROM ${table} WHERE name = $1`;
      let params = [name];
      if (parentCol && parentId) {
        query += ` AND ${parentCol} = $2`;
        params.push(parentId);
      }
      const res = await pool.query(query, params);
      if (res.rows.length > 0) return res.rows[0].id;
      return null;
    };

    // Resolve IDs
    const country_id = await findId('countries', country);
    const division_id = await findId('divisions', division, 'country_id', country_id);
    const district_id = await findId('districts', district, 'division_id', division_id);
    const upazila_id = await findId('upazilas', upazila, 'district_id', district_id);
    const village_id = await findId('villages', village, 'upazila_id', upazila_id);
    const home_id = await findId('homes', home_name, 'village_id', village_id);

    const trimmedBangla = name_bangla?.trim() || null;
    const trimmedEnglish = name_english?.trim() || null;
    const computedFullName = full_name?.trim() || (trimmedBangla && trimmedEnglish ? `${trimmedBangla} (${trimmedEnglish})` : (trimmedBangla || trimmedEnglish || ''));

    // Get existing member to check if level changed
    const existingMemberRes = await pool.query('SELECT level, gender FROM members WHERE id = $1', [id]);
    if (existingMemberRes.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    const oldLevel = existingMemberRes.rows[0].level;
    const existingGender = existingMemberRes.rows[0].gender;

    // Determine target level & gender:
    // If the member is a spouse of a male member (or has a husband / spouse role),
    // her generation level is ALWAYS strictly locked to her husband's level,
    // and her gender is ALWAYS strictly fixed as 'Female'!
    let targetLevel = level;
    let finalGender = gender || existingGender;

    const husbandRes = await pool.query(`
      SELECT m.level 
      FROM members m
      WHERE m.gender = 'Male' AND m.deleted_at IS NULL AND (
        m.id = $1::uuid
        OR m.id IN (SELECT ms.spouse_id FROM member_spouses ms WHERE ms.member_id = $2::uuid)
        OR m.id IN (SELECT ms.member_id FROM member_spouses ms WHERE ms.spouse_id = $2::uuid)
        OR m.id = (SELECT spouse_id FROM members WHERE id = $2::uuid)
      )
      LIMIT 1
    `, [spouse_id || null, id]);

    const isSpouseOfMale = husbandRes.rows.length > 0;
    if (isSpouseOfMale || req.body.isSpouseFlag || req.body.role === 'spouse') {
      finalGender = 'Female';
      if (husbandRes.rows.length > 0 && husbandRes.rows[0].level !== null) {
        targetLevel = husbandRes.rows[0].level;
      }
    } else if (finalGender === 'Female' && husbandRes.rows.length > 0 && husbandRes.rows[0].level !== null) {
      targetLevel = husbandRes.rows[0].level;
    }

    const query = `
      UPDATE members SET
        full_name = $1, name_bangla = $2, name_english = $3, gender = $4, blood_group = $5, occupation = $6, education = $7,
        birth_date = $8, death_date = $9, is_alive = $10,
        contact_number = $11, email = $12, present_address = $13, permanent_address = $14,
        country_id = $15, division_id = $16, district_id = $17, upazila_id = $18, village_id = $19, home_id = $20,
        father_id = $21, mother_id = $22, spouse_id = $23,
        profile_image_url = $24, bio = $25, level = $26, workplace = $27, social_media = $28,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $29 RETURNING *`;

    const values = [
      computedFullName, trimmedBangla, trimmedEnglish, finalGender, blood_group, occupation, education,
      birth_date || null, death_date || null, is_alive,
      contact_number, email, present_address, permanent_address,
      country_id, division_id, district_id, upazila_id, village_id, home_id,
      father_id, mother_id, spouse_id,
      profile_image_url, bio, targetLevel, workplace, social_media,
      id
    ];

    const result = await pool.query(query, values);

    // If level has changed and the new level is valid, update all descendants recursively
    if (targetLevel !== undefined && targetLevel !== null && oldLevel !== null && Number(targetLevel) !== Number(oldLevel)) {
      const updateSubtreeQuery = `
        WITH RECURSIVE family_tree AS (
            -- Base case: The children of the updated member
            SELECT id, $2::int + 1 AS correct_level
            FROM members
            WHERE father_id = $1 OR mother_id = $1

            UNION ALL

            -- Recursive case: Next generations
            SELECT m.id, ft.correct_level + 1
            FROM members m
            INNER JOIN family_tree ft ON (m.father_id = ft.id OR m.mother_id = ft.id)
        )
        UPDATE members
        SET level = ft.correct_level
        FROM family_tree ft
        WHERE members.id = ft.id;
      `;
      await pool.query(updateSubtreeQuery, [id, Number(targetLevel)]);
    }

    // Always sync spouses for the updated member and their descendants (if level changed)
    // We can do this whether or not level changed, or just when it changed. 
    // It's safest to sync spouses of the target member and their subtree to ensure consistency.
    if (targetLevel !== undefined && targetLevel !== null) {
      const syncSpousesQuery = `
        WITH RECURSIVE family_tree AS (
            -- Base case: The updated member
            SELECT id
            FROM members
            WHERE id = $1

            UNION ALL

            -- Recursive case: Next generations
            SELECT m.id
            FROM members m
            INNER JOIN family_tree ft ON (m.father_id = ft.id OR m.mother_id = ft.id)
        )
        UPDATE members m
        SET level = blood.level
        FROM member_spouses ms
        JOIN members blood ON ms.member_id = blood.id
        JOIN family_tree ft ON blood.id = ft.id
        WHERE m.id = ms.spouse_id 
          AND (m.level IS NULL OR m.level != blood.level);
      `;
      await pool.query(syncSpousesQuery, [id]);
    }

    // Sync spouse if changed/provided
    if (spouse_id) {
      await pool.query(
        'INSERT INTO member_spouses (member_id, spouse_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
        [id, spouse_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message, stack: err.stack });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if target member exists
    const targetCheck = await pool.query(
      'SELECT id, full_name, gender, father_id, mother_id FROM members WHERE id = $1',
      [id]
    );

    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const target = targetCheck.rows[0];
    
    // If spouseOnly flag is set, just delete the spouse without cascading
    if (req.query.spouseOnly === 'true') {
      await pool.query('UPDATE members SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
      return res.json({
        message: 'Spouse deleted successfully',
        deleted_count: 1,
        deleted_members: [target]
      });
    }

    const isFemaleInMarriedSpouse = target && (target.gender === 'Female' || !target.gender) && !target.father_id && !target.mother_id;

    const query = `
      WITH RECURSIVE lineage AS (
        -- 1. Target node
        SELECT id FROM members WHERE id = $1
        UNION
        -- 2. Traverse all biological children, grandchildren, and any children connected via spouses
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
        -- 3. All spouses of anyone in lineage (target node and all descendants)
        SELECT ms.spouse_id AS id 
        FROM member_spouses ms 
        JOIN members s ON s.id = ms.spouse_id
        WHERE ms.member_id IN (SELECT id FROM lineage)
          AND NOT (ms.member_id = $1 AND s.gender = 'Male' AND $2 = true)

        UNION

        SELECT ms.member_id AS id 
        FROM member_spouses ms 
        JOIN members s ON s.id = ms.member_id
        WHERE ms.spouse_id IN (SELECT id FROM lineage)
          AND NOT (ms.spouse_id = $1 AND s.gender = 'Male' AND $2 = true)

        UNION

        SELECT m.spouse_id AS id 
        FROM members m 
        JOIN members s ON s.id = m.spouse_id
        WHERE m.id IN (SELECT id FROM lineage) AND m.spouse_id IS NOT NULL
          AND NOT (m.id = $1 AND s.gender = 'Male' AND $2 = true)

        UNION

        SELECT m.id AS id 
        FROM members m 
        JOIN members s ON s.id = m.id
        WHERE m.spouse_id IN (SELECT id FROM lineage)
          AND NOT (m.spouse_id = $1 AND s.gender = 'Male' AND $2 = true)
      ),
      full_subtree AS (
        SELECT id FROM lineage
        UNION
        SELECT id FROM all_spouses WHERE id IS NOT NULL
      )
      UPDATE members
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id IN (SELECT id FROM full_subtree)
        AND deleted_at IS NULL
      RETURNING id, full_name, name_bangla;
    `;

    const result = await pool.query(query, [id, isFemaleInMarriedSpouse]);

    res.json({
      message: `Member and ${result.rows.length - 1} related member(s) (subtree and spouses) deleted successfully`,
      deleted_count: result.rows.length,
      deleted_members: result.rows
    });
  } catch (err) {
    console.error('Error in deleteMember:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

exports.deleteSpouseRelationship = async (req, res) => {
  try {
    const { id, spouseId } = req.params;

    // Delete bidirectional entries from member_spouses
    await pool.query(
      'DELETE FROM member_spouses WHERE (member_id = $1 AND spouse_id = $2) OR (member_id = $2 AND spouse_id = $1)',
      [id, spouseId]
    );

    // Also clear redundant legacy spouse_id columns for both members
    await pool.query('UPDATE members SET spouse_id = NULL WHERE (id = $1 AND spouse_id = $2) OR (id = $2 AND spouse_id = $1)', [id, spouseId]);

    res.json({ message: 'Spouse relationship removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

exports.addSpouseRelationship = async (req, res) => {
  try {
    const { id } = req.params;
    const { spouseId } = req.body;

    if (!spouseId) {
      return res.status(400).json({ error: 'Spouse ID is required' });
    }

    // Add bidirectional entries to member_spouses
    await pool.query(
      'INSERT INTO member_spouses (member_id, spouse_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
      [id, spouseId]
    );

    // Also update redundant legacy spouse_id column for consistency
    await pool.query('UPDATE members SET spouse_id = $2 WHERE id = $1', [id, spouseId]);
    await pool.query('UPDATE members SET spouse_id = $1 WHERE id = $2', [id, spouseId]);

    // Ensure female spouse's level matches her husband's level
    await pool.query(`
      UPDATE members
      SET level = (SELECT level FROM members WHERE id = $1 AND gender = 'Male')
      WHERE id = $2 AND gender = 'Female' AND (SELECT level FROM members WHERE id = $1 AND gender = 'Male') IS NOT NULL
    `, [id, spouseId]);

    await pool.query(`
      UPDATE members
      SET level = (SELECT level FROM members WHERE id = $2 AND gender = 'Male')
      WHERE id = $1 AND gender = 'Female' AND (SELECT level FROM members WHERE id = $2 AND gender = 'Male') IS NOT NULL
    `, [id, spouseId]);

    res.json({ message: 'Spouse relationship added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

exports.getOccupations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT occupation FROM members 
       WHERE occupation IS NOT NULL AND TRIM(occupation) != '' 
       ORDER BY occupation ASC`
    );
    const occupations = result.rows.map(r => r.occupation.trim()).filter(Boolean);
    res.json(occupations);
  } catch (err) {
    console.error('Error fetching occupations:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
