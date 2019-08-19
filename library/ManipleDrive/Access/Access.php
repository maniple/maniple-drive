<?php

abstract class ManipleDrive_Access_Access
{
    const ACCESS_NONE   = 0x0000;
    const ACCESS_READ   = 0x0001;
    const ACCESS_WRITE  = 0x0002;
    const ACCESS_RENAME = 0x0004;
    const ACCESS_DELETE = 0x0008;
    const ACCESS_SHARE  = 0x0010;
    const ACCESS_ALL    = 0xFFFF;

    /**
     * @param int $value
     * @return bool
     */
    public static function canRead($value)
    {
        return (bool) ($value & self::ACCESS_READ);
    }

    /**
     * @param int $value
     * @return bool
     */
    public static function canWrite($value)
    {
        return (bool) ($value & self::ACCESS_WRITE);
    }

    /**
     * @param int $value
     * @return bool
     */
    public static function canRename($value)
    {
        return (bool) ($value & self::ACCESS_RENAME);
    }

    /**
     * @param int $value
     * @return bool
     */
    public static function canDelete($value)
    {
        return (bool) ($value & self::ACCESS_DELETE);
    }

    /**
     * @param int $value
     * @return bool
     */
    public static function canShare($value)
    {
        return (bool) ($value & self::ACCESS_SHARE);
    }
}
