<?php

class ManipleDrive_Bootstrap extends Maniple_Application_Module_Bootstrap
{
    protected $_moduleDeps = array('maniple-core');

    protected $_moduleTasks = array('translations');

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
        return require dirname(__FILE__) . '/configs/resources.config.php';
    }
}
