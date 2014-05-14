<?php

class Drive_Bootstrap extends Zend_Application_Module_Bootstrap
{
    public function getRoutes()
    {
        return array(
            'drive.files.view_public' => array(
                'route' => '^!(?<path>([^/]+)(.*))$',
                'type'  => 'Zend_Controller_Router_Route_Regex',
                'defaults' => array(
                    'module' => 'drive',
                    'controller' => 'index',
                    'action'     => 'index',
                ),
                'map' => array(
                    'path'  => 1,
                ),
            ),
        );
    }
}
