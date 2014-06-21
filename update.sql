ALTER TABLE {PREFIX}drive_dirs ADD COLUMN name_normalized VARCHAR(1023);
UPDATE {PREFIX}drive_dirs SET name_normalized = LOWER(name);
ALTER TABLE {PREFIX}drive_dirs ALTER COLUMN name_normalized SET NOT NULL;

ALTER TABLE {PREFIX}drive_files ADD COLUMN name_normalized VARCHAR(1023);
UPDATE {PREFIX}drive_files SET name_normalized = LOWER(name);
ALTER TABLE {PREFIX}drive_files ALTER COLUMN name_normalized SET NOT NULL;
