<?php

class Drive_Model_PublicSubdir extends Drive_Model_Dir
{
    public function __construct(Drive_Model_DbTable_Dirs $table, array $data = array())
    {
        parent::__construct(array(
            'table' => $table,
            'data' => $data,
            'stored' => true,
        ));
    }

    public function fetchFiles($where)
    {
        return array();
    }

    public function fetchSubDirs()
    {
        // fetch all dirs explicitly marked as public
        $select = Zefram_Db_Select::factory($this->getAdapter());
        $select->from(array('dirs' => $this->getTable()));
        $select->where('drive_id = ?', (int) $this->drive_id);
        $select->where('visibility = ?', 'public');
        $select->order('name');
        return $this->getTable()->fetchAll($select);
    }

    public function findChild($child_id)
    {
        $db = $this->getTable()->getAdapter();

        // fetch a top-level dir having public entries
        $where = array(
            $db->quoteIdentifier($this->_idColumn) . ' = ?' => (int) $child_id,
            'visibility = ?' => 'public',
            'drive_id = ?' => (int) $this->drive_id,
        );
        return $this->getTable()->fetchRow($where);
    }
}
