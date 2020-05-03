<?php

class ManipleDrive_View_Helper_Drive extends Maniple_View_Helper_Abstract
{
    /**
     * @var ManipleDrive_Helper
     * @Inject
     */
    protected $_driveHelper;

    /**
     * @var bool
     */
    protected $_attached = false;

    public function drive()
    {
        if (!$this->_attached) {
            $this->view->headLink()->appendStylesheet($this->view->asset('css/drive.css', 'maniple-drive'));
            $this->view->headScript()->appendFile(
                $this->view->baseUrl('bower_components/jquery-ui.autocomplete/jquery-ui.autocomplete.js')
            );
            $this->view->headScript()->appendFile(
                $this->view->baseUrl('bower_components/jquery-ui.autocomplete-enhanced/jquery-ui.autocomplete.min.js')
            );
            $this->_attached = true;
        }
        return $this;
    }

    public function browseUrl($path, $url = null, array $params = array())
    {
        if ($path instanceof ManipleDrive_Model_DirInterface) {
            $path = $path->getId();
        }
        $path = '/' . trim($path, '/');
        if (null === $url) {
            $url = $this->view->urlTemplate('drive.browser');
            $url = str_replace(':path', $path, $url);
        } else {
            try {
                $url = $this->view->url($url, $params);
            } catch (Zend_Controller_Router_Exception $e) {
            }
            $url = preg_replace('/#.*$/', '', $url) . '#' . $path;
        }
        return $url;
    }

    /**
     * @return string
     */
    public function jsLib()
    {
        try {
            $locale = (string) $this->view->translate()->getLocale();
        } catch (Exception $e) {
            $locale = 'en';
        }

        /** @var ManipleDrive_Service_JsBundle $jsBundle */
        $jsBundle = $this->getResource('ManipleDrive.JsBundle');
        return $jsBundle->getUrl($locale);
    }

    public function dirBrowserConfig(array $config)
    {
        return Zefram_Json::encode($this->getDirBrowserConfig($config));
    }

    public function getDirBrowserConfig(array $config)
    {
        $default = array();
        $default['uriTemplates'] = array(
            'dir' => array(
                'read'   => $this->view->urlTemplate('drive.browse'),
                'create' => $this->view->urlTemplate('drive.dir', array('action' => 'create')),
                'remove' => $this->view->urlTemplate('drive.dir', array('action' => 'remove')),
                'rename' => $this->view->urlTemplate('drive.dir', array('action' => 'rename')),
                'share'  => $this->view->urlTemplate('drive.dir', array('action' => 'share')),
                'move'   => $this->view->urlTemplate('drive.dir', array('action' => 'move')),
                'chown'  => $this->view->urlTemplate('drive.dir', array('action' => 'chown')),
                'upload' => $this->view->urlTemplate('drive.dir', array('action' => 'upload')),
            ),
            'file' => array(
                'read'   => $this->view->urlTemplate('drive.file', array('action' => 'read')),
                'edit'   => $this->view->urlTemplate('drive.file', array('action' => 'edit')),
                'remove' => $this->view->urlTemplate('drive.file', array('action' => 'remove')),
                'rename' => $this->view->urlTemplate('drive.file', array('action' => 'rename')),
                'move'   => $this->view->urlTemplate('drive.file', array('action' => 'move')),
                'chown'  => $this->view->urlTemplate('drive.file', array('action' => 'chown')),
            ),
        );

        $bootstrap = Zend_Controller_Front::getInstance()->getParam('bootstrap');
        $userSearchRoute = (string) $bootstrap->getResource('drive.helper')->getUserSearchRoute();
        $default['userSearchUrl'] = $userSearchRoute ? $this->view->url($userSearchRoute) : null;

        $config = Zefram_Stdlib_ArrayUtils::merge($default, $config);

        return $config;
    }

    /**
     * @param  ManipleDrive_Model_EntryInterface $file
     * @param  ManipleDrive_Model_DirInterface $stopAtDir OPTIONAL
     * @return string
     */
    public function filePath(ManipleDrive_Model_EntryInterface $file, $stopAtDir = null)
    {
        $parts = array();
        $dir = $file;
        while ($dir) {
            if ($stopAtDir && $dir->getId() == $stopAtDir->getId()) {
                break;
            }
            array_unshift($parts, $dir->getName());
            $dir = $dir->getParent();
        }
        $path = implode('/', $parts);
        return $path;
    }

    /**
     * @param  ManipleDrive_Model_File $file
     * @return string
     */
    public function fileUrl(ManipleDrive_Model_File $file)
    {
        $path = $this->filePath($file);
        $path = implode('/', array_map('urlencode', explode('/', $path)));

        // + (encoded space) is not properly handled when saving file to disk
        $path = str_replace('+', '%20', $path);

        $url = rtrim($this->view->baseUrl(), '/') . '/!' . $path;
        return $this->view->serverUrl() . $url;
    }

    /**
     * @param string $name
     * @return mixed
     */
    public function getResource($name)
    {
        $bootstrap = Zend_Controller_Front::getInstance()->getParam('bootstrap');
        return $bootstrap->getResource($name);
    }

    /**
     * @param ManipleDrive_Model_DirInterface|null $dir
     * @param array|string $config
     * @param string $template
     * @return mixed
     */
    public function browser(ManipleDrive_Model_DirInterface $dir = null, $config = null, $template = null)
    {
        if (is_string($config)) {
            $template = $config;
            $config = array();
        }

        if (empty($template)) {
            $template = array('maniple-drive/helper/dir-browser-template.twig', 'maniple-drive');
        }

        $template = (array) $template + array(1 => null);

        if (!is_array($config)) {
            $config = array();
        }

        $selector = isset($config['selector']) ? $config['selector'] : '#drive-dir-browser';
        unset($config['selector']);

        if ($dir) {
            $dirBrowser = new ManipleDrive_DirBrowser($this->_driveHelper);
            $dirViewModel = $dirBrowser->browseDir($dir);
        } else {
            $dirViewModel = null;
        }

        $this->drive();
        return $this->view->renderScript('maniple-drive/helper/dir-browser.twig', 'maniple-drive', array(
            'template' => $template,
            'selector' => $selector,
            'dir' => $dirViewModel,
            'dirBrowserConfig' => $this->getDirBrowserConfig($config),
        ));
    }
}
