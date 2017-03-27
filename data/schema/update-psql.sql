ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_system SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_readonly SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_hidden SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE {PREFIX}drive_dirs ADD COLUMN system_count INTEGER NOT NULL DEFAULT 0 CHECK (system_count >= 0);

ALTER TABLE {PREFIX}drive_dirs ADD COLUMN handler VARCHAR(32);

ALTER TABLE {PREFIX}drive_dirs DROP CONSTRAINT euhit_drive_dirs_drive_id_fkey;
ALTER TABLE {PREFIX}drive_dirs DROP CONSTRAINT euhit_drive_dirs_drive_id_parent_id_fkey;
ALTER TABLE {PREFIX}drive_dirs DROP CONSTRAINT euhit_drive_dirs_drive_id_dir_id_idx;

ALTER TABLE {PREFIX}drive_dirs ALTER COLUMN drive_id DROP NOT NULL;

-- http://stackoverflow.com/questions/643690/maximum-mimetype-length-when-storing-type-in-db
ALTER TABLE {PREFIX}drive_files ALTER COLUMN mimetype TYPE VARCHAR(128);
