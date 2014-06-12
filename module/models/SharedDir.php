<?php

class Drive_Model_SharedDir extends Drive_Model_Dir
{
    protected $_userId;

    public function __construct($userId, Drive_Model_DbTable_Dirs $table)
    {
        parent::__construct(array(
            'table' => $table,
            'data' => array(
                'dir_id' => 'shared',
                'dir_key' => null,
                'name' => 'Shared with me',
                'parent_id' => null,
                'owner' => $userId,
                'created_at' => null,
                'created_by' => null,
                'modified_at' => null,
                'modified_by' => null,
                'ctime' => null,
                'mtime' => null,
                'visibility' => 'private',
                'drive_id' => null,
                'Drive' => null,
            ),
            'stored' => true,
        ));
        $this->setUserId($userId);
    }

    public function setUserId($userId = null)
    {
        $this->_userId = $userId;
        return $this;
    }

    public function getUserId()
    {
        return $this->_userId;
    }

    public function fetchFiles($where)
    {
        return array();
    }

    public function fetchSubDirs()
    {
        $select = Zefram_Db_Select::factory($this->getAdapter());
        $select->from(array(
            'dirs' => $this->getTable()
        ));
        $select->joinLeft(
            array(
                'dir_shares' => $this->_getTableFromString('Drive_Model_DbTable_DirShares'),
            ),
            array(
                'dir_shares.dir_id = dirs.dir_id',
                'dir_shares.user_id = ?' => $this->getUserId(),
            ),
            array()
        );
        $select->whereParams(
            '(dir_shares.user_id IS NOT NULL) OR (visibility = :usersonly)',
            array(
                'private' => 'private',
                'usersonly' => 'usersonly',
            )
        );
        $select->order('name');

        return $this->getTable()->fetchAll($select);
    }

    public function findChild($child_id)
    {
        $select = Zefram_Db_Select::factory($this->getAdapter());
        $select->from(array(
            'dirs' => $this->getTable()
        ));
        $select->joinLeft(
            array(
                'dir_shares' => $this->_getTableFromString('Drive_Model_DbTable_DirShares'),
            ),
            array(
                'dir_shares.dir_id = dirs.dir_id',
                'dir_shares.user_id = ?' => $this->getUserId(),
            ),
            array()
        );
        $select->whereParams(
            '(dir_shares.user_id IS NOT NULL) OR (visibility = :usersonly)',
            array(
                'private' => 'private',
                'usersonly' => 'usersonly',
            )
        );
        $select->where('dir_shares.dir_id = ?', $child_id);
        $select->order('name');
        return $this->getTable()->fetchRow($select);
    }
}
