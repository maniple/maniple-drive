<?php

/**
 * Walidator nazwy dysku.
 *
 * @version 2012-12-13
 * @author xemlock
 */
class ManipleDrive_Validate_DirNotExists extends Zend_Validate_Abstract
{
    const DIR_EXISTS = 'dirExists';

    protected $_messageTemplates = array(
        self::DIR_EXISTS => 'A directory with this name already exists',
    );

    /**
     * Wartosc poprawna, automatycznie przechodzaca walidacje.
     * Przydatne podczas edycji.
     * @var mixed
     */
    protected $_allowed;
    protected $_parentId;
    protected $_tableProvider;

    public function __construct(array $options = null)
    {
        if ($options) {
            $this->setOptions($options);
        }
    }

    public function setAllowed($allowed)
    {
        $this->_allowed = $allowed;
        return $this;
    }

    public function setParentId($parentId)
    {
        $this->_parentId = $parentId;
        return $this;
    }

    public function setTableProvider($tableProvider)
    {
        $this->_tableProvider = $tableProvider;
        return $this;
    }

    public function isValid($value)
    {
        $table_provider = $this->_tableProvider;

        if (null !== $this->_allowed && $value === $this->_allowed) {
            return true;
        }

        // Nazwa dysku przechowywana jest jako nazwa katalogu podpietego
        // jako korzen dysku. UNIQUE jest ustawiony w tabeli drive_dirs
        // na kolumnach (parent_id, name). Stad wystarczy sprawdzic czy
        // istnieje katalog o takiej samej nazwie i pustym katalogu
        // nadrzednym.
        $valid = true;
        $table = $this->_tableProvider->getTable('ManipleDrive_Model_DbTable_Dirs');

        $cond = array('name = ?' => $value);

        if (null === $this->_parentId) {
            $cond[] = 'parent_id IS NULL';
        } else {
            $cond['parent_id = ?'] = $this->_parentId;
        }

        if ($table->countAll($cond)) {
            $valid = false;
            $this->_error(self::DIR_EXISTS);
        }

        return $valid;
    }

    public function setOptions(array $options)
    {
        foreach ($options as $key => $value) {
            $method = 'set' . $key;
            if (method_exists($this, $method)) {
                $this->$method($value);
            }
        }
        return $this;
    }
}
