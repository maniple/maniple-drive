-- maniple-drive database schema
-- Version: 2014-05-14

-- Dyski
CREATE TABLE {PREFIX}drives (

    drive_id        SERIAL PRIMARY KEY,

    -- identyfikator katalogu - korzenia dysku, unikalny, NULL dopuszczalny
    -- ze wzgledu na cykliczna zaleznosc dysk-katalog
    root_dir        INTEGER,

    -- ilosc miejsca zajmowanego _na dysku_ przez pliki i katalogi znajdujace
    -- sie w obrebie tego dysku (konieczne jest znanie rozmiaru bloku, w NTFS
    -- domyslnie jest to 4096 B). Jezeli fizyczny rozmiar bloku dysku nie jest
    -- znany do obliczen trzeba uzyc 1, wtedy liczone bedzie zuzycie na
    -- podstawie rozmiarow plikow, a nie miejsca zajmowanego na dysku (przy
    -- okazji, USAGE jest zarezerwowanym slowem w MySQL 5.1, PostgreSQL i DB2)

    -- wykorzystanie miejsca na dysku
    disk_usage      BIGINT NOT NULL DEFAULT 0 CHECK (disk_usage >= 0),

    -- ograniczenie
    quota           BIGINT NOT NULL DEFAULT 0 CHECK (quota >= 0),

    owner           INTEGER NOT NULL,

    created_by      INTEGER NOT NULL,

    create_time     TIMESTAMP WITH TIME ZONE NOT NULL,

    modified_by     INTEGER,

    modify_time     TIMESTAMP WITH TIME ZONE,

    -- opcjonalny opis dysku
    description     VARCHAR(255),

    CONSTRAINT {PREFIX}drives_root_dir_idx UNIQUE (root_dir),

    CONSTRAINT {PREFIX}drives_owner_fkey
        FOREIGN KEY (owner) REFERENCES {PREFIX}users (user_id),

    CONSTRAINT {PREFIX}drives_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES {PREFIX}users (user_id),

    CONSTRAINT {PREFIX}drives_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES {PREFIX}users (user_id)

);


-- Katalogi w obrebie dyskow internetowych, opisuja uprawnienia
-- do katalogow i plikow
CREATE TABLE {PREFIX}drive_dirs (

    dir_id          SERIAL PRIMARY KEY,

    -- identyfikator dysku, w obrebie ktorego znajduje sie ten katalog,
    -- redundancja ulatwiajaca aktualizacje zuzycia miejsca na dysku
    drive_id        INTEGER NOT NULL,

    -- identyfikator nadrzednego katalogu
    parent_id       INTEGER,

    -- liczba plikow i podkatalogow umieszczonych bezposrednio w tym katalogu
    dir_count       INTEGER NOT NULL DEFAULT 0 CHECK (dir_count >= 0),

    file_count      INTEGER NOT NULL DEFAULT 0 CHECK (file_count >= 0),

    owner           INTEGER NOT NULL,

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
    visibility      VARCHAR(16) NOT NULL DEFAULT 'inherited'
                    CHECK (
                        visibility IN ('private', 'usersonly', 'public', 'inherited')
                    ),

    name            VARCHAR(255) NOT NULL,

    CONSTRAINT {PREFIX}drive_dirs_drive_id_fkey
        FOREIGN KEY (drive_id) REFERENCES {PREFIX}drives (drive_id),

    CONSTRAINT {PREFIX}drive_dirs_owner_fkey
        FOREIGN KEY (owner) REFERENCES {PREFIX}users (user_id),

    CONSTRAINT {PREFIX}drive_dirs_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES {PREFIX}users (user_id),

    CONSTRAINT {PREFIX}drive_dirs_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES {PREFIX}users (user_id),

    -- indeks pilnujacy, zeby katalogi mialy unikalne nazwy jezeli naleza
    -- do tego samego katalogu nadrzednego, przy okazji wspomagajacy klucz
    -- obcy oraz wyszukiwanie katalogu po nazwie
    CONSTRAINT {PREFIX}drive_dirs_parent_id_name_idx UNIQUE (parent_id, name),

    CONSTRAINT {PREFIX}drive_dirs_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES {PREFIX}drive_dirs (dir_id)

);

ALTER TABLE {PREFIX}drives ADD CONSTRAINT {PREFIX}drives_root_dir_fkey
    FOREIGN KEY (root_dir) REFERENCES {PREFIX}drive_dirs (dir_id);


-- uprawnienia dostepu do katalogu
CREATE TABLE {PREFIX}drive_dir_shares (

    dir_id          INTEGER NOT NULL,

    user_id         INTEGER NOT NULL,

    -- czy uzytkownik moze modyfikowac zawartosc katalogu
    -- (edytowac i usuwac pliki)
    can_write       INTEGER NOT NULL DEFAULT 0 CHECK (can_write IN (0, 1)),

    PRIMARY KEY (dir_id, user_id),

    CONSTRAINT {PREFIX}drive_dir_shares_dir_id_fkey
        FOREIGN KEY (dir_id) REFERENCES {PREFIX}drive_dirs (dir_id),

    CONSTRAINT {PREFIX}drive_dir_shares_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES {PREFIX}users (user_id)

);

CREATE INDEX {PREFIX}drive_dir_shares_dir_id_user_id_idx
    ON {PREFIX}drive_dir_shares (dir_id, user_id);

-- dodatkowy indeks do szybkiego sprawdzania, czy dany uzytkownik ma
-- dostep do udostepnionych katalogow
CREATE INDEX {PREFIX}drive_dir_shares_user_id_idx
    ON {PREFIX}drive_dir_shares (user_id);


-- pliki umieszczone w katalogach
CREATE TABLE {PREFIX}drive_files (

    file_id         SERIAL PRIMARY KEY,

    -- id katalogu wirtualnego, w ktorym umieszczony jest plik
    dir_id          INTEGER NOT NULL,

    -- uzytkownik, ktory wgral plik
    owner           INTEGER NOT NULL,

    -- data utworzenia pliku na dysku
    ctime           INTEGER NOT NULL,

    -- data ostatniej modyfikacji metadanych (sam plik jest niemutowalny)
    mtime           INTEGER NOT NULL,

    -- id uzytkownika, ktory wgral plik
    created_by      INTEGER NOT NULL,

    -- id uzytkownika, ktory zmodyfikowal dane
    modified_by     INTEGER,

    -- suma kontrolna identyfikujaca plik na dysku
    md5sum          CHAR(32) NOT NULL,

    -- typ MIME pliku
    mimetype        VARCHAR(64) NOT NULL,

    -- filtrowanie po kategorii pliku, NOT NULL zeby bylo latwo filtrowac po tej
    -- kolumnie, bez potrzeby sprawdzania IS (NOT) NULL:
    -- (filter <> 'image' OR filter IS NULL) vs (filter <> 'image')
    filter          VARCHAR(16) NOT NULL DEFAULT '',

    -- rozmiar pliku (max 4GB)
    size            INTEGER NOT NULL CHECK (size >= 0),

    -- wirtualna nazwa pliku
    name            VARCHAR(255) NOT NULL,

    -- metadane wykorzystywane przez rozne moduly strony
    -- tytul pliku
    title           VARCHAR(255),

    -- autor pliku (opcjonalny)
    author          VARCHAR(255),

    -- waga pliku (sortowanie)
    weight          INTEGER NOT NULL DEFAULT 0,

    -- opis pliku (opcjonalny)
    description     TEXT,

    CONSTRAINT {PREFIX}drive_files_owner_fkey
        FOREIGN KEY (owner) REFERENCES {PREFIX}users (user_id),

    CONSTRAINT {PREFIX}drive_files_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES {PREFIX}users (user_id),

    CONSTRAINT {PREFIX}drive_files_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES {PREFIX}users (user_id),

    CONSTRAINT {PREFIX}drive_files_dir_id_fkey
        FOREIGN KEY (dir_id) REFERENCES {PREFIX}drive_dirs (dir_id)

);

-- unikalnosc nazwy pliku w obrebie jednego katalogu nie jest wymagana
-- (dla katalogow jest ze wzgledu na wyszukiwanie pliku po sciezce)

CREATE INDEX {PREFIX}drive_files_dir_id_name_idx
    ON {PREFIX}drive_files (dir_id, name);

CREATE INDEX {PREFIX}drive_files_filter_idx 
    ON {PREFIX}drive_files (filter);