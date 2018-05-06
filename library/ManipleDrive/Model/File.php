<?php

class ManipleDrive_Model_File
    extends Zefram_Db_Table_Row
    implements ManipleDrive_Model_FileInterface
{
    protected $_tableClass = ManipleDrive_Model_DbTable_Files::className;

    /**
     * @return int
     */
    public function getId()
    {
        return (int) $this->file_id;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    public function getParent()
    {
        return $this->Dir;
    }

    public function getOwner()
    {
        return (int) $this->owner;
    }

    public function getSharing()
    {
        return $this->Dir->getSharing();
    }

    public function getAccessType()
    {
        return $this->Dir->getAccessType();
    }

    /**
     * @return int
     */
    public function getSize()
    {
        return +$this->size;
    }

    public function getMimeType()
    {
        return $this->mimetype;
    }

    public function save() // {{{
    {
        $filter = new ManipleDrive_Filter_NameNormalize;
        $this->name_normalized = $filter->filter($this->name);

        return parent::save();
    } // }}}

    protected function _insert() // {{{
    {
        $now = time();
        $this->ctime = $now;
        $this->mtime = $now;

        // no implicit owner

        $result = parent::_insert();

        ManipleDrive_Model_Dir::_updateCounters($this->Dir, 0, 1, $this->size);

        return $result;
    } // }}}

    protected function _update() // {{{
    {
        $this->mtime = time();

        if ($this->_cleanData['dir_id'] != $this->dir_id) {
            // fetch previous parent dir
            $dir = $this->_getTableFromString(ManipleDrive_Model_DbTable_Dirs::className)->findRow($this->_cleanData['dir_id']);
            if ($dir) {
                ManipleDrive_Model_Dir::_updateCounters($dir, 0, -1, -$this->size);
            }
            ManipleDrive_Model_Dir::_updateCounters($this->Dir, 0, 1, $this->size);
        }

        return parent::_update();
    } // }}}

    public function getPath() // {{{
    {
        $drives = $this->_getTableFromString(ManipleDrive_Model_DbTable_Drives::className);
        return $drives->getFilePath($this);
    } // }}}

    public function isReadable($user_id) // {{{
    {
        $dirs = $this->_getTableFromString(ManipleDrive_Model_DbTable_Dirs::className);
        return $dirs->isDirReadable($this->dir_id, $user_id);
    } // }}}

    public function fetchDependentRows() // {{{
    {
        return $this->getTable()->fetchFileDependentRows($this->id);
    } // }}}

    public function countDependentRows() // {{{
    {
        return $this->getTable()->countFileDependentRows($this->id);
    } // }}}

    // pliki sa zostawiane na dysku, czyszczenie usunietych plikow
    // odbywa sie przez odpowiedni skrypt crona
    public function delete($_updateCounters = true) // {{{
    {
        try {
            $drive = $this->Dir->getDrive();
        } catch (Exception $e) {
            $drive = null;
        }

        if ($_updateCounters) {
            ManipleDrive_Model_Dir::_updateCounters($this->Dir, 0, -1, -$this->size);
        }

        // TODO co z usuwaniem pliku z dysku?
        $result = parent::delete();
        if ($drive) {
            $drive->refreshDiskUsage();
        }

        return $result;
    } // }}}
}
