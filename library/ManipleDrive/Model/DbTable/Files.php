<?php

class ManipleDrive_Model_DbTable_Files extends Zefram_Db_Table
{
    const className = __CLASS__;

    protected $_name = ManipleDrive_Model_TableNames::TABLE_FILES;

    protected $_rowClass = 'ManipleDrive_Model_File';

    protected $_referenceMap = array(
        'Dir' => array(
            'columns'       => 'dir_id',
            'refTableClass' => ManipleDrive_Model_DbTable_Dirs::className,
            'refColumns'    => 'dir_id',
        )
    );
}
