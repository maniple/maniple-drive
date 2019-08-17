CREATE TABLE drive_files (

    file_id         INTEGER PRIMARY KEY AUTO_INCREMENT,

    -- id katalogu, w ktorym umieszczony jest plik
    dir_id          INTEGER NOT NULL,

    -- wlasciciel pliku
    owner           INTEGER,

    -- data utworzenia pliku na dysku
    ctime           BIGINT NOT NULL,

    -- data ostatniej modyfikacji metadanych (sam plik jest niemutowalny)
    mtime           BIGINT NOT NULL,

    -- id uzytkownika, ktory wgral plik
    created_by      INTEGER,

    -- id uzytkownika, ktory zmodyfikowal dane
    modified_by     INTEGER,

    -- suma kontrolna identyfikujaca plik na dysku
    md5sum          CHAR(32) NOT NULL,

    -- typ MIME pliku
    mimetype        VARCHAR(128) NOT NULL,

    -- filtrowanie po kategorii pliku, NOT NULL zeby bylo latwo filtrowac po tej
    -- kolumnie, bez potrzeby sprawdzania IS (NOT) NULL:
    -- (filter <> 'image' OR filter IS NULL) vs (filter <> 'image')
    filter          VARCHAR(16) NOT NULL DEFAULT '',

    -- rozmiar pliku (max 4GB)
    size            INTEGER UNSIGNED NOT NULL,

    -- nazwa pliku, VARCHAR(191) because of INDEX
    name            VARCHAR(191) NOT NULL,

    -- znormalizowana nazwa pliku uzywana do sortowania
    name_normalized VARCHAR(1023) NOT NULL,

    -- metadane wykorzystywane przez rozne moduly strony
    -- tytul pliku
    title           VARCHAR(191),

    -- autor pliku (opcjonalny)
    author          VARCHAR(191),

    -- waga pliku (sortowanie)
    weight          INTEGER NOT NULL DEFAULT 0,

    -- opis pliku (opcjonalny)
    description     TEXT,

    INDEX drive_files_owner_idx (owner),

    CONSTRAINT drive_files_owner_fkey
        FOREIGN KEY (owner) REFERENCES users (user_id),

    INDEX drive_files_created_by_idx (created_by),

    CONSTRAINT drive_files_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users (user_id),

    INDEX drive_files_modified_by_idx (modified_by),

    CONSTRAINT drive_files_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES users (user_id),

    INDEX drive_files_dir_id_idx (dir_id),

    CONSTRAINT drive_files_dir_id_fkey
        FOREIGN KEY (dir_id) REFERENCES drive_dirs (dir_id)

) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- unikatowosc nazwy pliku w obrebie jednego katalogu nie jest wymagana
-- (dla katalogow jest ze wzgledu na wyszukiwanie pliku po sciezce)

CREATE INDEX drive_files_dir_id_name_idx
    ON drive_files (dir_id, name);

CREATE INDEX drive_files_filter_idx
    ON drive_files (filter);


CREATE TABLE drive_file_metas (

    file_meta_id  INTEGER PRIMARY KEY AUTO_INCREMENT,

    file_id       INTEGER NOT NULL,

    name          VARCHAR(191) NOT NULL,

    value         TEXT,

    CONSTRAINT drive_file_metas_file_id_fkey
        FOREIGN KEY (file_id) REFERENCES drive_files (file_id),

    UNIQUE INDEX drive_file_metas_file_meta_id_name_idx (file_meta_id, name)

) ENGINE=InnoDB CHARACTER SET utf8mb4;
