<?php

class Drive_Filter_NameNormalize implements Zend_Filter_Interface
{
    /**
     * @param  string $name
     * @return string
     */
    public function filter($name)
    {
        if (function_exists('mb_strtolower')) {
            $name = mb_strtolower($name);
        } else {
            $name = strtolower($name);
        }

        $name = preg_replace_callback('/(\d+)([.,]\d+)?/', array($this, '_replace'), $name);

        return $name;
    }

    protected function _replace(array $match)
    {
        // numbers are 0-padded to be at least 8 digits long
        return sprintf("%08d%s", $match[1], isset($match[2]) ? $match[2] : '');
    }
}
