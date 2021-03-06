ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_system SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_readonly SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_hidden SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE {PREFIX}drive_dirs ADD COLUMN system_count INTEGER NOT NULL DEFAULT 0 CHECK (system_count >= 0);

ALTER TABLE {PREFIX}drive_dirs ADD COLUMN handler VARCHAR(32);

ALTER TABLE {PREFIX}drive_dirs DROP CONSTRAINT {PREFIX}drive_dirs_drive_id_fkey;
ALTER TABLE {PREFIX}drive_dirs DROP CONSTRAINT {PREFIX}drive_dirs_drive_id_parent_id_fkey;
ALTER TABLE {PREFIX}drive_dirs DROP CONSTRAINT {PREFIX}drive_dirs_drive_id_dir_id_idx;

ALTER TABLE {PREFIX}drive_dirs ALTER COLUMN drive_id DROP NOT NULL;

-- http://stackoverflow.com/questions/643690/maximum-mimetype-length-when-storing-type-in-db
ALTER TABLE {PREFIX}drive_files ALTER COLUMN mimetype TYPE VARCHAR(128);

-- 2019-01-06
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN max_byte_size BIGINT NOT NULL DEFAULT 0 CHECK (max_byte_size >= 0);

-- 2019-03-10 Drop uniqueness on drive owner
ALTER TABLE {PREFIX}drives DROP CONSTRAINT {PREFIX}drives_owner_idx;
