<?php

/**
 * Sharing setting enum
 */
abstract class ManipleDrive_Model_Sharing
{
    const SHARING_PUBLIC    = 'public';
    const SHARING_PRIVATE   = 'private';
    const SHARING_USERS     = 'usersonly';
    const SHARING_INHERITED = 'inherited';

    /**
     * Returns all sharing constants
     * @return array
     */
    public static function getConstants()
    {
        return array(
            self::SHARING_PUBLIC,
            self::SHARING_PRIVATE,
            self::SHARING_USERS,
            self::SHARING_INHERITED,
        );
    }

    /**
     * Check if value corresponds to a sharing constant
     * @param string $value
     * @return bool
     */
    public static function isValid($value)
    {
        return in_array($value, self::getConstants(), true);
    }
}