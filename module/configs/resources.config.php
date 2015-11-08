<?php return array(
    'drive.manager' => array(
        'class' => 'ManipleDrive_DriveManager',
        'args' => array(
            'db' => null,
            'securityContext' => null,
            'security' => 'resource:drive.security',
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
            'security'        => 'resource:drive.security',
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
    'drive.security' => array(
        'class' => 'ManipleDrive_Access_Manager',
        'args' => array(
            'securityContext' => 'resource:core.security',
            'db' => 'resource:ZeframDb',
        ),
    ),
);
