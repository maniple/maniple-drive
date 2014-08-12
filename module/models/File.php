<?php

class ManipleDrive_Model_File extends Zefram_Db_Table_Row
{
    protected $_tableClass = 'ManipleDrive_Model_DbTable_Files';

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

        // jezeli nie podano jawnie wlasciciela, zostaje nim osoba zapisujaca
        // ten rekord do bazy
        if (empty($this->owner)) {
            $this->owner = $this->created_by;
        }

        $result = parent::_insert();

        ManipleDrive_Model_Dir::_updateCounters($this->Dir, 0, 1, $this->size);

        return $result;
    } // }}}

    protected function _update() // {{{
    {
        $this->mtime = time();

        if ($this->_cleanData['dir_id'] != $this->dir_id) {
            // fetch previous parent dir
            $dir = $this->_getTableFromString('ManipleDrive_Model_DbTable_Dirs')->findRow($this->_cleanData['dir_id']);
            if ($dir) {
                ManipleDrive_Model_Dir::_updateCounters($dir, 0, -1, -$this->size);
            }
            ManipleDrive_Model_Dir::_updateCounters($this->Dir, 0, 1, $this->size);
        }

        return parent::_update();
    } // }}}

    public function getPath() // {{{
    {
        $drives = $this->_getTableFromString('ManipleDrive_Model_DbTable_Drives');
        return $drives->getFilePath($this);
    } // }}}

    public function isReadable($user_id) // {{{
    {
        $dirs = $this->_getTableFromString('ManipleDrive_Model_DbTable_Dirs');
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
        $drive = $this->Dir->Drive;

        if ($_updateCounters) {
            ManipleDrive_Model_Dir::_updateCounters($this->Dir, 0, -1, -$this->size);
        }

        // TODO co z usuwaniem pliku z dysku?
        $result = parent::delete();
        $drive->refreshDiskUsage();

        return $result;
    } // }}}
}
