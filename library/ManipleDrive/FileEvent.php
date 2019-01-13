<?php

class ManipleDrive_FileEvent extends Zend_EventManager_Event
{
    const className = __CLASS__;

    /**
     * @var ManipleDrive_Model_FileInterface
     */
    protected $_file;

    /**
     * @return ManipleDrive_Model_FileInterface
     */
    public function getFile()
    {
        return $this->_file;
    }

    /**
     * @param ManipleDrive_Model_FileInterface $file
     * @return $this
     */
    public function setFile(ManipleDrive_Model_FileInterface $file)
    {
        $this->_file = $file;
        return $this;
    }

    /**
     * @param int|string $name
     * @param mixed $default
     * @return mixed
     */
    public function getParam($name, $default = null)
    {
        switch ($name) {
            case 'file':
                return $this->getFile();
            default:
                return parent::getParam($name, $default);
        }
    }
}
