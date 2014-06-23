<?php

class ManipleDrive_Model_DbTable_Files extends Zefram_Db_Table
{
    protected $_name = ManipleDrive_Model_TableNames::TABLE_FILES;

    protected $_rowClass = 'ManipleDrive_Model_File';

    protected $_referenceMap = array(
        'Dir' => array(
            'columns'       => 'dir_id',
            'refTableClass' => 'ManipleDrive_Model_DbTable_Dirs',
            'refColumns'    => 'dir_id',
        )
    );
}
