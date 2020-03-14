<?php

// copy this file to application/configs/autoload to override default settings

return array(
    'drive.security' => array(
        'class' => 'ManipleDrive_Access_Manager',
        'args' => array(
            'securityContext' => 'resource:core.security',
            'db' => 'resource:Zefram_Db',
        ),
    ),
);
