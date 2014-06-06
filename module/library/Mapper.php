<?php

class Drive_Mapper
{
    protected $_tableProvider;

    public function __construct($tableProvider)
    {
        $this->_tableProvider = $tableProvider;
    }

    /**
     * @param  int $dir_id
     * @return Drive_Model_Dir
     */
    public function getDir($dir_id) // {{{
    {
        $dir_id = (int) $dir_id;
        $dir = $this->_tableProvider->getTable('Drive_Model_DbTable_Dirs')->findRow($dir_id);

        if (empty($dir)) {
            throw new Exception(sprintf('Katalog nie został znaleziony (%d)', $dir_id));
        }

        return $dir;
    } // }}}

    /**
     * @param  array $data OPTIONAL
     * @return Drive_Model_Dir
     */
    public function createDir(array $data = null) // {{{
    {
        $dir = $this->_tableProvider->getTable('Drive_Model_DbTable_Dirs')->createRow();
        if ($data) {
            $dir->setFromArray($data);
        }
        return $dir;
    } // }}}

    /**
     * @param  Drive_Model_Dir $dir
     * @return Drive_Model_Dir
     * @throws Exception
     */
    public function saveDir(Drive_Model_Dir $dir) // {{{
    {
        $db = $this->_tableProvider->getAdapter();
        $db->beginTransaction();

        try {
            $dir->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        return $dir;
    } // }}}
}
