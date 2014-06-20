<?php

class Drive_View_Helper_Drive extends Zend_View_Helper_Abstract
{
    public function drive()
    {
        return $this;
    }

    public function browseUrl($path)
    {
        $path = '/' . trim($path, '/');
        return $this->view->url('drive.browser', array('path' => $path), false, false);
    }
}
