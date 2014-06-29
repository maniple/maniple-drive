<?php

class ManipleDrive_View_Helper_Drive extends Zend_View_Helper_Abstract
{
    public function drive()
    {
        return $this;
    }

    public function browseUrl($path, $route = null)
    {
        $path = '/' . trim($path, '/');
        if (null === $route) {
            $url = $this->view->urlTemplate('drive.browser');
            $url = str_replace(':path', $path, $url);
        } else {
            $url = preg_replace('/#.*$/', '', $this->view->url($route)) . '#' . $path;
        }
        return $url;
    }
}
