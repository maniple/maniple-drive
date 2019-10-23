<?php

// copy this file to application/configs/autoload to override default settings

return array(
    'drive.manager' => array(
        'args' => array(
            'db' => null,
            'securityContext' => null,
            'security' => 'resource:drive.security',
        ),
    ),
    'drive.helper' => array(
        'options' => array(
            'securityContext' => null,
            'tableProvider'   => null,
            'userSearchRoute' => null,
            'security'        => 'resource:drive.security',
        ),
    ),
    'drive.security' => array(
        'class' => 'ManipleDrive_Access_Manager',
        'args' => array(
            'securityContext' => 'resource:core.security',
            'db' => 'resource:Zefram_Db',
        ),
    ),
);
