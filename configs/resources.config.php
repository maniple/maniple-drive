<?php return array(
    'drive.manager' => array(
        'class' => 'ManipleDrive_DriveManager',
        'args' => array(
            'db' => 'resource:ZeframDb',
            'securityContext' => 'resource:user.sessionManager',
            'security' => 'resource:drive.security',
        ),
    ),
    'drive.helper' => array(
        'class' => 'ManipleDrive_Helper',
        'options' => array(
            'view'            => 'resource:view',
            'securityContext' => 'resource:user.sessionManager',
            'tableProvider'   => 'resource:tableManager',
            'userMapper'      => 'resource:user.model.userMapper',
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
            'securityContext' => 'resource:user.sessionManager',
            'db' => 'resource:ZeframDb',
        ),
    ),
);
