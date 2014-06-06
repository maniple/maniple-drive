<?php

class Drive_FileStorage
{
    public static function requireStorageDir($name = null) // {{{
    {
        return self::_requireWritableDir(APPLICATION_PATH . '/../storage', $name);
    } // }}}

    public static function requireCacheDir($name = null) // {{{
    {
        return self::_requireWritableDir(VARIABLE_PATH . '/cache', $name);
    } // }}}

    public static function requireTempDir($name = null) // {{{
    {
        return self::_requireWritableDir(APPLICATION_PATH . '/../variable/temp', $name);
    } // }}}

    public static function requireDirAccess($path) // {{{
    {
        if (!is_dir($path) || !is_readable($path) || !is_writable($path)) {
            throw new Exception(sprintf("Directory '%s' is not readable or writable", $path));
        }
    } // }}}

    /**
     * Returned directory path contains a trailing slash.
     * Files with the same path as required directory path are removed and
     * replaced with given directory.
     * @param string $path
     *     directory path
     * @param string $name
     *     subdirectory name. Any slashes and backslashes are removed.
     */
    protected static function _requireWritableDir($path, $name = null) // {{{
    {
        if (null !== $name) {
            $name = self::sanitizePath($name, true);
            $parts = explode('/', $name);
        } else {
            $parts = null;
        }

        self::requireDirAccess($path);

        // recursively check for existence of directories,create directory
        // and assign proper permissions when needed
        while ($parts) {
            $path .= '/' . array_shift($parts);

            if (!is_dir($path)) {
                if (file_exists($path)) {
                    @unlink($path);
                }

                @mkdir($path);
                // mkdir is affected by umask, asasign proper permissions afterwards
                if (is_dir($path)) {
                    chmod($path, 0777);
                }
            }

            self::requireDirAccess($path);
        }

        return rtrim(realpath($path), '/') . '/';
    } // }}}

    public static function sanitizePath($path, $allowDirs = true) // {{{
    {
        $path = trim(str_replace('\\', '/', $path), '/');

        if (empty($path)) {
            throw new InvalidArgumentException('Path must not be empty');
        }

        if (false !== strpos($path, '../')) {
            throw new InvalidArgumentException('Upward directory traversal is not allowed');
        }

        if (!$allowDirs && strpos($path, '/')) {
            throw new InvalidArgumentException('Directory traversal is not allowed');
        }

        return $path;
    } // }}}
}
