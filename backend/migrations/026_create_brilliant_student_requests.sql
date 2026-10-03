-- Migration 026: Create brilliant_student_requests table
BEGIN;

CREATE TABLE IF NOT EXISTS brilliant_student_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    applicant_name VARCHAR(255),
    applicant_email VARCHAR(255),
    applicant_phone VARCHAR(50),
    applicant_role VARCHAR(50) DEFAULT 'user',
    applicant_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    exam_year VARCHAR(20) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    subject_department VARCHAR(255),
    result_grade VARCHAR(100),
    document_url TEXT,
    document_type VARCHAR(50),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_note TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE brilliant_student_requests ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(255);
ALTER TABLE brilliant_student_requests ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(255);
ALTER TABLE brilliant_student_requests ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR(50);
ALTER TABLE brilliant_student_requests ADD COLUMN IF NOT EXISTS applicant_role VARCHAR(50) DEFAULT 'user';
ALTER TABLE brilliant_student_requests ADD COLUMN IF NOT EXISTS applicant_member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brilliant_student_requests_status ON brilliant_student_requests(status);
CREATE INDEX IF NOT EXISTS idx_brilliant_student_requests_member ON brilliant_student_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_brilliant_student_requests_user ON brilliant_student_requests(applicant_user_id);

COMMIT;
