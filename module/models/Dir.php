<?php

class ManipleDrive_Model_Dir extends ManipleDrive_Model_HierarchicalRow implements ManipleDrive_Model_DirInterface
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
        return (bool) $this->internal_name;
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
        ), 'name_normalized');

        return $dirs;
    } // }}}

    /**
     * $options
     * - orderByWeight
     * - 
     */
    public function fetchFiles($where = null) // {{{
    {
        return $this->_getTable()->fetchFilesByDir($this->dir_id, $where, 'name_normalized');
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

        $this->_getTableFromString('ManipleDrive_Model_DbTable_Files')->update($data, $where);
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

        $eventManager = Zend_Controller_Front::getInstance()->getParam('bootstrap')->getResource('drive.helper')->getEventManager();

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
            $file = $this->_getTableFromString('ManipleDrive_Model_DbTable_Files')->createRow($data);

            if ($eventManager) {
                $eventManager->trigger('drive.fileBeforeSave', null, array('file' => (object) $file->toArray()));
            }

            $file->save();

            // zaktualizuj zajmowane miejsce na dysku
            $drive->refreshDiskUsage();

        } catch (Exception $e) {
            if ($path) {
                @unlink($path);
            }
            throw $e;
        }

        if ($eventManager) {
            $eventManager->trigger('drive.fileSaved', null, array('file' => (object) $file->toArray()));
        }

        return $file;
    } // }}}

    /**
     * @return array
     */
    public function fetchShares() // {{{
    {
        $db = $this->getAdapter();
        $sharesTable = $this->_getTableFromString('ManipleDrive_Model_DbTable_DirShares');
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
        $sharesTable = $this->_getTableFromString('ManipleDrive_Model_DbTable_DirShares');
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

    public function save() // {{{
    {
        $filter = new ManipleDrive_Filter_NameNormalize;
        $this->name_normalized = $filter->filter($this->name);

        return parent::save();
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

        self::_updateCounters($this->ParentDir, 1, 0, 0);

        return $result;
    } // }}}

    /**
     * Zapisuje rekord do bazy ustawiajac czas modyfikacji i utworzenia.
     */
    public function _update() // {{{
    {
        if ($this->_cleanData['parent_id'] != $this->parent_id) {
            // fetch previous parent dir
            $dir = $this->_getTableFromString('ManipleDrive_Model_DbTable_Dirs')->findRow($this->_cleanData['parent_id']);
            if ($dir) {
                self::_updateCounters($dir, -1, -$this->file_count, -$this->byte_count);
            }
            self::_updateCounters($this->ParentDir, 1, $this->file_count, $this->byte_count);
        }

        $this->mtime = time();
        return parent::_update();
    } // }}}

    public function delete($_updateCounters = true) // {{{
    {
        // usun pliki i katalogi w poddrzewie, ale nie aktualizuj licznikow
        // - liczniki zostana zaktualizowane przez korzen usuwanego poddrzewa
        foreach ($this->fetchFiles() as $file) {
            $file->delete(false);
        }

        foreach ($this->fetchSubDirs() as $dir) {
            $dir->delete(false);
        }

        if ($_updateCounters) {
            $this->_refresh();
            self::_updateCounters($this->ParentDir, -1, -$this->file_count, -$this->byte_count);
        }

        // usun udostepnienia
        $this->_getTableFromString('ManipleDrive_Model_DbTable_DirShares')->delete(array(
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
                $this->_getTableFromString('ManipleDrive_Model_DbTable_Files'),
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

    /**
     * Update dir, file and byte counters of given directory and all its
     * parents with given values.
     *
     * @param  ManipleDrive_Model_Dir $dir
     * @param  int $dir_count
     * @param  int $file_count
     * @param  int $byte_count
     * @internal
     */
    public static function _updateCounters(ManipleDrive_Model_Dir $dir = null, $dir_count = 0, $file_count = 0, $byte_count = 0) // {{{
    {
        while ($dir) {
            if ($dir_count > 0) {
                $dir->dir_count = new Zend_Db_Expr(sprintf(
                    'dir_count + %d', $dir_count
                ));
            } elseif ($dir_count < 0) {
                $dir->dir_count = new Zend_Db_Expr(sprintf(
                    'CASE WHEN dir_count >= %d THEN dir_count - %d ELSE 0 END',
                    -$dir_count, -$dir_count
                ));
            }

            if ($file_count > 0) {
                $dir->file_count = new Zend_Db_Expr(sprintf(
                    'file_count + %d', $file_count
                ));
            } elseif ($file_count < 0) {
                $dir->file_count = new Zend_Db_Expr(sprintf(
                    'CASE WHEN file_count >= %d THEN file_count - %d ELSE 0 END',
                    -$file_count, -$file_count
                ));
            }

            if ($byte_count > 0) {
                $dir->byte_count = new Zend_Db_Expr(sprintf(
                    'byte_count + %.0f', $byte_count
                ));
            } elseif ($byte_count < 0) {
                $dir->byte_count = new Zend_Db_Expr(sprintf(
                    'CASE WHEN byte_count >= %.0f THEN byte_count - %.0f ELSE 0 END',
                    -$byte_count, -$byte_count
                ));
            }

            $dir->save();
            $dir = $dir->ParentDir;
        }
    } // }}}
}