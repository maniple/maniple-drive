<?php

class Drive_Bootstrap extends Zend_Application_Module_Bootstrap
{
    public function getRoutes()
    {
        return require dirname(__FILE__) . '/configs/routes.config.php';
    }
}
