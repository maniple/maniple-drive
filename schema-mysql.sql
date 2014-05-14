-- Dyski internetowe dla uzytkownikow

SET NAMES utf8;

-- Dyski
CREATE TABLE drives (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT
-- identyfikator katalogu - korzenia dysku, unikalny, NULL dopuszczalny
-- ze wzgledu na cykliczna zaleznosc dysk-katalog
, root_dir INT
-- ilosc miejsca zajmowanego _na dysku_ przez pliki i katalogi znajdujace
-- sie w obrebie tego dysku (konieczne jest znanie rozmiaru bloku, w NTFS
-- domyslnie jest to 4096 B). Jezeli fizyczny rozmiar bloku dysku nie jest
-- znany do obliczen trzeba uzyc 1, wtedy liczone bedzie zuzycie na
-- podstawie rozmiarow plikow, a nie miejsca zajmowanego na dysku (przy
-- okazji, USAGE jest zarezerwowanym slowem w MySQL 5.1, PostgreSQL i DB2)
, disk_usage BIGINT UNSIGNED NOT NULL DEFAULT 0  -- wykorzystanie miejsca na dysku
, quota BIGINT UNSIGNED NOT NULL DEFAULT 0       -- ograniczenie
, owner INT NOT NULL
, created_by INT NOT NULL
, create_time DATETIME NOT NULL
, modified_by INT
, modify_time DATETIME
, description VARCHAR(255)                       -- opcjonalny opis dysku

, UNIQUE INDEX idx_drives_root_dir (root_dir)
, INDEX idx_drives_owner (owner)
, CONSTRAINT fk_drives_owner FOREIGN KEY (owner) REFERENCES users (id)
, INDEX idx_drives_created_by (created_by)
, CONSTRAINT fk_drives_created_by FOREIGN KEY (created_by) REFERENCES users (id)
, INDEX idx_drives_modified_by (modified_by)
, CONSTRAINT fk_drives_modified_by FOREIGN KEY (modified_by) REFERENCES users (id)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_polish_ci;

-- Katalogi w obrebie dyskow internetowych, opisuja uprawnienia
-- do katalogow i plikow
CREATE TABLE drive_dirs (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT

-- identyfikator dysku, w obrebie ktorego znajduje sie ten katalog,
-- redundancja ulatwiajaca aktualizacje zuzycia miejsca na dysku
, drive_id INT NOT NULL

-- identyfikator nadrzednego katalogu
, parent_id INT

-- liczba plikow i podkatalogow umieszczonych bezposrednio w tym katalogu
, dir_count INT UNSIGNED NOT NULL DEFAULT 0
, file_count INT UNSIGNED NOT NULL DEFAULT 0

, owner INT NOT NULL
, ctime INT UNSIGNED NOT NULL   -- czas utworzenia katalogu
, mtime INT UNSIGNED NOT NULL   -- czas ostatniej zmiany (nazwa, uprawnienia)
, created_by INT  -- id uzytkownika, ktory wgral plik
, modified_by INT -- id uzytkownika, ktory zmodyfikowal dane

-- ustawienia dostepu do plikow w katalogu
-- private   - widoczne tylko dla wlasciciela i uzytkownikow wymienionych
--             w tabeli drive_dir_shares
-- usersonly - dostepne dla zalogowanych uzytkownikow
-- public    - dostepne dla wszystkich (internet)
-- inherited - dziedziczony dostep do plikow z katalogu nadrzednego,
--             jezeli nie podano jawnie katalog w korzeniu dysku jest prywatny
, visibility ENUM ('private', 'usersonly', 'public', 'inherited') NOT NULL DEFAULT 'inherited'

, name VARCHAR(255) NOT NULL

, INDEX idx_drive_dirs_drive_id (drive_id)
, CONSTRAINT fk_drive_dirs_drive_id
    FOREIGN KEY (drive_id) REFERENCES drives (id)
, INDEX idx_drive_dirs_owner (owner)
, CONSTRAINT fk_drive_dirs_owner
    FOREIGN KEY (owner) REFERENCES users (id)
, INDEX idx_drive_dirs_created_by (created_by)
, CONSTRAINT fk_drive_dirs_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
, INDEX idx_drive_dirs_modified_by (modified_by)
, CONSTRAINT fk_drive_dirs_modified_by
    FOREIGN KEY (modified_by) REFERENCES users (id)
-- indeks pilnujacy, zeby katalogi mialy unikalne nazwy jezeli naleza
-- do tego samego katalogu nadrzednego, przy okazji wspomagajacy klucz
-- obcy oraz wyszukiwanie katalogu po nazwie
, UNIQUE INDEX idx_drive_dirs_parent_id_name (parent_id, name)
, CONSTRAINT fk_drive_dirs_parent_id
    FOREIGN KEY (parent_id) REFERENCES drive_dirs (id)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_polish_ci;

ALTER TABLE drives ADD CONSTRAINT fk_drives_root_dir
    FOREIGN KEY (root_dir) REFERENCES drive_dirs (id);

-- uprawnienia do katalogu
CREATE TABLE drive_dir_shares (
  dir_id INT NOT NULL
, user_id INT NOT NULL
-- czy uzytkownik moze modyfikowac zawartosc katalogu (edytowac i usuwac pliki)
, can_write BOOLEAN NOT NULL DEFAULT FALSE
, PRIMARY KEY (dir_id, user_id)
, CONSTRAINT fk_drive_dir_shares_dir_id
    FOREIGN KEY (dir_id) REFERENCES drive_dirs (id)
, CONSTRAINT fk_drive_dir_shares_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
, INDEX idx_drive_dir_shares_dir_id_user_id (dir_id, user_id)
-- dodatkowy indeks do szybkiego sprawdzania, czy dany uzytkownik ma
-- dostep do udostepnionych katalogow
, INDEX idx_drive_dir_shares_user_id (user_id)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_polish_ci;

-- pliki umieszczone w katalogach
CREATE TABLE drive_files (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT
, dir_id INT NOT NULL -- id katalogu wirtualnego, w ktorym umieszczony jest plik
, owner INT NOT NULL  -- uzytkownik, ktory wgral plik
, ctime INT UNSIGNED NOT NULL   -- data utworzenia pliku na dysku
, mtime INT UNSIGNED NOT NULL   -- data ostatniej modyfikacji metadanych
, created_by INT NOT NULL       -- id uzytkownika, ktory wgral plik
, modified_by INT               -- id uzytkownika, ktory zmodyfikowal dane
, md5sum CHAR(32) NOT NULL      -- suma kontrolna identyfikujaca plik na dysku
, mimetype VARCHAR(64) NOT NULL -- typ MIME pliku

-- filtrowanie po kategorii pliku, NOT NULL zeby bylo latwo filtrowac po tej
-- kolumnie, bez potrzeby sprawdzania IS (NOT) NULL:
-- (filter <> 'image' OR filter IS NULL) vs (filter <> 'image')
, filter ENUM ('', 'image', 'video', 'pdf') NOT NULL DEFAULT ''

, size INT UNSIGNED NOT NULL    -- rozmiar pliku (max 4GB)
, name VARCHAR(255) NOT NULL    -- wirtualna nazwa pliku
-- metadane wykorzystywane przez rozne moduly strony
, title VARCHAR(255)            -- tytul pliku
, author VARCHAR(255)           -- autor pliku (opcjonalny)
, weight INT NOT NULL DEFAULT 0 -- waga pliku (sortowanie)
-- Uwaga odnosnie do maksymalnego rozmiaru VARCHAR(65535) z dokumentacji:
-- http://dev.mysql.com/doc/refman/5.0/en/column-count-limit.html
--   Every table (regardless of storage engine) has a maximum row size of
--   65,535 bytes. Storage engines may place additional constraints on this
--   limit, reducing the effective maximum row size.
, description VARCHAR(65535) -- opis pliku (opcjonalny)
-- /metadane
, INDEX idx_drive_files_owner (owner)
, CONSTRAINT fk_drive_files_owner
    FOREIGN KEY (owner) REFERENCES users (id)
, INDEX idx_drive_files_created_by (created_by)
, CONSTRAINT fk_drive_files_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
, INDEX idx_drive_files_modified_by (modified_by)
, CONSTRAINT fk_drive_files_modified_by
    FOREIGN KEY (modified_by) REFERENCES users (id)
, INDEX idx_drive_files_dir_id (dir_id)
, CONSTRAINT fk_drive_files_dir_id
    FOREIGN KEY (dir_id) REFERENCES drive_dirs (id)
-- unikalnosc nazwy pliku w obrebie jednego katalogu nie jest wymagana
-- (dla katalogow jest ze wzgledu na wyszukiwanie pliku po sciezce)
, INDEX idx_drive_files_dir_id_name (dir_id, name)
, INDEX idx_drive_files_filter (filter)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_polish_ci;

