<?php return array(
    'ManipleDrive_DriveManager' => array(
        'class' => 'ManipleDrive_DriveManager',
        'args' => array(
            'db' => 'resource:Zefram_Db',
            'securityContext' => 'resource:ManipleUser_Service_Security',
        ),
    ),
    'drive.manager' => 'resource:ManipleDrive_DriveManager',

    'ManipleDrive_Helper' => array(
        'class' => 'ManipleDrive_Helper',
        'options' => array(
            'view'            => 'resource:view',
            'securityContext' => 'resource:ManipleUser_Service_Security',
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

    'ManipleDrive_Access_Manager' => array(
        'class' => 'ManipleDrive_Access_Manager',
        'args' => array(
            'securityContext' => 'resource:ManipleUser_Service_Security',
            'db' => 'resource:Zefram_Db',
        ),
    ),
    'drive.security' => 'resource:ManipleDrive_Access_Manager',

    'ManipleDrive.JsBundle' => array(
        'class' => 'ManipleDrive_Service_JsBundle',
        'args' => array(
            'resource:SharedEventManager',
            'resource:View',
        ),
    ),
);
