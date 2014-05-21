<?php

class Drive_Bootstrap extends Zend_Application_Module_Bootstrap
{
    public function getRoutes()
    {
        return require dirname(__FILE__) . '/configs/routes.config.php';
    }

    public function getResourcesConfig()
    {
        return array(
            'drive.helper' => array(
                'class' => 'Drive_Helper',
                'params' => array(
                    'security'      => 'resource:core.security',
                    'view'          => 'resource:view',
                    'tableProvider' => null,
                    'userMapper'    => null,
                ),
            ),
        );
    }
}
