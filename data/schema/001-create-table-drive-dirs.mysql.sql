CREATE TABLE drive_dirs (

    dir_id          INTEGER PRIMARY KEY AUTO_INCREMENT,

    -- obsolete: identyfikator dysku, w obrebie ktorego znajduje sie ten katalog
    drive_id        INTEGER,

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
    ctime           BIGINT NOT NULL,

    -- czas ostatniej zmiany (nazwa, uprawnienia)
    mtime           BIGINT NOT NULL,

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

    -- VARCHAR(191) because of UNIQUE index
    name            VARCHAR(191) NOT NULL,

    -- znormalizowana nazwa uzywana do sortowania
    name_normalized VARCHAR(1023) NOT NULL,

    INDEX drive_dirs_owner_idx (owner),

    CONSTRAINT drive_dirs_owner_fkey
        FOREIGN KEY (owner) REFERENCES users (user_id),

    INDEX drive_dirs_created_by_idx (created_by),

    CONSTRAINT drive_dirs_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users (user_id),

    INDEX drive_dirs_modified_by_idx (modified_by),

    CONSTRAINT drive_dirs_modified_by_fkey
        FOREIGN KEY (modified_by) REFERENCES users (user_id),

    -- indeks pilnujacy, zeby katalogi mialy unikatowe nazwy jezeli naleza
    -- do tego samego katalogu nadrzednego, przy okazji wspomagajacy klucz
    -- obcy oraz wyszukiwanie katalogu po nazwie
    UNIQUE INDEX drive_dirs_parent_id_name_idx (parent_id, name),

    CONSTRAINT drive_dirs_parent_id_fkey
        FOREIGN KEY (parent_id)
        REFERENCES drive_dirs (dir_id),

    -- indeks zapewniajacy unikatowosc internal_name
    UNIQUE INDEX drive_dirs_internal_name_idx (internal_name)

) ENGINE=InnoDB CHARACTER SET utf8mb4;


-- uprawnienia dostepu do katalogu
CREATE TABLE drive_dir_shares (

    dir_id          INTEGER NOT NULL,

    user_id         INTEGER NOT NULL,

    -- Avoid BIT type due to problems with client libraries such as PDO.
    -- Spare yourself a lot of trouble if you use TINYINT(1) instead.
    -- czy uzytkownik moze modyfikowac zawartosc katalogu
    -- (edytowac i usuwac pliki)
    can_write       TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (dir_id, user_id),

    CONSTRAINT drive_dir_shares_dir_id_fkey
        FOREIGN KEY (dir_id) REFERENCES drive_dirs (dir_id),

    CONSTRAINT drive_dir_shares_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (user_id)

) ENGINE=InnoDB CHARACTER SET utf8mb4;


-- dodatkowy indeks do szybkiego sprawdzania, czy dany uzytkownik ma
-- dostep do udostepnionych katalogow
CREATE INDEX drive_dir_shares_user_id_idx
    ON drive_dir_shares (user_id);

