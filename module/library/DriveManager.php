<?php

class ManipleDrive_DriveManager
{
    /**
     * @var ManipleDrive_Model_Repository
     */
    protected $_repository;

    /**
     * @var Maniple_Security_ContextInterface
     */
    protected $_securityContext;

    /**
     * @param  ManipleDrive_Model_Repository|Zefram_Db_Table_FactoryInterface $repository
     * @return void
     */
    public function __construct($repository, $securityContext) // {{{
    {
        if ($repository instanceof Zefram_Db_Table_FactoryInterface) {
            $repository = new ManipleDrive_Model_Repository($repository);
        }
        if (!$repository instanceof ManipleDrive_Model_Repository) {
            throw new InvalidArgumentException('Repository must be an instance of ManipleDrive_Model_Repository or a Zefram_Db_Table_FactoryInterface');
        }
        $this->_repository = $repository;
        $this->_securityContext = $securityContext;
    } // }}}

    /**
     * @param  ManipleDrive_Model_DirInterface|ManipleDrive_Model_File $dirEntry
     * @param  bool $systemContext OPTIONAL
     * @return bool
     * @throws InvalidArgumentException
     */
    public function isWritable($dirEntry, $systemContext = false)
    {
    }

    /**
     * @param  ManipleDrive_Model_DirInterface|ManipleDrive_Model_File $dirEntry
     * @param  bool $recursive OPTIONAL
     * @return ManipleDrive_Model_DirInterface|ManipleDrive_Model_File
     */
    public function copy($dirEntry, ManipleDrive_Model_DirInterface $targetDir, $recursive = true)
    {
        
    }

    /**
     * Saves file in a given directory.
     *
     * @param  ManipleDrive_Model_Dir $dir
     * @param  ManipleDrive_Model_File|Zefram_File_Download|Zend_File_Transfer_Adapter_Abstract $file
     * @param  string $key OPTIONAL
     * @return ManipleDrive_Model_File
     */
    public function saveFile(ManipleDrive_Model_Dir $dir, ManipleDrive_Model_File $file, $systemContext = false) // {{{
    {
        if (!$systemContext) {
            // TODO dir must be writable
        }

        $file->Dir = $dir;
        $file->save();

        return $file;
    } // }}}

    /**
     * @param  ManipleDrive_Model_Dir $dir
     * @param  Zend_File_Transfer_Adapter_Abstract $transfer
     * @param  string $key
     * @param  bool $systemContext OPTIONAL
     * @return ManipleDrive_Model_File
     */
    public function saveFileFromTransfer(ManipleDrive_Model_Dir $dir, Zend_File_Transfer_Adapter_Abstract $transfer, $key, $systemContext = false) // {{{
    {
        if (!$systemContext) {
            // TODO dir must be writable
        }

        $key = (string) $key;
        $filename = $transfer->getFileName($key, false);

        // generate temporary file name for preliminary processing
        // before writing uploaded file to storage
        $tempname = $this->getUploadTempName();
        $transfer->addFilter(new Zend_Filter_File_Rename(array(
            'target' => $tempname,
            'overwrite' => true,
        )));

        if ($transfer->receive($key)) {
            chmod($tempname, 0444);

            // get information about uploaded file, restore its original name
            $fileinfo = $transfer->getFileInfo($key);
            $fileinfo = reset($fileinfo);
            $fileinfo['name'] = basename($filename);
        } else {
            throw new Exception('Unable to receive file contents');
        }
        return $this->_saveFileInfo($dir, $fileinfo);
    } // }}}

    /**
     * @param  ManipleDrive_Model_Dir $dir
     * @param  Zefram_File_Download $download
     * @param  bool $systemContext OPTIONAL
     * @return ManipleDrive_Model_File
     */
    public function saveFileFromDownload(ManipleDrive_Model_Dir $dir, Zefram_File_Download $download, $systemContext = false) // {{{
    {
        if (!$systemContext) {
            // TODO dir must be writable
        }

        if ($file->download()) {
            $fileinfo = $download->getFileInfo();
        } else {
            throw new Exception('Unable to receive file contents');
        }
        return $this->_saveFileInfo($dir, $fileinfo);
    } // }}}

    protected function _saveFileInfo($dir, $fileinfo)
    {
        $name = trim($fileinfo['name']);

        // remove trailing dots from file name, as files with trailing dots
        // are unremovable by Windows Explorer
        $name = rtrim($name, '.');

        // check if file name contains valid chars only
        $name = preg_replace('#[\/:*?"<>|]#', '', $name);

        if (!strlen($name)) {
            throw new InvalidArgumentException('Invalid file name');
        }
        $fileinfo['name'] = $name;

        $fileinfo['owner'] = $this->_securityContext->getUser()->getId();
        $fileinfo['created_by'] = $this->_securityContext->getUser()->getId();
        $fileinfo['modified_by'] = $this->_securityContext->getUser()->getId();

        $file = $dir->saveFile($fileinfo['tmp_name'], $fileinfo);
        return $file;
    }


    /**
     * @return string
     */
    public function getUploadTempName() // {{{
    {
        $prefix = sprintf('%08d.', Zefram_Math_Rand::getInteger());
        return Zefram_Os::getTempDir() . '/' . uniqid($prefix, true);
    } // }}}
}
