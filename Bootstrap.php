<?php

class ManipleDrive_Bootstrap extends Maniple_Application_Module_Bootstrap
    implements Maniple_Menu_MenuManagerProviderInterface, ManipleRequirejs_ConfigProviderInterface

{
    public function getModuleDependencies()
    {
        return array('maniple-user', 'maniple-requirejs');
    }

    public function getRoutesConfig()
    {
        return require __DIR__ . '/configs/routes.config.php';
    }

    public function getResourcesConfig()
    {
        return require __DIR__ . '/configs/resources.config.php';
    }

    public function getTranslationsConfig()
    {
        return array(
            'scan'    => Zend_Translate::LOCALE_DIRECTORY,
            'content' => __DIR__ . '/languages',
        );
    }

    public function getViewConfig()
    {
        return array(
            'scriptPaths' => __DIR__ . '/views/scripts',
            'helperPaths' => array(
                'ManipleDrive_View_Helper_' => __DIR__ . '/library/ManipleDrive/View/Helper/',
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
        $viewRenderer->setViewScriptPathSpec(':module/:controller/:action.:suffix', 'maniple-drive');
        $viewRenderer->setViewSuffix('twig', 'maniple-drive');
    }

    protected function _initEntityManager()
    {
        /** @var \ManipleDoctrine\Config $config */
        $config = $this->getApplication()->getResource('EntityManager.config');
        if ($config) {
            $config->addPath(__DIR__ . '/library/ManipleDrive/Entity');
        }
    }

    public function getRequireJsConfig()
    {
        return array(
            'paths' => array(
                'handlebars.runtime'    => 'bower_components/handlebars/handlebars.runtime.amd.min',
                'jquery'                => 'bower_components/jquery/dist/jquery.min',
                'jquery.magnific-popup' => 'bower_components/magnific-popup/dist/jquery.magnific-popup.min',
            ),
            'shim' => array(
                'jquery' => 'window.jQuery',
            ),
        );
    }

    protected function _initViewAssets()
    {
        /** @var Zefram_View_Abstract $view */
        $view = $this->getApplication()->bootstrap('View')->getResource('View');
        $view->headScript()->appendFile($view->baseUrl('bower_components/jquery/dist/jquery.min.js'));
    }

    public function getMenuManagerConfig()
    {
        return array(
            'builders' => array(
                ManipleDrive_Menu_MenuBuilder::className,
            ),
        );
    }
}
