<?php

class ManipleDrive_Bootstrap extends Maniple_Application_Module_Bootstrap
{
    public function getModuleDependencies()
    {
        return array('maniple-user');
    }

    public function getRoutesConfig()
    {
        return require dirname(__FILE__) . '/configs/routes.config.php';
    }

    public function getResourcesConfig()
    {
        return require dirname(__FILE__) . '/configs/resources.config.php';
    }

    public function getTranslationsConfig()
    {
        return array(
            'scan'    => Zend_Translate::LOCALE_DIRECTORY,
            'content' => dirname(__FILE__) . '/languages',
        );
    }

    public function getViewConfig()
    {
        return array(
            'scriptPaths' => dirname(__FILE__) . '/views/scripts',
            'helperPaths' => array(
                'ManipleDrive_View_Helper_' => dirname(__FILE__) . '/library/ManipleDrive/View/Helper/',
            )
        );
    }

    public function getAssetsBaseDir()
    {
        return 'drive';
    }

    /**
     * Setup view path spec
     */
    protected function _initViewRenderer()
    {
        /** @var Zefram_Controller_Action_Helper_ViewRenderer $viewRenderer */
        $viewRenderer = Zend_Controller_Action_HelperBroker::getStaticHelper('ViewRenderer');
        $viewRenderer->setViewScriptPathSpec(':controller/:action.:suffix', 'maniple-drive');
        // $viewRenderer->setViewSuffix('twig', 'maniple-drive');
    }

    protected function _initEntityManager()
    {
        /** @var \ManipleDoctrine\Config $config */
        $config = $this->getApplication()->getResource('EntityManager.config');
        if ($config) {
            $config->addPath(__DIR__ . '/library/ManipleDrive/Entity');
        }
    }
}
