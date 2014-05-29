<?php

class Drive_Model_Dir extends Drive_Model_HierarchicalRow
{
    public function isReadable($user_id) // {{{
    {
        return $this->getTable()->isDirReadable($this->dir_id, $user_id);
    } // }}}

    public function isWritable($user_id) // {{{
    {
        return $this->getTable()->isDirWritable($this->dir_id, $user_id);
    } // }}}

    public function fetchSubDirs() // {{{
    {
        $dir_id = $this->dir_id;
        $dirs = $this->getTable()->fetchAll(array(
            'parent_id = ?' => (int) $dir_id,
            'dir_id <> ?' => (int) $dir_id,
        ), 'name ASC');

        return $dirs;
    } // }}}

    /**
     * $options
     * - orderByWeight
     * - 
     */
    public function fetchFiles($where = null, $order = null) // {{{
    {
        return $this->getTable()->fetchFilesByDir($this->dir_id);
    } // }}}

    /**
     * @param array $ordering array of sorted file ids
     */
    public function reorderFiles(array $ordering, $where = null) // {{{
    {
        $db = $this->getAdapter();

        $where = (array) $where;
        $where['dir_id = ?'] = (int) $this->dir_id;
        $where['id IN (?)'] = $ordering;

        $weight = 0;
        $case = 'CASE id';
        foreach ($ordering as $id) {
            $case .= ' WHEN ' . $db->quote($id) . ' THEN ' . $weight++;
        }
        $case .= ' ELSE weight END';

        $data = array(
            'weight' => new Zend_Db_Expr($case),
        );

        $this->_getTable('Drive_Model_DbTable_Files')->update($data, $where);
    } // }}}

    /**
     * W tablicy $data musi być podana ścieżka do pliku w kluczu tmp_name.
     * Ponieważ funkcja przejmuje na własność ten plik, po wyjściu z niej
     * plik przestaje istnieć.
     * W tablicy $data muszą być ustawione wartości dla kluczy owner oraz name.
     *
     * @param array $data
     * @return Zend_Db_Table_Row
     */
    public function saveFile(array $data) // {{{
    {
        if (empty($data['tmp_name']) || !is_file($path = $data['tmp_name'])) {
            throw new App_Exception_InvalidAdrument('Plik nie został znaleziony');
        }

        try {
            $drive = $this->Drive;
            $size = (int) filesize($path);

            if ($drive->quota && $drive->disk_usage + $size > $drive->quota) {
                throw new App_Exception_ApplicationLogic('Brak miejsca na dysku aby zapisać plik');
            }

            $md5 = md5_file($path);
            $mimetype = MimeType::detect($path);

            // jezeli plik o takiej samej sumie MD5 juz istnieje, usuwamy plik
            // tymczasowy. Jezeli nie istnieje przenies go do docelowej
            // lokalizacji.
            if ($drive->getFilePath($md5)) {
                @unlink($path);

                // ustawienie $path na pusta wartosc uniemozliwi usuniecie
                // pliku, i dobrze, bo skoro plik w podanej sciezce istnial
                // wczesniej oznacza to, ze jest uzywany przez inny rekord
                $path = null;

            } else {
                $dest = $drive->prepareFilePath($md5);
                if (@rename($path, $dest)) {
                    // plik nie istnial, jezeli wystapi wyjatek, zostanie on
                    // usuniety z docelowej lokalizacji
                    $path = $dest;
                } else {
                    throw new App_Exception('Nie udało się zapisać pliku na dysku');
                }
            }

            $now = time();

            $data = array_merge($data, array(
                'dir_id' => $this->dir_id,
                'md5sum' => $md5,
                'size'   => $size,
                'ctime'  => $now,
                'mtime'  => $now,
                'mimetype' => $mimetype,
            ));

            // ustaw filtr
            switch ($data['mimetype']) {
                case MimeType::JPEG:
                case MimeType::GIF:
                case MimeType::PNG:
                    $data['filter'] = 'image';
                    break;

                case MimeType::PDF:
                    $data['filter'] = 'pdf';
                    break;

                case MimeType::AVI:
                case MimeType::FLV:
                case MimeType::MKV:
                case MimeType::MPEG:
                case MimeType::MP4:
                case MimeType::WMV:
                    $data['filter'] = 'video';
                    break;

                default:
                    if (array_key_exists('filter', $data)) {
                        unset($data['filter']);
                    }
                    break;
            }

            $db = $this->getAdapter();
            $file = $this->_getTable('Drive_Model_DbTable_Files')->createRow($data);
            $file->save();

            // zaktualizuj zajmowane miejsce na dysku
            $drive->disk_usage = new Zend_Db_Expr('disk_usage + ' . $size);
            $drive->save();

            return $file;

        } catch (Exception $e) {
            if ($path) {
                @unlink($path);
            }
            throw $e;
        }
    } // }}}

    /**
     * @param string|array $columns
     * @return Zefram_Db_Table_Select
     */
    public function selectShares($columns = Zend_Db_Select::SQL_WILDCARD) // {{{
    {
        $db = $this->getAdapter();
        $shares = $this->_getTable('Drive_Model_DbTable_DirShares');
        $select = $this->_getTable('Model_Core_Users')
            ->select(array('u' => $columns))
            ->setIntegrityCheck(false)
            ->join(array('s' => $shares), 's.user_id = u.id', 'can_write')
            ->where('s.dir_id = ?', $this->dir_id)
            ->order(array('last_name', 'first_name', 'username'));

        return $select;
    } // }}}

    /**
     * @param array $users      tablica postaci array(user_id => can_write)
     * @return int              liczba utworzonych rekordow
     */
    public function saveShares($users) // {{{
    {
        $db = $this->getAdapter();

        // usun aktualne rekordy uprawnien
        $shares = $this->_getTable('Drive_Model_DbTable_DirShares');
        $shares->delete(array('dir_id = ?' => $this->dir_id));

        $count = 0;
        $users = array_map(function($value) { return $value ? 1 : 0; }, (array) $users);

        if (count($users)) {
            // odfiltruj niepoprawne identyfikatory uzytkownikow
            $user_ids = $this->_getTable('Model_Core_Users')
                ->select('id')
                ->where('id IN (?)', array_keys($users))
                ->fetchAll();

            if (count($user_ids)) {
                $row = array('dir_id' => $this->dir_id);

                // zapisz nowe uprawnienia do tego katalogu
                foreach ($user_ids as $user_id) {
                    $user_id = reset($user_id);
                    $row['user_id']   = $user_id;
                    $row['can_write'] = $users[$user_id];

                    $shares->insert($row);
                    ++$count;
                }
            }
        }

        return $count;
    } // }}}

    public function _insert() // {{{
    {
        $now = time();
        $this->ctime = $now;
        $this->mtime = $now;

        // jezeli nie podano jawnie wlasciciela, zostaje nim osoba zapisujaca
        // ten rekord do bazy
        if (empty($this->owner)) {
            $this->owner = $this->created_by;
        }

        $result = parent::_insert();

        // zaktualizuj licznik podkatalogow w katalogu nadrzednym
        $parentDir = $this->ParentDir;
        if ($parentDir) {
            $parentDir->dir_count = new Zend_Db_Expr('dir_count + 1');
            $parentDir->save();
        }

        return $result;
    } // }}}

    /**
     * Zapisuje rekord do bazy ustawiajac czas modyfikacji i utworzenia.
     */
    public function _update() // {{{
    {
        // TODO trzeba zadbac o aktualizacje licznika plikow i podkatalogow przy przenoszeniu katalogow i plikow
        $this->mtime = time();
        return parent::_update();
    } // }}}

    public function delete() // {{{
    {
        foreach ($this->fetchFiles() as $file) {
            $file->delete();
        }

        foreach ($this->fetchSubDirs() as $dir) {
            $dir->delete();
        }

        // zmniejsz licznik podkatalogow w katalogu nadrzednym
        $parentDir = $this->ParentDir;
        if ($parentDir) {
            $parentDir->dir_count = new Zend_Db_Expr('CASE WHEN dir_count > 0 THEN dir_count - 1 ELSE 0 END');
            $parentDir->save();
        }

        // usun udostepnienia
        $this->_getTable('Drive_Model_DbTable_DirShares')->delete(array(
            'dir_id = ?' => $this->dir_id,
        ));

        return parent::delete();
    } // }}}

    /**
     * @return array
     */
    public function getContentSummary() // {{{
    {
        // liczba podkatalogow, biezacy katalog nie jest liczony
        $dir_count = 0;
        $dir_id = (int) $this->dir_id;

        $queue = array($this->dir_id);
        $select = $this->getTable()->select('id');
        $where = array(
            'drive_id = ?' => $this->drive_id,
        );

        $dir_ids = array(
            // dodaj biezacy katalog do listy przeszukiwanych katalogow
            $dir_id => true,
        );

        // pobierz identyfikatory wszystkich katalogow w poddrzewie
        // zakorzenionym w tym katalogu
        while ($dir_id = array_shift($queue)) {
            $where['parent_id = ?'] = $dir_id;
            $select->reset(Zend_Db_Select::WHERE)->where($where);

            foreach ($select->fetchAll() as $row) {
                $dir_ids[$row['dir_id']] = true;
                $queue[] = $row['dir_id'];
                ++$dir_count;
            }
        }

        $db = $this->getAdapter();
        $select = $this->_getTable('Drive_Model_DbTable_Files')
                ->select(array('SUM(size) AS size', 'COUNT(1) AS file_count'))
                ->where('dir_id IN (?)', array_keys($dir_ids));

        $row = $select->fetchRow();

        return array(
            'size'      => $row['size'],
            'fileCount' => $row['file_count'],
            'dirCount'  => $dir_count,
        );
    } // }}}
}