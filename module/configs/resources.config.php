<?php return array(
    'drive.manager' => array(
        'class' => 'ManipleDrive_DriveManager',
        'args' => array(
            'db' => null,
            'securityContext' => null,
        ),
    ),
    'drive.helper' => array(
        'class' => 'ManipleDrive_Helper',
        'options' => array(
            'view'            => 'resource:view',
            'securityContext' => null,
            'tableProvider'   => null,
            'userMapper'      => null,
            'userSearchRoute' => null,
        ),
    ),
    'drive.file_indexer' => array(
        'class' => 'ManipleDrive_FileIndexer',
        'params' => array(
            'index' => array(
                'class' => 'ManipleDrive_FileIndexer_NullIndex',
            ),
        ),
    ),
);
