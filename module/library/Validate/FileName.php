<?php

/**
 * Sprawdzanie poprawnosci nazwy pliku.
 *
 * @version 2012-10-23
 */
class Drive_Validate_FileName extends Zend_Validate_Abstract
{
    const INVALID_CHARS = 'invalidChars';

    protected $_messageTemplates = array(
        self::INVALID_CHARS => 'Podana nazwa zawiera niedozwolone znaki: \ / : * ? " < > |',
    );

    public function isValid($value)
    {
        $valid = true;

        if (preg_match('#[\\\/:*?"<>|]#', $value)) {
            $this->_error(self::INVALID_CHARS);
            $valid = false;
        }

        return $valid;
    }
}
