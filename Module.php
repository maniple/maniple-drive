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
                'resources' => array(
                    'frontController' => array(
                        'controllerDirectory' => array(
                            'maniple-drive' => __DIR__ . '/module/controllers',
                        ),
                    ),
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
                ),
            )
        );
    }

    public function getAssetsBaseDir()
    {
        return 'drive';
    }

    public function onBootstrap($e)
    {
        $sm = $e->getApplication()->getServiceManager();
        // echo '<pre>';print_r($sm->get('Config'));exit;
    }
}