<?php

/**
 * Sprawdzanie poprawnosci nazwy pliku.
 *
 * @version 2012-10-23
 */
class ManipleDrive_Validate_FileName extends Zend_Validate_Abstract
{
    const INVALID_CHARS = 'invalidChars';

    protected $_invalidChars = '\ / : * ? " < > |';

    protected $_messageTemplates = array(
        // Podana nazwa zawiera niedozwolone znaki:
        self::INVALID_CHARS => 'Name contains one or more invalid characters: %invalidChars%',
    );

    protected $_messageVariables = array(
        'invalidChars' => '_invalidChars',
    );

    public function isValid($value)
    {
        $valid = true;

        // remove spaces from invalid chars list, so that they won't match
        $invalidChars = str_replace(' ', '', $this->_invalidChars);

        if (preg_match('/[' . preg_quote($invalidChars, '/') . ']/i', $value)) {
            $this->_error(self::INVALID_CHARS);
            $valid = false;
        }

        return $valid;
    }
}
