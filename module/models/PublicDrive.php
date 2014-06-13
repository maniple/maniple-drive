<?php

class Drive_Model_PublicDrive implements Drive_Model_DriveInterface
{
    protected $_tableFactory;

    protected $_rootDir;

    public function __construct($tableFactory)
    {
        $this->_tableFactory = $tableFactory;
    }

    public function getId()
    {
        return 'public';
    }

    public function getRootDir()
    {
        if (null === $this->_rootDir) {
            $this->_rootDir = new Drive_Model_PublicRootDir($this->_tableFactory);
        }
        return $this->_rootDir;
    }

    public function getQuota()
    {
        return 0;
    }

    public function getUsage()
    {
        return 0;
    }
}
