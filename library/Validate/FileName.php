<?php

/**
 * Sprawdzanie poprawnosci nazwy pliku.
 *
 * @version 2015-05-09 / 2012-10-23
 */
class ManipleDrive_Validate_FileName extends Zend_Validate_Abstract
{
    const EMPTY_NAME = 'emptyName';
    const INVALID_CHARS = 'invalidChars';

    protected $_invalidChars = '\ / : * ? " < > |';

    protected $_messageTemplates = array(
        self::EMPTY_NAME => 'Name cannot be empty',
        self::INVALID_CHARS => 'Name contains one or more invalid characters: %invalidChars%', // Podana nazwa zawiera niedozwolone znaki:
    );

    protected $_messageVariables = array(
        'invalidChars' => '_invalidChars',
    );

    public function isValid($value)
    {
        if (trim($value) === '') {
            $this->_error(self::EMPTY_NAME);
            return false;
        }

        // remove spaces from invalid chars list, so that they won't match
        $invalidChars = str_replace(' ', '', $this->_invalidChars);

        if (preg_match('/[' . preg_quote($invalidChars, '/') . ']/i', $value)) {
            $this->_error(self::INVALID_CHARS);
            return false;
        }

        return true;
    }

    /**
     * Returns first validation failure message
     *
     * @return string
     */
    public function getMessage()
    {
        return reset($this->_messages);
    }
}
