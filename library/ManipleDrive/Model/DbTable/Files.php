<?php

/**
 * @method ManipleDrive_Model_File findRow(mixed $id)
 * @method ManipleDrive_Model_File createRow(array $data = array(), string $defaultSource = null)
 */
class ManipleDrive_Model_DbTable_Files extends Zefram_Db_Table
{
    const className = __CLASS__;

    protected $_name = ManipleDrive_Model_TableNames::TABLE_FILES;

    protected $_rowClass = ManipleDrive_Model_File::className;

    protected $_referenceMap = array(
        'Dir' => array(
            'columns'       => 'dir_id',
            'refTableClass' => ManipleDrive_Model_DbTable_Dirs::className,
            'refColumns'    => 'dir_id',
        ),
        'CreatedByUser' => array(
            'columns'       => 'created_by',
            'refTableClass' => ManipleUser_Model_DbTable_Users::className,
            'refColumns'    => 'user_id',
        ),
    );

    /**
     * Retrieves all metadata of the given file
     *
     * @param ManipleDrive_Model_File $file
     * @return Zend_Db_Table_Rowset_Abstract
     */
    public function getFileMetas(ManipleDrive_Model_File $file)
    {
        /** @var ManipleDrive_Model_DbTable_FileMetas $fileMetasTable */
        $fileMetasTable = $this->_getTableFromString(ManipleDrive_Model_DbTable_FileMetas::className);
        return $fileMetasTable->fetchAll(array('file_id = ?' => intval($file->getId())));
    }
}
