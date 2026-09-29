-- Migration 017: Fix Cascade Soft Delete Trigger for Locations and Members
-- Ensures that when a geographic area (country, division, district, upazila, village, home)
-- is soft-deleted or restored, all associated members are consistently deleted/restored together.

BEGIN;

CREATE OR REPLACE FUNCTION cascade_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle Soft Delete (deleted_at goes from NULL to a timestamp)
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        IF TG_TABLE_NAME = 'countries' THEN
            UPDATE divisions SET deleted_at = NEW.deleted_at WHERE country_id = NEW.id AND deleted_at IS NULL;
            UPDATE members SET deleted_at = NEW.deleted_at WHERE country_id = NEW.id AND deleted_at IS NULL;
        ELSIF TG_TABLE_NAME = 'divisions' THEN
            UPDATE districts SET deleted_at = NEW.deleted_at WHERE division_id = NEW.id AND deleted_at IS NULL;
            UPDATE members SET deleted_at = NEW.deleted_at WHERE division_id = NEW.id AND deleted_at IS NULL;
        ELSIF TG_TABLE_NAME = 'districts' THEN
            UPDATE upazilas SET deleted_at = NEW.deleted_at WHERE district_id = NEW.id AND deleted_at IS NULL;
            UPDATE members SET deleted_at = NEW.deleted_at WHERE district_id = NEW.id AND deleted_at IS NULL;
        ELSIF TG_TABLE_NAME = 'upazilas' THEN
            UPDATE villages SET deleted_at = NEW.deleted_at WHERE upazila_id = NEW.id AND deleted_at IS NULL;
            UPDATE members SET deleted_at = NEW.deleted_at WHERE upazila_id = NEW.id AND deleted_at IS NULL;
        ELSIF TG_TABLE_NAME = 'villages' THEN
            UPDATE homes SET deleted_at = NEW.deleted_at WHERE village_id = NEW.id AND deleted_at IS NULL;
            UPDATE members SET deleted_at = NEW.deleted_at WHERE village_id = NEW.id AND deleted_at IS NULL;
        ELSIF TG_TABLE_NAME = 'homes' THEN
            UPDATE members SET deleted_at = NEW.deleted_at WHERE home_id = NEW.id AND deleted_at IS NULL;
        END IF;
    
    -- Handle Restore (deleted_at goes from a timestamp to NULL)
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
        IF TG_TABLE_NAME = 'countries' THEN
            UPDATE divisions SET deleted_at = NULL WHERE country_id = NEW.id;
            UPDATE members SET deleted_at = NULL WHERE country_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'divisions' THEN
            UPDATE districts SET deleted_at = NULL WHERE division_id = NEW.id;
            UPDATE members SET deleted_at = NULL WHERE division_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'districts' THEN
            UPDATE upazilas SET deleted_at = NULL WHERE district_id = NEW.id;
            UPDATE members SET deleted_at = NULL WHERE district_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'upazilas' THEN
            UPDATE villages SET deleted_at = NULL WHERE upazila_id = NEW.id;
            UPDATE members SET deleted_at = NULL WHERE upazila_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'villages' THEN
            UPDATE homes SET deleted_at = NULL WHERE village_id = NEW.id;
            UPDATE members SET deleted_at = NULL WHERE village_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'homes' THEN
            UPDATE members SET deleted_at = NULL WHERE home_id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
