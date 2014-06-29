<?php

class ManipleDrive_View_Helper_Drive extends Zend_View_Helper_Abstract
{
    public function drive()
    {
        return $this;
    }

    public function browseUrl($path, $url = null)
    {
        $path = '/' . trim($path, '/');
        if (null === $url) {
            $url = $this->view->urlTemplate('drive.browser');
            $url = str_replace(':path', $path, $url);
        } else {
            $url = preg_replace('/#.*$/', '', $url) . '#' . $path;
        }
        return $url;
    }
}
