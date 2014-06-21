<?php

class ManipleDrive_Bootstrap extends Zend_Application_Module_Bootstrap
{
    public function getRoutes()
    {
        return require dirname(__FILE__) . '/configs/routes.config.php';
    }

    public function getResourcesConfig()
    {
        return array(
            'drive.helper' => array(
                'class' => 'ManipleDrive_Helper',
                'params' => array(
                    'view'            => 'resource:view',
                    'securityContext' => null,
                    'tableProvider'   => null,
                    'userMapper'      => null,
                    'userSearchRoute' => null,
                ),
            ),
        );
    }
}
