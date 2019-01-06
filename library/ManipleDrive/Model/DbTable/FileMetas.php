<?php

/**
 * @method ManipleDrive_Model_FileMeta findRow(mixed $id)
 * @method ManipleDrive_Model_FileMeta createRow(array $data = array(), string $defaultSource = null)
 */
class ManipleDrive_Model_DbTable_FileMetas extends Zefram_Db_Table
{
    const className = __CLASS__;

    protected $_rowClass = ManipleDrive_Model_FileMeta::className;

    protected $_name = 'file_metas';

    protected $_referenceMap = array(
        'File' => array(
            'columns'       => 'file_id',
            'refTableClass' => ManipleDrive_model_File::className,
            'refColumns'    => 'file_id',
        )
    );
}
