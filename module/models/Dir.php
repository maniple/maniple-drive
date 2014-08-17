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

    public function getFile($fileId)
    {
        throw new Exception('TODO Not implemented');
    }

    /**
     * @param  string $name
     * @return ManipleDrive_Model_File|null
     */
    public function getFileByName($name) // {{{
    {
        $file = $this->_getTableFromString('ManipleDrive_Model_DbTable_Files')->fetchRow(array(
            'name = ?'   => (string) $name,
            'dir_id = ?' => (int) $this->dir_id,
        ));
        return $file ? $file : null;
    } // }}}

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
        return $this->_getTable()->fetchFilesByDir($this->dir_id, $where, array('weight', 'name_normalized'));
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
     * @param  string $path
     * @param  array $data
     * @param  bool $isTempFile OPTIONAL
     * @return Zend_Db_Table_Row
     */
    public function saveFile($path, array $data, $isTempFile = true) // {{{
    {
        if (!is_file($path)) {
            throw new InvalidArgumentException('Plik nie został znaleziony');
        }

        $eventManager = Zend_Controller_Front::getInstance()->getParam('bootstrap')->getResource('drive.helper')->getEventManager();
        $del_path = $isTempFile ? $path : null;

        try {
            $drive = $this->Drive;
            $size = (int) filesize($path);

            if ($drive->quota && $drive->getDiskUsage() + $size > $drive->quota) {
                throw new Exception('Brak miejsca na dysku aby zapisać plik');
            }

            $md5 = md5_file($path);
            $mimetype = Zefram_File_MimeType_Data::detect($path);

            // be more specific about ZIP archives
            if ($mimetype === Zefram_File_MimeType_Data::ZIP) {
                $ext = strtoupper(substr(strrchr($filename, '.'), 1));

                switch ($ext) {
                    case 'ODT': case 'ODS': case 'ODP':
                    case 'DOCX': case 'XLSX': case 'PPTX':
                        $mimetype = constant('Zefram_File_MimeType_Data::' . $ext);
                        break;
                }
            }

            // jezeli plik o takiej samej sumie MD5 juz istnieje, usuwamy plik
            // tymczasowy. Jezeli nie istnieje przenies go do docelowej
            // lokalizacji.
            if ($drive->getFilePath($md5)) {
                // usun plik tymczasowy (o ile jest on tymczasowy)
                if ($isTempFile) {
                    @unlink($path);
                }

            } else {
                $dest = $drive->prepareFilePath($md5);
                if ($isTempFile) {
                    $success = @rename($path, $dest);
                } else {
                    $success = @copy($path, $dest);
                }
                if ($success) {
                    // plik $dest nie istnial wczesniej, jezeli wystapi wyjatek
                    // podczas zapisywania rekordu do bazy, plik zostanie
                    // usuniety z docelowej lokalizacji
                    $del_path = $dest;
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
            if ($del_path) {
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

        // ensure is_system is 0 or 1 only
        $this->is_system = self::_01($this->is_system);

        $result = parent::_insert();

        self::_updateCounters($this->ParentDir, 1, 0, 0, self::_01($this->is_system));

        return $result;
    } // }}}

    /**
     * Zapisuje rekord do bazy ustawiajac czas modyfikacji i utworzenia.
     */
    public function _update() // {{{
    {
        // remember original values for later use
        $prev = $this->_cleanData;

        // ensure is_system is 0 or 1 only
        $this->is_system = self::_01($this->is_system);
        $this->mtime = time();

        $result = parent::_update();

        if ($this->parent_id != $prev['parent_id']) {
            // fetch previous parent dir, decrement its counters using previous
            // counter values
            if ($prev['parent_id']) {
                $prevParentDir = $this->_getTableFromString('ManipleDrive_Model_DbTable_Dirs')->findRow($prev['parent_id']);
                if ($prevParentDir) {
                    self::_updateCounters(
                        $prevParentDir, -1, -$prev['file_count'], -$prev['byte_count'], -($prev['system_count'] + self::_01($prev['is_system']))
                    );
                }
            }
            // update counters in new parent dirs using current counter values
            self::_updateCounters(
                $this->ParentDir, 1, $this->file_count, $this->byte_count, $this->system_count + self::_01($this->is_system)
            );

        } elseif (($isSystem = self::_01($this->is_system)) !== self::_01($prev['is_system'])) {
            // parent dir was not changed, is_system flag was changed -
            // increment by 1 (if flag was gained) or decrement by 1 (if flag
            // was taken) system_count counter in all parent dirs
            self::_updateCounters($this->ParentDir, 0, 0, 0, $isSystem ? 1 : -1);
        }

        return $result;
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
            self::_updateCounters(
                $this->ParentDir, -($this->dir_count + 1), -$this->file_count, -$this->byte_count, -($this->system_count + self::_01($this->is_system))
            );
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
        return array(
            'size'      => $this->byte_count,
            'fileCount' => $this->file_count,
            'dirCount'  => $this->dir_count,
        );

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
     * @param  int $system_count
     * @internal
     */
    public static function _updateCounters(ManipleDrive_Model_Dir $dir = null, $dir_count = 0, $file_count = 0, $byte_count = 0, $system_count = 0) // {{{
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

            if ($system_count > 0) {
                $dir->system_count = new Zend_Db_Expr(sprintf(
                    'system_count + %d', $system_count
                ));
            } elseif ($system_count < 0) {
                $dir->system_count = new Zend_Db_Expr(sprintf(
                    'CASE WHEN system_count >= %d THEN system_count - %d ELSE 0 END',
                    -$system_count, -$system_count
                ));
            }

            $dir->save();
            $dir = $dir->ParentDir;
        }
    } // }}}

    protected static function _01($value)
    {
        return ((int) $value) ? 1 : 0;
    }

    /**
     * {@inheritdoc}
     */
    public function __set($key, $value) // {{{
    {
        parent::__set($key, $value);

        // if a parent directory was (un)set, update drive_id accordingly
        if ($key === 'ParentDir') {
            $this->drive_id = $value ? $value->drive_id : null;
        }
    } // }}}

    /**
     * Creates a subdirectory of this directory.
     *
     * @param  string $name
     * @param  array $data OPTIONAL
     * @return ManipleDrive_Model_Dir
     * @deprecated
     */
    public function createDir($name, array $data = null) // {{{
    {
        $dir = $this->_getTable()->createRow((array) $data);
        $dir->name = (string) $name;
        $dir->drive_id = $this->drive_id;
        $dir->parent_id = $this->dir_id;
        $dir->save();
        return $dir;
    } // }}}
}
