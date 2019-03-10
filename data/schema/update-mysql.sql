ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_system TINYINT(1) NOT NULL DEFAULT 0 AFTER parent_id;
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_readonly TINYINT(1) NOT NULL DEFAULT 0 AFTER is_system;
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0 AFTER is_readonly;

ALTER TABLE {PREFIX}drive_dirs ADD COLUMN system_count INTEGER UNSIGNED NOT NULL DEFAULT 0 AFTER is_hidden;

ALTER TABLE {PREFIX}drive_dirs ADD COLUMN handler VARCHAR(32);

ALTER TABLE {PREFIX}drive_dirs DROP FOREIGN KEY drive_dirs_drive_id_fkey;
ALTER TABLE {PREFIX}drive_dirs DROP FOREIGN KEY drive_dirs_drive_id_parent_id_fkey;
ALTER TABLE {PREFIX}drive_dirs DROP INDEX drive_dirs_drive_id_dir_id_idx;
 
ALTER TABLE {PREFIX}drive_dirs MODIFY COLUMN drive_id INTEGER NULL;

-- http://stackoverflow.com/questions/643690/maximum-mimetype-length-when-storing-type-in-db
ALTER TABLE {PREFIX}drive_files MODIFY COLUMN mimetype VARCHAR(128) NOT NULL;

-- 2019-01-06
ALTER TABLE {PREFIX}drive_dirs ADD COLUMN max_byte_size BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER byte_count;

-- 2019-03-10 Drop uniqueness on drive owner
ALTER TABLE {PREFIX}drives DROP FOREIGN KEY {PREFIX}drives_owner_fkey;
ALTER TABLE {PREFIX}drives DROP INDEX {PREFIX}drives_owner_idx;
CREATE INDEX {PREFIX}drives_owner_idx ON {PREFIX}drives (owner);
