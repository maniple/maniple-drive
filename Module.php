<?php

namespace ManipleDrive;

class Module
{
    public function getModuleDependencies()
    {
        return array('ManipleCore');
    }

    public function getAutoloaderConfig()
    {
        return array(
            'Zend\Loader\StandardAutoloader' => array(
                'prefixes' => array(
                    'ManipleDrive_'       => __DIR__ . '/module/library',
                    'ManipleDrive_Model_' => __DIR__ . '/module/models',
                ),
            ),
        );
    }

    public function getConfig()
    {
        return array_merge(
            require __DIR__ . '/module/configs/resources.config.php',
            array(
                'router' => array(
                    'routes' => require __DIR__ . '/module/configs/routes.config.php',
                ),
                'view' => array(
                    'helperPath' => array(
                        'ManipleDrive_View_Helper_' => __DIR__ . '/module/library/View/Helper',
                    ),
                    'scriptPath' => array(
                        __DIR__ . '/module/views/scripts',
                    ),
                ),
            )
        );
    }

    public function getControllerDirectory()
    {
        return __DIR__ . '/module/controllers';
    }

    public function getAssetsBaseDir()
    {
        return 'drive';
    }
}