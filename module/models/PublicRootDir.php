<?php

class Drive_Model_PublicRootDir implements Drive_Model_DirInterface
{
    protected $_tableFactory;

    public function __construct($tableFactory)
    {
        $this->_tableFactory = $tableFactory;
    }

    public function getId()
    {
        return 'public';
    }

    public function getName()
    {
        return 'Public';
    }

    public function isReadable($userId)
    {
        return true;
    }

    public function isWritable($userId)
    {
        return false;
    }

    public function isMovable($userId)
    {
        return false;
    }

    public function isRemovable($userId)
    {
        return false;
    }

    public function isShareable($userId)
    {
        return false;
    }

    public function getSubdirs()
    {
        $select = $this->_createSubdirSelect();
        // must return PublicDir(drive_id, tableFactory)
        return $select->query()->fetchAll();
    }

    public function getSubdir($dirId)
    {
        $select = $this->_createSubdirSelect();
        $select->where('dirs.dir = ?', (int) $dirId);
        $select->limit(1);
        return $select->query()->fetchRow();
    }

    protected function _createSubdirSelect()
    {
        // this SELECT chooses root dirs of drives that contain public dirs
        // (dirs with visibility = 'public')
        $tableFactory = $this->_tableFactory;
        $dbAdapter = $tableFactory->getAdapter();

        $select = Zefram_Db_Select::factory($dbAdapter);
        $select->from(
            array(
                'dirs' => $tableFactory->getTable('Drive_Model_DbTable_Dirs')
            )
        );
        $select->join(
            array(
                'drives' => $tableFactory->getTable('Drive_Model_DbTable_Drives')
            ),
            'drives.root_dir = dirs.dir_id',
            array()
        );
        $select->where('0 < ?',
            Zefram_Db_Select::factory($dbAdapter)
            ->from(
                $tableFactory->getTable('Drive_Model_DbTable_Dirs'),
                new Zend_Db_Expr('COUNT(1)')
            )
            ->where('visibility = ?', 'public')
            ->where('drive_id = drives.drive_id')
        );
        $select->order('dirs.name');

        return $select;
    }

    public function getFiles()
    {
        return array();
    }
}
