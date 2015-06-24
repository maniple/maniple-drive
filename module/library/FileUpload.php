<?php

/**
 * A class representing file uploaded by user
 */
class ManipleDrive_FileUpload
    implements ManipleDrive_FileTransferInterface, ManipleDrive_FileInterface
{
    /**
     * @var ManipleDrive_Model_File
     */
    protected $_file;

    protected $_driveManager;

    protected $_dir;

    protected $_transfer;

    protected $_key;

    protected $_options;

    public function __construct(ManipleDrive_DriveManager $driveManager, ManipleDrive_Model_Dir $dir, Zend_File_Transfer_Adapter_Abstract $transfer, $key, $options = null)
    {
        $this->_driveManager = $driveManager;
        $this->_dir = $dir;
        $this->_transfer = $transfer;
        $this->_key = $key;
        $this->_options = $options;
    }

    /**
     * @return ManipleDrive_Model_File
     */
    public function getFile()
    {
        if ($this->_file === null) {
            $this->_file = $this->_driveManager->saveFileFromTransfer($this->_dir, $this->_transfer, $this->_key, $this->_options);
        }
        return $this->_file;
    }

    /**
     * @return bool
     */
    public function isSaved()
    {
        return $this->_file !== null;
    }

    public function getId()
    {
        return $this->getFile()->getId();
    }

    public function getName()
    {
        return $this->getFile()->getName();
    }

    public function getSize()
    {
        return $this->getFile()->getSize();
    }

    public function getMimeType()
    {
        return $this->getFile()->getMimeType();
    }
}