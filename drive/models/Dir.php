<?php

class Drive_Model_Dir extends Drive_Model_HierarchicalRow
{
    protected $_idColumn = 'dir_id';

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
        $where['file_id IN (?)'] = $ordering;

        $weight = 0;
        $case = 'CASE file_id';
        foreach ($ordering as $file_id) {
            $case .= ' WHEN ' . $db->quote($file_id) . ' THEN ' . $weight++;
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
            $mimetype = Zefram_File_MimeType_Data::detect($path);

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
                case Zefram_File_MimeType_Data::JPEG:
                case Zefram_File_MimeType_Data::GIF:
                case Zefram_File_MimeType_Data::PNG:
                    $data['filter'] = 'image';
                    break;

                case Zefram_File_MimeType_Data::PDF:
                    $data['filter'] = 'pdf';
                    break;

                case Zefram_File_MimeType_Data::AVI:
                case Zefram_File_MimeType_Data::FLV:
                case Zefram_File_MimeType_Data::MKV:
                case Zefram_File_MimeType_Data::MPEG:
                case Zefram_File_MimeType_Data::MP4:
                case Zefram_File_MimeType_Data::WMV:
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
     * @return array
     */
    public function fetchShares() // {{{
    {
        $db = $this->getAdapter();
        $sharesTable = $this->_getTable('Drive_Model_DbTable_DirShares');
        $shares = array();

        foreach ($sharesTable->fetchAll(array('dir_id = ?' => $this->dir_id)) as $row) {
            $shares[$row->user_id] = (int) $row->can_write;
        }

        return $shares;
    } // }}}

    /**
     * @param array $users      tablica postaci array(user_id => can_write)
     * @return int              liczba utworzonych rekordow
     */
    public function saveShares(array $shares) // {{{
    {
        $db = $this->getAdapter();

        // usun aktualne rekordy uprawnien
        $sharesTable = $this->_getTable('Drive_Model_DbTable_DirShares');
        $sharesTable->delete(array('dir_id = ?' => $this->dir_id));

        $count = 0;

        if (count($shares)) {
            $row = array('dir_id' => $this->dir_id);

            // zapisz nowe uprawnienia do tego katalogu
            foreach ($shares as $user_id => $can_write) {
                $user_id = (int) $user_id;
                if ($user_id) {
                    $row['user_id']   = $user_id;
                    $row['can_write'] = $can_write ? 1 : 0;

                    $sharesTable->insert($row);
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
        $is_direct_parent = true;
        $dir = $this->ParentDir;

        while ($dir) {
            if ($is_direct_parent) {
                $is_direct_parent = false;
                $dir->dir_count = new Zend_Db_Expr('dir_count + 1');
            }
            $dir->total_dir_count = new Zend_Db_Expr('total_dir_count + 1');
            $dir->save();

            $dir = $dir->ParentDir;
        }

        return $result;
    } // }}}

    /**
     * Zapisuje rekord do bazy ustawiajac czas modyfikacji i utworzenia.
     */
    public function _update() // {{{
    {
        // TODO trzeba zadbac o aktualizacje licznika plikow i podkatalogow przy przenoszeniu katalogow i plikow
        if ($this->_cleanData['parent_id'] != $this->parent_id) {
            // previous parent dir
            $dir = $this->_getTable('Drive_Model_DbTable_Dirs')->findRow($this->_cleanData['parent_id']);
            if ($dir) {
                $sub_dir_count = 1 + $this->sub_dir_count;
                $sub_file_count = $this->sub_file_count;

                while ($dir) {
                    // dir_count stores number of direct children
                    $dir->dir_count = new Zend_Db_Expr(
                        'CASE WHEN dir_count > 0 THEN dir_count - 1 ELSE dir_count END'
                    );
                    // sub_dir_count stores number of all children in this dirs
                    // subtree
                    $dir->sub_dir_count = new Zend_Db_Expr(sprintf(
                        'CASE WHEN sub_dir_count >= %d THEN sub_dir_count - %d ELSE 0 END',
                        $sub_dir_count, $sub_dir_count
                    ));
                    $dir->sub_file_count = new Zend_Db_Expr(sprintf(
                        'CASE WHEN sub_file_count >= %d THEN sub_file_count - %d ELSE 0 END',
                        $sub_file_count, $sub_file_count
                    ));
                    $dir->save();

                    $sub_dir_count += 1 + $dir->dir_count;
                    $sub_file_count += $dir->file_count;

                    $dir = $dir->ParentDir;
                }
            }
        }

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
        $is_direct_parent = true;
        $dir = $this->ParentDir;

        while ($dir) {
            if ($is_direct_parent) {
                $is_direct_parent = false;
                $dir->dir_count = new Zend_Db_Expr('CASE WHEN dir_count > 0 THEN dir_count - 1 ELSE 0 END');
            }
            $dir->total_dir_count = new Zend_Db_Expr('CASE WHEN total_dir_count > 0 THEN total_dir_count - 1 ELSE 0 END');
            $dir->save();

            $dir = $dir->ParentDir;
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
        $select = $this->getTable()->select('dir_id');
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
