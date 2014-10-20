<?php

/**
 * @version 2014-09-22
 */
class ManipleDrive_DriveManager
{
    /**
     * @var Zefram_Db
     */
    protected $_db;

    /**
     * @var ManipleDrive_Model_Repository
     */
    protected $_repository;

    /**
     * @var Maniple_Security_ContextInterface
     */
    protected $_securityContext;

    /**
     * @param  Zefram_Db $db
     * @return void
     */
    public function __construct(Zefram_Db $db, $securityContext) // {{{
    {
        $this->_db = $db;
        $this->_securityContext = $securityContext;
        $this->_repository = new ManipleDrive_Model_Repository($db->getTableFactory());
    } // }}}

    /**
     * Create drive with given name and optional properties.
     *
     * @param  string $name
     * @param  array $data OPTIONAL
     * @return ManipleDrive_Model_Drive
     */
    public function createDrive($name, array $data = null) // {{{
    {
        $this->_db->beginTransaction();

        try {
            $drive = $this->_getDrivesTable()->createRow();
            $drive->setFromArray((array) $data);
            $drive->setName($name);
            $drive->save();

            if ($data) {
                $special = array_intersect_key($data, array('internal_name' => null, 'is_system' => null));
                if ($special) {
                    $dir = $drive->RootDir;
                    $dir->setFromArray($special);
                    $dir->save();
                }
            }

            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        return $drive;
    } // }}}

    public function getDrives()
    {
        $dirs_table = $this->_getDirsTable();
        $drives_table = $this->_getDrivesTable();

        // fetch drives and their root dirs in one go
        $rows = Zefram_Db_Select::factory($this->_db->getAdapter())
            ->from(
                array('drives' => $drives_table->getName()),
                $drives_table->getColsForSelect('drive__')
            )
            ->joinLeft(
                array('dirs' => $dirs_table),
                'dirs.dir_id = drives.root_dir',
                $dirs_table->getColsForSelect('dir__')
            )
            ->order('dirs.name')
            ->query()
            ->fetchAll();

        foreach ($rows as $row) {
            $data = array();
            foreach ($row as $col => $value) {
                list($model, $prop) = explode('__', $col, 2);
                $data[$model][$prop] = $value;
            }
            $drive = $drives_table->_createStoredRow($data['drive']);
            $drive->RootDir = $dirs_table->_createStoredRow($data['dir']);

            $drives[$drive->drive_id] = $drive;
        }

        if ($drives) {
            $usages = $drives_table->getDiskUsageReport(array_keys($drives));
            foreach ($usages as $drive_id => $usage) {
                $drives[$drive_id]->setDiskUsage($usage);
            }
        }

        return $drives;
    }

    /**
     * @param  ManipleDrive_Model_Dir $parentDir
     * @param  string $name
     * @param  array $data OPTIONAL
     * @return ManipleDrive_Model_Dir
     */
    public function createDir(ManipleDrive_Model_Dir $parentDir, $name, array $data = null) // {{{
    {
        $this->_db->beginTransaction();

        try {
            $dir = $this->_getDirsTable()->createRow((array) $data);
            $dir->dir_id = null; // ensure auto incrementation
            $dir->name = (string) $name;
            $dir->ParentDir = $parentDir;
            $dir->Drive = $parentDir->Drive;
            $dir->save();

            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        return $dir;
    } // }}}

    /**
     * @param  ManipleDrive_Model_Dir $dir
     * @param  array $data OPTIONAL
     * @return ManipleDrive_Model_Dir
     */
    public function saveDir(ManipleDrive_Model_Dir $dir, array $data = null) // {{{
    {
        $this->_db->beginTransaction();

        try {
            if ($data) {
                $dir->setFromArray($data);
            }
            $dir->save();
            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        return $dir;
    } // }}}

    /**
     * @param  string $internalName
     * @param  bool $systemContext OPTIONAL
     * @return ManipleDrive_Model_Dir|null
     */
    public function getDirByInternalName($internalName, $systemContext = false) // {{{
    {
        $dir = $this->_getDirsTable()->fetchRow(array(
            'internal_name = ?' => (string) $internalName,
        ));
        if (!$systemContext) {
            // TODO dir must be readable
        }
        if ($dir) {
            return $dir;
        }
        return null;
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

    public function createFileFromString(ManipleDrive_Model_Dir $dir, $name, $contents)
    {
        throw new Exception(__METHOD__ . ' is not yet implemented');
    }

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
            throw new Exception('Unable to receive file contents: ' . $key);
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

    protected function _getDrivesTable()
    {
        return $this->_repository->getTableFactory()->getTable('ManipleDrive_Model_DbTable_Drives');
    }

    protected function _getDirsTable()
    {
        return $this->_repository->getTableFactory()->getTable('ManipleDrive_Model_DbTable_Dirs');
    }

    protected function _getFilesTable()
    {
        return $this->_repository->getTableFactory()->getTable('ManipleDrive_Model_DbTable_Files');
    }
}
