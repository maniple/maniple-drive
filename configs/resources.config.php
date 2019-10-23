<?php return array(
    'ManipleDrive_DriveManager' => array(
        'class' => 'ManipleDrive_DriveManager',
        'args' => array(
            'db' => 'resource:Zefram_Db',
            'securityContext' => 'resource:user.sessionManager',
            'security' => 'resource:drive.security',
        ),
    ),
    'drive.manager' => 'resource:ManipleDrive_DriveManager',

    'ManipleDrive_Helper' => array(
        'class' => 'ManipleDrive_Helper',
        'options' => array(
            'view'            => 'resource:view',
            'securityContext' => 'resource:user.sessionManager',
            'tableProvider'   => 'resource:tableManager',
            'userSearchRoute' => null,
            'security'        => 'resource:drive.security',
        ),
    ),
    'drive.helper' => 'resource:ManipleDrive_Helper',

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
            'db' => 'resource:Zefram_Db',
        ),
    ),
    'ManipleDrive.JsBundle' => array(
        'class' => 'ManipleDrive_Service_JsBundle',
        'args' => array(
            'resource:SharedEventManager',
            'resource:View',
        ),
    ),
);
