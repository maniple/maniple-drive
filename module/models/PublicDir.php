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
                'dir_id' => 'public',
                'dir_key' => null,
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
                'drive_id' => null,
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
        // fetch all top-level dirs that contain public entries
        $select = Zefram_Db_Select::factory($this->getAdapter());
        $select->from(array('dirs' => $this->getTable()));
        $select->join(
            array('drives' => $this->_getTableFromString('Drive_Model_DbTable_Drives')),
            'drives.root_dir = dirs.dir_id',
            array()
        );
        $select->where('0 < ?',
            Zefram_Db_Select::factory($this->getAdapter())
            ->from(
                $this->getTable(),
                new Zend_Db_Expr('COUNT(1)')
            )
            ->where('visibility = ?', 'public')
            ->where('drive_id = drives.drive_id')
        );
        $select->order('dirs.name');

        $rows = $this->getTable()->fetchAll($select);

        // teraz zamieniamy z Model_Dir na PublicSubdir - zeby tamten wylawial
        // tylko publiczne wpisy
        $result = array();
        foreach ($rows as $row) {
            $result[] = new Drive_Model_PublicSubdir($this->getTable(), $row->toArray());
        }

        return $result;
    }

    public function findChild($child_id)
    {
        $db = $this->getTable()->getAdapter();

        $select = Zefram_Db_Select::factory($this->getAdapter());
        $select->from(array('dirs' => $this->getTable()));
        $select->join(
            array('drives' => $this->_getTableFromString('Drive_Model_DbTable_Drives')),
            'drives.root_dir = dirs.dir_id',
            array()
        );
        $select->where('dirs.dir_id = ?', (int) $child_id);
        $select->where('0 < ?',
            Zefram_Db_Select::factory($this->getAdapter())
            ->from(
                $this->getTable(),
                new Zend_Db_Expr('COUNT(1)')
            )
            ->where('visibility = ?', 'public')
            ->where('drive_id = drives.drive_id')
        );
        $select->order('dirs.name');

        return $this->getTable()->fetchRow($select);
    }

    public function save()
    {
        throw new Exception();
    }
}
