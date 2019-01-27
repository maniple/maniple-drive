<?php

class ManipleDrive_View_Helper_Drive extends Zend_View_Helper_Abstract
{
    public function drive()
    {
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

        $config = array_replace_recursive($default, $config);

        return Zefram_Json::encode($config);
    }

    /**
     * @param  ManipleDrive_Model_File $file
     * @return string
     */
    public function filePath(ManipleDrive_Model_File $file, $stopAtDir = null)
    {
        $parts = array($file->name);
        $dir = $file->Dir;
        while ($dir) {
            if ($stopAtDir && $dir->dir_id == $stopAtDir->dir_id) {
                break;
            }
            array_unshift($parts, $dir->name);
            $dir = $dir->ParentDir;
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
}
