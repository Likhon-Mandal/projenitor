const { pool } = require('../config/db');
const { deleteMultipleMediaFiles } = require('../utils/cloudinaryHelper');

/**
 * Submit a new brilliant student recognition request
 * Anyone logged in (User, Admin, SuperAdmin) can submit for themselves or another member
 */
exports.submitRequest = async (req, res) => {
    try {
        const {
            member_id,
            achievement_type,
            exam_year,
            institution,
            subject_department,
            result_grade,
            document_url,
            document_type,
            documents,
            description
        } = req.body;

        if (!member_id) {
            return res.status(400).json({ error: 'Candidate member is required' });
        }
        if (!achievement_type || !achievement_type.trim()) {
            return res.status(400).json({ error: 'Achievement type is required' });
        }
        if (!exam_year || !exam_year.trim()) {
            return res.status(400).json({ error: 'Exam or passing year is required' });
        }
        if (!institution || !institution.trim()) {
            return res.status(400).json({ error: 'Institution or university name is required' });
        }

        // Verify candidate member exists
        const memberCheck = await pool.query('SELECT id, full_name, name_bangla, name_english FROM members WHERE id = $1 AND deleted_at IS NULL', [member_id]);
        if (memberCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate member record not found' });
        }

        // Check if an identical request is already pending
        const existingPending = await pool.query(
            `SELECT id FROM brilliant_student_requests 
             WHERE member_id = $1 AND achievement_type = $2 AND exam_year = $3 AND status = 'pending'`,
            [member_id, achievement_type.trim(), exam_year.trim()]
        );
        if (existingPending.rows.length > 0) {
            return res.status(400).json({ 
                error: 'এই সদস্যের জন্য এই অর্জনের একটি আবেদন ইতিমধ্যে পর্যালোচনাধীন রয়েছে।' 
            });
        }

        // Normalize multiple documents
        let normalizedDocs = [];
        if (Array.isArray(documents) && documents.length > 0) {
            normalizedDocs = documents.map(d => ({
                url: d.url || d.fileUrl || d.filePath || '',
                type: d.type || (d.url && d.url.toLowerCase().endsWith('.pdf') ? 'document' : 'photo'),
                name: d.name || 'Document',
                size: d.size || ''
            })).filter(d => !!d.url);
        } else if (document_url) {
            normalizedDocs = [{
                url: document_url,
                type: document_type || (document_url.toLowerCase().endsWith('.pdf') ? 'document' : 'photo'),
                name: 'Document 1',
                size: ''
            }];
        }

        const primaryDocUrl = normalizedDocs[0]?.url || document_url || null;
        const primaryDocType = normalizedDocs.length > 1 ? 'multiple' : (normalizedDocs[0]?.type || document_type || 'photo');

        // Resolve applicant info from authenticated user
        const applicantUserId = (req.user?.id && typeof req.user.id === 'string' && req.user.id.trim()) ? req.user.id.trim() : null;
        const applicantName = req.user?.name || req.user?.full_name || 'Member';
        const applicantEmail = req.user?.email || null;
        const applicantPhone = req.user?.mobile_number || null;
        const applicantRole = req.user?.role || 'user';
        const applicantMemberId = (req.user?.member_id && typeof req.user.member_id === 'string' && req.user.member_id.trim()) ? req.user.member_id.trim() : null;

        const insertQuery = `
            INSERT INTO brilliant_student_requests (
                applicant_user_id, applicant_name, applicant_email, applicant_phone, applicant_role, applicant_member_id,
                member_id, achievement_type, exam_year, institution, subject_department, result_grade,
                document_url, document_type, documents, description, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, 'pending'
            )
            RETURNING *;
        `;

        const values = [
            applicantUserId,
            applicantName,
            applicantEmail,
            applicantPhone,
            applicantRole,
            applicantMemberId,
            member_id,
            achievement_type.trim(),
            exam_year.trim(),
            institution.trim(),
            subject_department ? subject_department.trim() : null,
            result_grade ? result_grade.trim() : null,
            primaryDocUrl,
            primaryDocType,
            JSON.stringify(normalizedDocs),
            description ? description.trim() : null
        ];

        const result = await pool.query(insertQuery, values);

        res.status(201).json({
            message: 'কৃতি শিক্ষার্থী স্বীকৃতির আবেদনটি সফলভাবে পাঠানো হয়েছে!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error submitting brilliant student request:', err);
        res.status(500).json({ error: 'Server error submitting request' });
    }
};

/**
 * Get all requests submitted by the logged in user
 */
exports.getMyRequests = async (req, res) => {
    try {
        const userId = (req.user?.id && typeof req.user.id === 'string' && req.user.id.trim()) ? req.user.id.trim() : null;
        const userEmail = req.user?.email || '';
        const userMemberId = (req.user?.member_id && typeof req.user.member_id === 'string' && req.user.member_id.trim()) ? req.user.member_id.trim() : null;

        let query = `
            SELECT r.*,
                   m.full_name as member_name,
                   m.name_bangla as member_name_bangla,
                   m.name_english as member_name_english,
                   m.profile_image_url as member_profile_image,
                   m.village_id,
                   v.name as member_village,
                   f.full_name as member_father_name
            FROM brilliant_student_requests r
            JOIN members m ON r.member_id = m.id
            LEFT JOIN villages v ON m.village_id = v.id
            LEFT JOIN members f ON m.father_id = f.id
            WHERE (r.applicant_user_id = $1 OR (r.applicant_email IS NOT NULL AND LOWER(r.applicant_email) = LOWER($2)))
        `;
        const params = [userId, userEmail];

        if (userMemberId) {
            params.push(userMemberId);
            query += ` OR (r.member_id = $3 OR r.applicant_member_id = $3)`;
        }

        query += ` ORDER BY r.created_at DESC;`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user brilliant student requests:', err);
        res.status(500).json({ error: 'Server error fetching your requests' });
    }
};

/**
 * Get all requests for Admin / SuperAdmin
 */
exports.getAllRequestsAdmin = async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT r.*,
                   m.full_name as member_name,
                   m.name_bangla as member_name_bangla,
                   m.name_english as member_name_english,
                   m.profile_image_url as member_profile_image,
                   m.village_id,
                   v.name as member_village,
                   f.full_name as member_father_name,
                   m.level as member_level,
                   am.id as applicant_resolved_member_id,
                   am.full_name as applicant_member_name,
                   am.name_bangla as applicant_member_name_bangla,
                   am.name_english as applicant_member_name_english,
                   am.profile_image_url as applicant_profile_image,
                   av.name as applicant_member_village,
                   af.full_name as applicant_member_father_name,
                   am.level as applicant_member_level
            FROM brilliant_student_requests r
            JOIN members m ON r.member_id = m.id
            LEFT JOIN villages v ON m.village_id = v.id
            LEFT JOIN members f ON m.father_id = f.id
            LEFT JOIN users u ON r.applicant_user_id::text = u.id::text
            LEFT JOIN admin_users au ON r.applicant_user_id::text = au.id::text
            LEFT JOIN members am ON COALESCE(r.applicant_member_id, u.member_id, au.member_id) = am.id
            LEFT JOIN villages av ON am.village_id = av.id
            LEFT JOIN members af ON am.father_id = af.id
        `;

        const params = [];
        if (status && status !== 'all') {
            params.push(status);
            query += ` WHERE r.status = $1`;
        }

        query += ` ORDER BY r.created_at DESC;`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin brilliant student requests:', err);
        res.status(500).json({ error: 'Server error fetching requests' });
    }
};

/**
 * Approve or Reject a brilliant student request (Admin / SuperAdmin)
 */
exports.handleRequestAction = async (req, res) => {
    const { id } = req.params;
    const { action, admin_note, custom_title } = req.body;

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch request
        const requestRes = await client.query('SELECT * FROM brilliant_student_requests WHERE id = $1', [id]);
        if (requestRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestRes.rows[0];

        if (action === 'approve') {
            // Update request status
            await client.query(
                `UPDATE brilliant_student_requests 
                 SET status = 'approved', admin_note = $1, reviewed_by = $2, reviewed_at = NOW() 
                 WHERE id = $3`,
                [admin_note || 'অনুমোদিত', req.user?.id || null, id]
            );

            // Compose eminent figure title if not customized
            let title = custom_title ? custom_title.trim() : '';
            if (!title) {
                const parts = [];
                if (request.subject_department) {
                    parts.push(`${request.achievement_type} (${request.subject_department})`);
                } else if (request.result_grade) {
                    parts.push(`${request.achievement_type} (${request.result_grade})`);
                } else {
                    parts.push(request.achievement_type);
                }

                if (request.institution) {
                    parts.push(request.institution);
                }
                if (request.exam_year) {
                    parts.push(`(${request.exam_year})`);
                }
                title = parts.join(' - ');
            }

            // Insert into eminent_figures under 'কৃতি শিক্ষার্থী'
            await client.query(
                `INSERT INTO eminent_figures (member_id, category, title, reason, institution)
                 VALUES ($1, 'কৃতি শিক্ষার্থী', $2, $3, $4)
                 ON CONFLICT (member_id, category) 
                 DO UPDATE SET title = EXCLUDED.title, reason = EXCLUDED.reason, institution = EXCLUDED.institution`,
                [request.member_id, title, request.achievement_type, request.institution]
            );

            await client.query('COMMIT');
            return res.json({ 
                message: 'আবেদনটি সফলভাবে অনুমোদন করা হয়েছে এবং কৃতি শিক্ষার্থী তালিকায় যুক্ত হয়েছে!',
                status: 'approved'
            });
        } else {
            // Action is reject
            await client.query(
                `UPDATE brilliant_student_requests 
                 SET status = 'rejected', admin_note = $1, reviewed_by = $2, reviewed_at = NOW() 
                 WHERE id = $3`,
                [admin_note || 'প্রত্যাখ্যাত', req.user?.id || null, id]
            );

            await client.query('COMMIT');
            return res.json({ 
                message: 'আবেদনটি প্রত্যাখ্যান করা হয়েছে।',
                status: 'rejected'
            });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error handling brilliant student request action:', err);
        res.status(500).json({ error: 'Server error processing request action' });
    } finally {
        client.release();
    }
};

/**
 * Delete a request (Admin / SuperAdmin)
 */
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM brilliant_student_requests WHERE id = $1 RETURNING document_url, documents', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const deleted = result.rows[0];
        const urlsToClean = [];
        if (deleted.document_url) urlsToClean.push(deleted.document_url);
        if (Array.isArray(deleted.documents)) {
            deleted.documents.forEach(doc => {
                if (doc && doc.url) urlsToClean.push(doc.url);
            });
        }

        if (urlsToClean.length > 0) {
            deleteMultipleMediaFiles(urlsToClean).catch(e => console.error('Error cleaning student request documents:', e));
        }

        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        console.error('Error deleting brilliant student request:', err);
        res.status(500).json({ error: 'Server error deleting request' });
    }
};
