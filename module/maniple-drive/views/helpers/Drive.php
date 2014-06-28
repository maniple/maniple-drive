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
            $url = $this->view->url('drive.browser', array('path' => $path), false, false);
        } else {
            $url = preg_replace('/#.*$/', '', $this->view->url($route)) . '#' . $path;
        }
        return $url;
    }
}
