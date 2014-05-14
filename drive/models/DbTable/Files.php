<?php

class Drive_Model_DbTable_Files extends Zefram_Db_Table
{
    protected $_name = 'drive_files';
    protected $_rowClass = 'Drive_Model_File';
    protected $_referenceMap = array(
        'Dir' => array(
            'columns'       => 'dir_id',
            'refTableClass' => 'Drive_Model_DbTable_Dirs',
            'refColumns'    => 'dir_id',
        )
    );
}
