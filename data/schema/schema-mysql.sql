-- maniple-drive database schema for MySQL
-- Version: 2014-06-27

-- sed 's/{PREFIX}/prefix/g' schema-mysql.sql | mysql

SET NAMES utf8;

-- Dyski
CREATE TABLE {PREFIX}drives (

    drive_id        INTEGER PRIMARY KEY AUTO_INCREMENT,

    -- identyfikator katalogu - korzenia dysku, unikatowy, NULL dopuszczalny
    -- ze wzgledu na cykliczna zaleznosc dysk-katalog
    root_dir        INTEGER,

    -- ilosc miejsca zajmowanego _na dysku_ przez pliki i katalogi znajdujace
    -- sie w obrebie tego dysku (konieczne jest znanie rozmiaru bloku, w NTFS
    -- domyslnie jest to 4096 B). Jezeli fizyczny rozmiar bloku dysku nie jest
    -- znany do obliczen trzeba uzyc 1, wtedy liczone bedzie zuzycie na
    -- podstawie rozmiarow plikow, a nie miejsca zajmowanego na dysku (przy
    -- okazji, USAGE jest zarezerwowanym slowem w MySQL 5.1, PostgreSQL i DB2)

    -- ograniczenie zuzycia miejsca na dysku
    quota           BIGINT UNSIGNED NOT NULL DEFAULT 0,

    owner           INTEGER,

    created_by      INTEGER,

    create_time     DATETIME NOT NULL,

    modified_by     INTEGER,

    modify_time     DATETIME,

    -- opcjonalny opis dysku
    description     TEXT,

    UNIQUE INDEX {PREFIX}drives_root_dir_idx (root_dir),

    -- uzytkownicy moga miec co najwyzej jeden dysk
    UNIQUE INDEX {PREFIX}drives_owner_idx (owner),

    CONSTRAINT {PREFIX}drives_owner_fkey
        FOREIGN KEY (owner) REFERENCES {PREFIX}users (user_id),

    INDEX {PREFIX}drives_created_by_idx (created_by),

    CONSTRAINT {PREFIX}drives_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES {PREFIX}users (user_id),

    INDEX {PREFIX}drives_modified_by_idx (modified_by),

    CONSTRAINT {PREFIX}drives_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES {PREFIX}users (user_id)

) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;


-- Katalogi w obrebie dyskow internetowych, opisuja uprawnienia
-- do katalogow i plikow
CREATE TABLE {PREFIX}drive_dirs (

    dir_id          INTEGER PRIMARY KEY AUTO_INCREMENT,

    -- identyfikator dysku, w obrebie ktorego znajduje sie ten katalog
    drive_id        INTEGER NOT NULL,

    -- parent directory id
    parent_id       INTEGER,

    -- directory flags
    is_system       TINYINT(1) NOT NULL DEFAULT 0,

    is_readonly     TINYINT(1) NOT NULL DEFAULT 0,

    is_hidden       TINYINT(1) NOT NULL DEFAULT 0,

    -- number of system subdirs and files in this directory
    system_count    INTEGER UNSIGNED NOT NULL DEFAULT 0,

    -- number of subdirs, files and file bytes in this directory
    dir_count       INTEGER UNSIGNED NOT NULL DEFAULT 0,

    file_count      INTEGER UNSIGNED NOT NULL DEFAULT 0,

    byte_count      BIGINT UNSIGNED NOT NULL DEFAULT 0,

    max_byte_size   BIGINT UNSIGNED NOT NULL DEFAULT 0,

    owner           INTEGER,

    -- czas utworzenia katalogu
    ctime           INTEGER NOT NULL,

    -- czas ostatniej zmiany (nazwa, uprawnienia)
    mtime           INTEGER NOT NULL,

    -- id uzytkownika, ktory wgral plik
    created_by      INTEGER,

    -- id uzytkownika, ktory zmodyfikowal dane
    modified_by     INTEGER,

    -- ustawienia dostepu do plikow w katalogu
    -- private    - widoczne tylko dla wlasciciela i uzytkownikow wymienionych
    --              w tabeli drive_dir_shares
    -- usersonly  - dostepne dla zalogowanych uzytkownikow
    -- public     - dostepne dla wszystkich (internet)
    -- inherited  - dziedziczony dostep do plikow z katalogu nadrzednego, o ile
    --              nie podano jawnie katalog w korzeniu dysku jest prywatny
    visibility      VARCHAR(32) NOT NULL,

    -- typ zawartosci katalogu, np. obrazy, dokumenty, muzyka
    dir_type        VARCHAR(32),

    -- identyfikator handlera odpowiadajacego za zarzadzanie tym katalogiem
    -- katalogi z niepusta wartoscia sa powiazane z rekordami innych tabel
    -- i nie moga byc usuwane z poziomu browsera
    handler         VARCHAR(32),

    -- unikatowy identyfikator dla katalogow zarzadzanych przez moduly
    -- aplikacji, NULL dla katalogow zarzadzanych przez uzytkownika
    internal_name   VARCHAR(64),

    name            VARCHAR(255) NOT NULL,

    -- znormalizowana nazwa uzywana do sortowania
    name_normalized VARCHAR(1023) NOT NULL,

    INDEX {PREFIX}drive_dirs_drive_id_idx (drive_id),

    CONSTRAINT {PREFIX}drive_dirs_drive_id_fkey
        FOREIGN KEY (drive_id) REFERENCES {PREFIX}drives (drive_id),

    INDEX {PREFIX}drive_dirs_owner_idx (owner),

    CONSTRAINT {PREFIX}drive_dirs_owner_fkey
        FOREIGN KEY (owner) REFERENCES {PREFIX}users (user_id),

    INDEX {PREFIX}drive_dirs_created_by_idx (created_by),

    CONSTRAINT {PREFIX}drive_dirs_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES {PREFIX}users (user_id),

    INDEX {PREFIX}drive_dirs_modified_by_idx (modified_by),

    CONSTRAINT {PREFIX}drive_dirs_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES {PREFIX}users (user_id),

    -- indeks pilnujacy, zeby katalogi mialy unikatowe nazwy jezeli naleza
    -- do tego samego katalogu nadrzednego, przy okazji wspomagajacy klucz
    -- obcy oraz wyszukiwanie katalogu po nazwie
    UNIQUE INDEX {PREFIX}drive_dirs_parent_id_name_idx (parent_id, name),

    -- ten indeks wynika bezposrednio z unikatowosci dir_id, ale jest potrzebny
    -- do zapewnienia, ze wszystkie katalogi w poddrzewie naleza do tego samego
    -- dysku,
    -- drive_id jest w pierwszej kolumnie, zeby latwo wylawiac katalogi
    -- znajdujace sie w obrebie tego samego dysku
    UNIQUE INDEX {PREFIX}drive_dirs_drive_id_dir_id_idx (drive_id, dir_id),

    CONSTRAINT {PREFIX}drive_dirs_drive_id_parent_id_fkey
        FOREIGN KEY (drive_id, parent_id)
        REFERENCES {PREFIX}drive_dirs (drive_id, dir_id),

    -- indeks zapewniajacy unikatowosc internal_name
    UNIQUE INDEX {PREFIX}drive_dirs_internal_name_idx (internal_name)

) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;

ALTER TABLE {PREFIX}drives ADD CONSTRAINT {PREFIX}drives_root_dir_fkey
    FOREIGN KEY (root_dir) REFERENCES {PREFIX}drive_dirs (dir_id);


-- uprawnienia dostepu do katalogu
CREATE TABLE {PREFIX}drive_dir_shares (

    dir_id          INTEGER NOT NULL,

    user_id         INTEGER NOT NULL,

    -- Avoid BIT type due to problems with client libraries such as PDO.
    -- Spare yourself a lot of trouble if you use TINYINT(1) instead.
    -- czy uzytkownik moze modyfikowac zawartosc katalogu
    -- (edytowac i usuwac pliki)
    can_write       TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (dir_id, user_id),

    CONSTRAINT {PREFIX}drive_dir_shares_dir_id_fkey
        FOREIGN KEY (dir_id) REFERENCES {PREFIX}drive_dirs (dir_id),

    CONSTRAINT {PREFIX}drive_dir_shares_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES {PREFIX}users (user_id)

) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;

-- dodatkowy indeks do szybkiego sprawdzania, czy dany uzytkownik ma
-- dostep do udostepnionych katalogow
CREATE INDEX {PREFIX}drive_dir_shares_user_id_idx
    ON {PREFIX}drive_dir_shares (user_id);


-- pliki umieszczone w katalogach
CREATE TABLE {PREFIX}drive_files (

    file_id         INTEGER PRIMARY KEY AUTO_INCREMENT,

    -- id katalogu, w ktorym umieszczony jest plik
    dir_id          INTEGER NOT NULL,

    -- wlasciciel pliku
    owner           INTEGER,

    -- data utworzenia pliku na dysku
    ctime           INTEGER NOT NULL,

    -- data ostatniej modyfikacji metadanych (sam plik jest niemutowalny)
    mtime           INTEGER NOT NULL,

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

    -- nazwa pliku
    name            VARCHAR(255) NOT NULL,

    -- znormalizowana nazwa pliku uzywana do sortowania
    name_normalized VARCHAR(1023) NOT NULL,

    -- metadane wykorzystywane przez rozne moduly strony
    -- tytul pliku
    title           VARCHAR(255),

    -- autor pliku (opcjonalny)
    author          VARCHAR(255),

    -- waga pliku (sortowanie)
    weight          INTEGER NOT NULL DEFAULT 0,

    -- opis pliku (opcjonalny)
    -- Uwaga odnosnie do maksymalnego rozmiaru VARCHAR(65535) z dokumentacji:
    -- http://dev.mysql.com/doc/refman/5.0/en/column-count-limit.html
    --   Every table (regardless of storage engine) has a maximum row size of
    --   65,535 bytes. Storage engines may place additional constraints on this
    --   limit, reducing the effective maximum row size.
    description     VARCHAR(65535),

    INDEX {PREFIX}drive_files_owner_idx (owner),

    CONSTRAINT {PREFIX}drive_files_owner_fkey
        FOREIGN KEY (owner) REFERENCES {PREFIX}users (user_id),

    INDEX {PREFIX}drive_files_created_by_idx (created_by),

    CONSTRAINT {PREFIX}drive_files_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES {PREFIX}users (user_id),

    INDEX {PREFIX}drive_files_modified_by_idx (modified_by),

    CONSTRAINT {PREFIX}drive_files_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES {PREFIX}users (user_id),

    INDEX {PREFIX}drive_files_dir_id_idx (dir_id),

    CONSTRAINT {PREFIX}drive_files_dir_id_fkey
        FOREIGN KEY (dir_id) REFERENCES {PREFIX}drive_dirs (dir_id)

) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;

-- unikatowosc nazwy pliku w obrebie jednego katalogu nie jest wymagana
-- (dla katalogow jest ze wzgledu na wyszukiwanie pliku po sciezce)

CREATE INDEX {PREFIX}drive_files_dir_id_name_idx
    ON {PREFIX}drive_files (dir_id, name);

CREATE INDEX {PREFIX}drive_files_filter_idx 
    ON {PREFIX}drive_files (filter);


CREATE TABLE {PREFIX}drive_file_metas (

    file_meta_id  INTEGER PRIMARY KEY AUTO_INCREMENT,

    file_id       INTEGER NOT NULL,

    name          VARCHAR(255) NOT NULL,

    value         TEXT,

    CONSTRAINT {PREFIX}drive_file_metas_file_id_fkey
        FOREIGN KEY (file_id) REFERENCES {PREFIX}drive_files (file_id),

    UNIQUE INDEX {PREFIX}drive_file_metas_file_meta_id_name_idx (file_meta_id, name)

) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
