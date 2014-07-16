<?php

class ManipleDrive_Bootstrap extends Maniple_Application_Module_Bootstrap
{
    protected $_moduleDeps = array('maniple-core');

    public function getAssetsBaseDir()
    {
        return 'drive';
    }

    public function getRoutesConfig()
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
