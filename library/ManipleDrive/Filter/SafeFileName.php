<?php

class ManipleDrive_Filter_SafeFileName implements Zend_Filter_Interface
{
    const ILLEGAL_CHARS_REGEX = '#[\\\/"?:*<>|]#';

    /**
     * Converts a string to a valid safe filename
     *
     * @param  string $name
     * @return string
     */
    public function filter($name)
    {
        return self::filterStatic($name);
    }

    /**
     * Static filter call
     *
     * @param $name
     * @return string
     */
    public static function filterStatic($name)
    {
        $name = preg_replace(self::ILLEGAL_CHARS_REGEX, '', $name);
        $name = preg_replace('#\s#', ' ', $name);

        // preg_replace(): Null byte in regex
        $name = str_replace("\x00", '', $name);

        $name = trim($name);

        // Limit name to 255 characters:
        // https://en.wikipedia.org/wiki/Ext4
        // https://msdn.microsoft.com/en-us/library/aa365247.aspx#maxpath
        $name = substr($name, 0, 255);

        // Remove dot suffix, as Windows doesn't play well with it:
        // https://superuser.com/questions/494959/how-to-delete-a-file-ending-in-a-dot-in-windows-7
        $name = rtrim($name, '. ');

        return $name;
    }
}
