<?php

class Drive_Model_Dir extends Drive_Model_HierarchicalRow implements Drive_Model_DirInterface
{
    protected $_idColumn = 'dir_id';

    public function getId()
    {
        return $this->dir_id;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getVisibility()
    {
        return $this->visibility;
    }

    public function getOwner()
    {
        return $this->owner;
    }

    public function isPseudo()
    {
        return false;
    }

    public function getParentDir()
    {
        return $this->fetchParent();
    }

    public function getSubdirs()
    {
        return $this->fetchSubDirs();
    }

    public function getSubdir($dirId)
    {
        return $this->_getTable()->fetchRow(array(
            'parent_id = ?' => (int) $this->dir_id,
            'dir_id <> ?' => (int) $this->dir_id,
            'dir_id = ?' => (int) $dirId,
        ));
    }

    public function getFiles()
    {
        return $this->fetchFiles();
    }

    public function isInternal() // {{{
    {
        return (bool) $this->internal_key;
    } // }}}

    /**
     * @deprecated
     */
    public function isReadable($user_id) // {{{
    {
        return $this->_getTable()->isDirReadable($this->dir_id, $user_id);
    } // }}}

    /**
     * @deprecated
     */
    public function isWritable($user_id) // {{{
    {
        return $this->_getTable()->isDirWritable($this->dir_id, $user_id);
    } // }}}

    public function fetchSubDirs() // {{{
    {
        $dir_id = $this->dir_id;
        $dirs = $this->_getTable()->fetchAll(array(
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
        return $this->_getTable()->fetchFilesByDir($this->dir_id);
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

        $this->_getTableFromString('Drive_Model_DbTable_Files')->update($data, $where);
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
            throw new InvalidArgumentException('Plik nie został znaleziony');
        }

        try {
            $drive = $this->Drive;
            $size = (int) filesize($path);

            if ($drive->quota && $drive->getDiskUsage() + $size > $drive->quota) {
                throw new Exception('Brak miejsca na dysku aby zapisać plik');
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
                    throw new Exception('Nie udało się zapisać pliku na dysku');
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
            $file = $this->_getTableFromString('Drive_Model_DbTable_Files')->createRow($data);
            $file->save();

            // zaktualizuj zajmowane miejsce na dysku
            $drive->refreshDiskUsage();

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
        $sharesTable = $this->_getTableFromString('Drive_Model_DbTable_DirShares');
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
        $sharesTable = $this->_getTableFromString('Drive_Model_DbTable_DirShares');
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

        if (empty($this->visibility)) {
            $this->visibility = 'inherited';
        }

        $result = parent::_insert();

        // $this->_updateCounters($this->ParentDir, true, $this->total_file_count, $this->total_file_size);

        return $result;
    } // }}}

    /**
     * Zapisuje rekord do bazy ustawiajac czas modyfikacji i utworzenia.
     */
    public function _update() // {{{
    {
        /*if ($this->_cleanData['parent_id'] != $this->parent_id) {
            // fetch previous parent dir
            $dir = $this->_getTableFromString('Drive_Model_DbTable_Dirs')->findRow($this->_cleanData['parent_id']);
            if ($dir) {
                $this->_updateCounters($dir, false, $this->total_file_count, $this->total_file_size);
            }
            $this->_updateCounters($this->ParentDir, true, $this->total_file_count, $this->total_file_size);
        }*/

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
        // $this->_updateCounters($this->ParentDir, false, $this->total_file_count, $thit->total_file_size);

        // usun udostepnienia
        $this->_getTableFromString('Drive_Model_DbTable_DirShares')->delete(array(
            'dir_id = ?' => $this->dir_id,
        ));

        return parent::delete();
    } // }}}

    /**
     * @return array
     */
    public function getContentSummary() // {{{
    {
        $db = $this->getAdapter();

        // liczba podkatalogow, biezacy katalog nie jest liczony
        $dir_count = 0;
        $dir_id = (int) $this->dir_id;

        $queue = array($this->dir_id);
        $select = Zefram_Db_Select::factory($db);
        $select->from($this->_getTable(), 'dir_id');

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

            foreach ($select->query()->fetchAll() as $row) {
                $dir_ids[$row['dir_id']] = true;
                $queue[] = $row['dir_id'];
                ++$dir_count;
            }
        }

        $select = Zefram_Db_Select::factory($db)
            ->from(
                $this->_getTableFromString('Drive_Model_DbTable_Files'),
                array(
                    'SUM(size) AS size',
                    'COUNT(1) AS file_count',
                )
            )
            ->where('dir_id IN (?)', array_keys($dir_ids));

        $row = $select->query()->fetch();

        return array(
            'size'      => $row['size'],
            'fileCount' => $row['file_count'],
            'dirCount'  => $dir_count,
        );
    } // }}}

    protected function _updateCounters(Drive_Model_Dir $dir = null, $inc, $file_count, $file_size) // {{{
    {
        $file_count = abs($file_count);
        $file_size = abs($file_size);

        $is_direct_parent = true;

        while ($dir) {
            if ($is_direct_parent) {
                $is_direct_parent = false;

                if ($inc) {
                    $dir->dir_count = new Zend_Db_Expr('dir_count + 1');
                } else {
                    $dir->dir_count = new Zend_Db_Expr(
                        'CASE WHEN dir_count > 0 THEN dir_count - 1 ELSE 0 END'
                    );
                }
            }

            if ($inc) {
                $dir->total_dir_count = new Zend_Db_Expr('total_dir_count + 1');
            } else {
                $dir->total_dir_count = new Zend_Db_Expr(
                    'CASE WHEN total_dir_count > 0 THEN total_dir_count - 1 ELSE 0 END'
                );
            }

            if ($inc) {
                $dir->total_file_count = new Zend_Db_Expr(sprintf(
                    'total_file_count + %d', $file_count
                ));
            } else {
                $dir->total_file_count = new Zend_Db_Expr(sprintf(
                    'CASE WHEN total_file_count >= %d THEN total_file_count - %d ELSE 0 END',
                    $file_count, $file_count
                ));
            }

            if ($inc) {
                $dir->total_file_size = new Zend_Db_Expr(sprintf(
                    'total_file_size + %d', $file_size
                ));
            } else {
                $dir->total_file_size = new Zend_Db_Expr(sprintf(
                    'CASE WHEN total_file_size >= %d THEN total_file_size - %d ELSE 0 END',
                    $file_size, $file_size
                ));
            }

            $dir->save();
            $dir = $dir->ParentDir;
        }
    } // }}}
}
