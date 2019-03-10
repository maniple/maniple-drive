<?php

class ManipleDrive_Service_JsBundle
{
    /**
     * @varZend_EventManager_EventManager
     */
    protected $_eventManager;

    /**
     * @var Zend_View_Interface
     */
    protected $_view;

    /**
     * @Inject('Maniple.AssetManager')
     * @var Maniple_Assets_AssetManager
     */
    protected $_assetManager;

    /**
     * @var string[]
     */
    protected $_pluginUrls = array();

    /**
     * @param Zend_EventManager_SharedEventManager $sharedEventManager
     * @param Zend_View_Interface $view
     */
    public function __construct(Zend_EventManager_SharedEventManager $sharedEventManager, Zend_View_Interface $view)
    {
        $this->_view = $view;

        $this->_eventManager = new Zend_EventManager_EventManager();
        $this->_eventManager->setSharedCollections($sharedEventManager);
        $this->_eventManager->setIdentifiers(array(
            __CLASS__,
            'ManipleDrive.JsBundle',
        ));
        $this->_eventManager->trigger('init', $this);
    }

    /**
     * @param string $pluginUrl
     * @return $this
     */
    public function addPlugin($pluginUrl)
    {
        $this->_pluginUrls[] = (string) $pluginUrl;
        return $this;
    }

    /**
     * @param string $locale
     * @return string
     */
    public function getUrl($locale = 'en')
    {
        if (count($this->_pluginUrls)) {
            return $this->_view->url('drive.js_bundle', array('locale' => $locale));
        }

        $locale = $this->_getLocale($locale);
        return $this->_assetManager->getAssetUrl('js/drive.' . $locale . '.js', 'maniple-drive');
    }

    /**
     * @param string $locale
     * @return string
     */
    public function renderSource($locale)
    {
        $locale = $this->_getLocale($locale);

        $deps = array_merge(
            array(
                $this->_assetManager->getAssetUrl('js/drive.' . $locale . '.js', 'maniple-drive'),
            ),
            $this->_pluginUrls
        );

        $source = sprintf(
            'define(%s, %s);',
            Zefram_Json::encode($deps, array('unescapedUnicode' => true, 'unescapedSlashes' => true)),
"function (Drive) {
    Array.prototype.slice.call(arguments, 1).forEach(Drive.DirBrowser.plugins.add);
    return Drive;
}"
        );

        return $source;
    }

    protected function _getLocale($locale)
    {
        try {
            $l = new Zefram_Locale((string) $locale);
            $locale = $l->toString();
        } catch (Zend_Locale_Exception $e) {
        }

        switch ($locale) {
            case 'pl':
                $locale = 'pl_PL';
                break;

            case 'en':
                $locale = 'en_GB';
                break;
        }

        if (!in_array($locale, array('en_GB', 'pl_PL'))) {
            $locale = 'en_GB';
        }

        return $locale;
    }
}
