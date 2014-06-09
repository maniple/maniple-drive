<?php

class Drive_Model_PublicDir extends Drive_Model_Dir
{
    protected $_userId;

    public function setUserId($userId = null)
    {
        $this->_userId = $userId;
        return $this;
    }

    public function getUserId()
    {
        return $this->_userId;
    }

    public function __construct($userId, Drive_Model_DbTable_Dirs $table)
    {
        parent::__construct(array(
            'table' => $table,
            'data' => array(
                'dir_id' => null,
                'name' => 'Public',
                'parent_id' => null,
                'owner' => $userId,
                'created_at' => null,
                'created_by' => null,
                'modified_at' => null,
                'modified_by' => null,
                'ctime' => null,
                'mtime' => null,
                'visibility' => 'private',
                'Drive' => null,
            ),
            'stored' => true,
        ));
        $this->setUserId($userId);
    }

    public function fetchFiles($where)
    {
        return array();
    }

    public function fetchSubDirs()
    {
        // fetch all dirs explicitly marked as public
        // and drive_id does not belong to user
        return $this->getTable()->fetchAll(array(
            'visibility = ?' => 'visible',
        ), array(
            'name'
        ));
    }

    public function save()
    {
        throw new Exception();
    }
}
