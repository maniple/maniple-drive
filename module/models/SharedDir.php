<?php

class Drive_Model_SharedDir extends Drive_Model_Dir
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

    public function fetchFiles($where)
    {
        return array();
    }

    public function fetchSubDirs()
    {
        $select = Zefram_Db_Select::factory($this->getAdapter());
        return $this->getTable()->fetchAll($select);
    }
}
