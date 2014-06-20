<?php

class Drive_Model_Repository
{
    protected $_tableProvider;

    public function __construct(Zefram_Db_TableProvider $tableProvider)
    {
        $this->_tableProvider = $tableProvider;
    }

    /**
     * @param  int $drive_id
     * @return array
     */
    public function getDriveSummary($drive_id) // {{{
    {
        $drive_id = (int) $drive_id;

        $select = $this->_createSelect();
        $select->from(
            $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_DIRS),
            new Zend_Db_Expr('COUNT(1)')
        );
        $select->where('drive_id = ?', $drive_id);

        $num_dirs = (int) $select->query()->fetchColumn();

        // count files by type (filter)

        $select = $this->_createSelect();
        $select->from(
            array('files' => $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_FILES)),
            array(
                'type' => 'filter',
                'num_files' => new Zend_Db_Expr('COUNT(1)')
            )
        );
        $select->join(
            array('dirs' => $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_DIRS)),
            'dirs.dir_id = files.dir_id',
            array()
        );
        $select->where('dirs.drive_id = ?', $drive_id);
        $select->group('filter');

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
        }
        
        return array(
            'num_dirs'  => $num_dirs,
            'num_files' => $num_files,
            'num_by_type' => $num_by_type,
        );
    } // }}}

    /**
     * @param  int $user_id
     * @return Drive_Model_Drive|null
     */
    public function getDriveByUserId($user_id) // {{{
    {
        $user_id = (int) $user_id;

        // create drive and its root dir in one go

        $drives_table = $this->_tableProvider->getTable('Drive_Model_DbTable_Drives');
        $dirs_table = $this->_tableProvider->getTable('Drive_Model_DbTable_Dirs');

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

            $drive = $drives_table->_createStoredRow($data['Drive']);
            $drive->RootDir = $dirs_table->_createStoredRow($data['Dir']);

            return $drive;
        }

        return null;
    } // }}}

    public function getLastUploadedFiles($drive_id = null, $limit = 10) // {{{
    {
        $select = $this->_createSelect();
        $select->from(
            array('files' => $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_FILES))
        );
        if ($drive_id) {
            $select->join(
                array('dirs' => $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_DIRS)),
                'dirs.dir_id = files.dir_id',
                array()
            );
            $select->where('drive_id = ?', (int) $drive_id);
        }
        $select->order('ctime DESC');
        $select->limit($limit);

        return $this->_tableProvider->getTable('Drive_Model_DbTable_Files')->fetchAll($select);
    } // }}}

    public function getLastPublishedFiles($drive_id = null, $limit = 10) // {{{
    {
        $dir_ids = $this->getPublicDirIds($drive_id);

        if ($dir_ids) {
            $select = $this->_createSelect();
            $select->from(
                array('files' => $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_FILES))
            );
            $select->where('dir_id IN (?)', $dir_ids);
            $select->order('ctime DESC');
            $select->limit($limit);

            return $this->_tableProvider->getTable('Drive_Model_DbTable_Files')->fetchAll($select);
        }

        return array();
    } // }}}

    public function getLastSharedWithUserFiles($user_id, $limit = 10) // {{{
    {
        $dir_ids = $this->getSharedWithUserDirIds($user_id);

        if ($dir_ids) {
            $select = $this->_createSelect();
            $select->from(
                array('files' => $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_FILES))
            );
            $select->where('dir_id IN (?)', $dir_ids);
            $select->order('ctime DESC');
            $select->limit($limit);

            return $this->_tableProvider->getTable('Drive_Model_DbTable_Files')->fetchAll($select);            
        }

        return array();
    } // }}}

    /**
     * Retrieve identifiers of public directories.
     *
     * @param  int $drive_id OPTIONAL
     * @param  bool $inherited OPTIONAL
     * @return int[]
     */
    public function getPublicDirIds($drive_id = null, $inherited = true) // {{{
    {
        $dirs_table = $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_DIRS);
        $dir_ids = array();

        $select = $this->_createSelect();
        $select->from(
            array('dirs' => $dirs_table),
            'dir_id'
        );
        $select->where('visibility = ?', Drive_DirVisibility::VIS_PUBLIC);

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
                $select->where('visibility = ?', Drive_DirVisibility::VIS_INHERITED);
                $select->where('parent_id IN (?)', $parent_ids);

                $parent_ids = array_column(
                    $select->query(Zend_Db::FETCH_ASSOC)->fetchAll(),
                    'dir_id'
                );
            }
        }

        return $dir_ids;
    } // }}}

    /**
     * Retrieve identifiers of directories that are shared with the user
     * of given ID.
     *
     * @param  int $userId
     * @param  bool $inherited OPTIONAL
     * @return int[]
     */
    public function getSharedWithUserDirIds($user_id, $inherited = true) // {{{
    {
        $user_id = (int) $user_id;
        $dir_ids = array();

        $dirs_table = $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_DIRS);
        $dir_shares_table = $this->_tableProvider->tableName(Drive_Model_TableNames::TABLE_DIR_SHARES);

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
            'dir_shares.user_id IS NOT NULL OR dirs.visibility = ?', Drive_DirVisibility::VIS_USERSONLY
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
                $select->where('visibility = ?', Drive_DirVisibility::VIS_INHERITED);
                $select->where('parent_id IN (?)', $parent_ids);

                $parent_ids = array_column(
                    $select->query(Zend_Db::FETCH_ASSOC)->fetchAll(),
                    'dir_id'
                );
            }
        }

        return $dir_ids;
    } // }}}

    protected function _createSelect()
    {
        return Zefram_Db_Select::factory($this->_tableProvider->getAdapter());
    }
}
