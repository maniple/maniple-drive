<?php

class ManipleDrive_Model_Repository
{
    /**
     * @var Zefram_Db
     */
    protected $_tableFactory;

    public function __construct(Zefram_Db $tableFactory)
    {
        $this->_tableFactory = $tableFactory;
    }

    /**
     * @return Zefram_Db
     */
    public function getTableFactory()
    {
        return $this->_tableFactory;
    }

    /**
     * Fetch directory with given ID.
     *
     * @param  int $dir_id
     * @return ManipleDrive_Model_Dir|null
     * @noinspection PhpDocMissingThrowsInspection
     */
    public function getDir($dir_id)
    {
        $dir_id = (int) $dir_id;
        $dir = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->findRow($dir_id);

        return $dir ? $dir : null;
    }

    /**
     * @param  int $dir_id
     * @return ManipleDrive_Model_Dir
     * @throws Maniple_Model_Exception_EntityNotFoundException
     */
    public function getDirOrThrow($dir_id)
    {
        $dir = $this->getDir($dir_id);

        if (empty($dir)) {
            throw new Maniple_Model_Exception_EntityNotFoundException(sprintf(
                'Invalid directory ID (%d)', $dir_id
            ));
        }

        return $dir;
    }

    /**
     * Fetch root directory with given ID.
     *
     * @param  int $dir_id
     * @return ManipleDrive_Model_Dir|null
     */
    public function getRootDir($dir_id)
    {
        $dir_id = (int) $dir_id;

        $select = $this->_createSelect();
        $select->from(
            array('dirs' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->getName())
        );
        $select->join(
            array('drives' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Drives::className)->getName()),
            'drives.root_dir = dirs.dir_id',
            array()
        );
        $select->where('dir_id = ?', $dir_id);

        /** @var ManipleDrive_Model_Dir $dir */
        $dir = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->fetchRow($select);

        return $dir ? $dir : null;
    }

    /**
     * @param  int $drive_id
     * @return array
     * @noinspection PhpDocMissingThrowsInspection
     */
    public function getDriveSummary($drive_id)
    {
        $drive_id = (int) $drive_id;
        $drive = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Drives::className)->findRow($drive_id);
        if (empty($drive)) {
            throw new Exception('Invalid drive ID');
        }

        $dir_ids = array_merge(
            (array) $drive->RootDir->dir_id,
            $drive->RootDir->getSubdirIdentifiers()
        );

        $num_dirs = count($dir_ids);

        // count files by type (filter)
        $select = $this->_createSelect();
        $select->from(
            array('files' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->getName()),
            array(
                'type' => 'filter',
                'num_files' => new Zend_Db_Expr('COUNT(1)'),
                'disk_usage' => new Zend_Db_Expr('SUM(size)'),
            )
        );
        $select->join(
            array('dirs' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->getName()),
            'dirs.dir_id = files.dir_id',
            array()
        );
        $select->where('dirs.dir_id IN (?)', $dir_ids);
        $select->group('filter');

        $disk_usage = 0;
        $num_files = 0;
        $num_by_type = array(
            'image' => 0,
            'video' => 0,
            'pdf'   => 0,
            'other' => 0,
        );

        foreach ($select->query(Zend_Db::FETCH_ASSOC)->fetchAll() as $row) {
            $type = $row['type'];
            $count = $row['num_files'];

            if (!isset($num_by_type[$type])) {
                $type = 'other';
            }

            $num_by_type[$type] += $count;
            $num_files += $count;

            $disk_usage += $row['disk_usage'];
        }

        return array(
            'disk_usage' => $disk_usage,
            'num_dirs'  => $num_dirs,
            'num_files' => $num_files,
            'num_by_type' => $num_by_type,
        );
    }

    /**
     * @param  int $user_id
     * @return ManipleDrive_Model_Drive|null
     */
    public function getDriveByUserId($user_id)
    {
        $user_id = (int) $user_id;

        // create drive and its root dir in one go

        $drives_table = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Drives::className);
        $dirs_table = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className);

        $select = $this->_createSelect();
        $select->from(
            array('drives' => $drives_table),
            $drives_table->getColsForSelect('Drive__')
        );
        $select->join(
            array('dirs' => $dirs_table),
            'dirs.dir_id = drives.root_dir',
            $dirs_table->getColsForSelect('Dir__')
        );
        $select->where('drives.owner = ?', $user_id);
        $select->limit(1);

        foreach ($select->query(Zend_Db::FETCH_ASSOC)->fetchAll() as $row) {
            $data = array();
            foreach ($row as $key => $value) {
                $key = explode('__', $key, 2);
                $data[$key[0]][$key[1]] = $value;
            }

            /** @var ManipleDrive_Model_Drive $drive */
            /** @noinspection PhpInternalEntityUsedInspection */
            $drive = $drives_table->_createStoredRow($data['Drive']);
            /** @noinspection PhpInternalEntityUsedInspection */
            $drive->RootDir = $dirs_table->_createStoredRow($data['Dir']);

            return $drive;
        }

        return null;
    }

    public function getLastUploadedFiles($drive_id = null, $limit = 10)
    {
        $select = $this->_createSelect();
        $select->from(
            array('files' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->getName())
        );
        if ($drive_id) {
            $select->join(
                array('dirs' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->getName()),
                'dirs.dir_id = files.dir_id',
                array()
            );
            $select->where('drive_id = ?', (int) $drive_id);
        }
        $select->order('ctime DESC');
        $select->limit($limit);

        return $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->fetchAll($select);
    }

    public function getLastPublishedFiles($drive_id = null, $limit = 10)
    {
        $dir_ids = $this->getPublicDirIds($drive_id);

        if ($dir_ids) {
            $select = $this->_createSelect();
            $select->from(
                array('files' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->getName())
            );
            $select->where('dir_id IN (?)', $dir_ids);
            $select->order('ctime DESC');
            $select->limit($limit);

            return $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->fetchAll($select);
        }

        return array();
    }

    public function getLastSharedWithUserFiles($user_id, $limit = 10)
    {
        $dir_ids = $this->getSharedWithUserDirIds($user_id);

        if ($dir_ids) {
            $select = $this->_createSelect();
            $select->from(
                array('files' => $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->getName())
            );
            $select->where('dir_id IN (?)', $dir_ids);
            $select->order('ctime DESC');
            $select->limit($limit);

            return $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->fetchAll($select);
        }

        return array();
    }

    /**
     * Retrieve identifiers of public directories.
     *
     * @param  int $drive_id OPTIONAL
     * @param  bool $inherited OPTIONAL
     * @return int[]
     */
    public function getPublicDirIds($drive_id = null, $inherited = true)
    {
        $dirs_table = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->getName();

        $select = $this->_createSelect();
        $select->from(
            array('dirs' => $dirs_table),
            'dir_id'
        );
        $select->where('visibility = ?', ManipleDrive_DirVisibility::VIS_PUBLIC);

        if ($drive_id !== null) {
            $select->where('drive_id = ?', (int) $drive_id);
        }

        $dir_ids = array_column(
            $select->query(Zend_Db::FETCH_ASSOC)->fetchAll(),
            'dir_id'
        );

        if ($inherited) {
            $parent_ids = $dir_ids;
            $dir_ids = array();

            while ($parent_ids) {
                $dir_ids = array_merge($dir_ids, $parent_ids);

                $select = $this->_createSelect();
                $select->from(
                    array('dirs' => $dirs_table),
                    'dir_id'
                );
                $select->where('visibility = ?', ManipleDrive_DirVisibility::VIS_INHERITED);
                $select->where('parent_id IN (?)', $parent_ids);

                $parent_ids = array_column(
                    $select->query(Zend_Db::FETCH_ASSOC)->fetchAll(),
                    'dir_id'
                );
            }
        }

        return $dir_ids;
    }

    /**
     * Retrieve identifiers of directories that are shared with the user
     * of given ID.
     *
     * @param  int $user_id
     * @param  bool $inherited OPTIONAL
     * @return int[]
     */
    public function getSharedWithUserDirIds($user_id, $inherited = true)
    {
        $user_id = (int) $user_id;

        $dirs_table = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->getName();
        $dir_shares_table = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_DirShares::className)->getName();

        $select = $this->_createSelect();
        $select->from(
            array('dirs' => $dirs_table),
            'dir_id'
        );
        $select->joinLeft(
            array('dir_shares' => $dir_shares_table),
            array(
                'dir_shares.dir_id = dirs.dir_id',
                'dir_shares.user_id = ?' => $user_id,
            ),
            array()
        );
        $select->where(
            'dir_shares.user_id IS NOT NULL OR dirs.visibility = ?', ManipleDrive_DirVisibility::VIS_USERSONLY
        );

        $dir_ids = array_column(
            $select->query(Zend_Db::FETCH_ASSOC)->fetchAll(),
            'dir_id'
        );

        if ($inherited) {
            $parent_ids = $dir_ids;
            $dir_ids = array();

            while ($parent_ids) {
                $dir_ids = array_merge($dir_ids, $parent_ids);

                $select = $this->_createSelect();
                $select->from(
                    array('dirs' => $dirs_table),
                    'dir_id'
                );
                $select->where('visibility = ?', ManipleDrive_DirVisibility::VIS_INHERITED);
                $select->where('parent_id IN (?)', $parent_ids);

                $parent_ids = array_column(
                    $select->query(Zend_Db::FETCH_ASSOC)->fetchAll(),
                    'dir_id'
                );
            }
        }

        return $dir_ids;
    }

    /**
     * @param  int $file_id
     * @return ManipleDrive_Model_File|null
     * @noinspection PhpDocMissingThrowsInspection
     */
    public function getFile($file_id)
    {
        $file_id = (int) $file_id;
        $file = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Files::className)->findRow($file_id);

        return $file ? $file : null;
    }

    /**
     * @param  int $file_id
     * @return ManipleDrive_Model_File
     * @throws Maniple_Model_Exception_EntityNotFoundException
     */
    public function getFileOrThrow($file_id)
    {
        $file = $this->getFile($file_id);

        if (empty($file)) {
            throw new Maniple_Model_Exception_EntityNotFoundException(sprintf(
                'Invalid file ID (%d)', $file_id
            ));
        }

        return $file;
    }

    /**
     * @param  string $internal_name
     * @return ManipleDrive_Model_Dir|null
     */
    public function getDirByInternalName($internal_name)
    {
        $internal_name = (string) $internal_name;
        /** @var ManipleDrive_Model_Dir $dir */
        $dir = $this->_tableFactory->getTable(ManipleDrive_Model_DbTable_Dirs::className)->fetchRow(array(
            'internal_name = ?' => $internal_name,
        ));
        if ($dir) {
            return $dir;
        }
        return null;
    }

    protected function _createSelect()
    {
        return Zefram_Db_Select::factory($this->_tableFactory->getAdapter());
    }
}
