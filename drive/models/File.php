<?php

class Drive_Model_File extends Zefram_Db_Table_Row
{
    protected $_tableClass = 'Drive_Model_DbTable_Files';

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

        $dir = $this->Dir;
        $dir->file_count = new Zend_Db_Expr('file_count + 1');
        $dir->save();

        return $result;
    } // }}}

    protected function _update() // {{{
    {
        // TODO trzeba zadbac o aktualizacje licznika plikow i podkatalogow przy przenoszeniu katalogow i plikow
        $this->mtime = time();
        return parent::_update();
    } // }}}

    public function getPath() // {{{
    {
        $drives = $this->getAdapter()->getTable('Drive_Model_DbTable_Drives');
        return $drives->getFilePath($this);
    } // }}}

    public function isReadable($user_id) // {{{
    {
        $dirs = $this->getAdapter()->getTable('Drive_Model_DbTable_Dirs');
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
    public function delete() // {{{
    {
        $dir = $this->Dir;
        $dir->file_count = new Zend_Db_Expr('CASE WHEN file_count > 0 THEN file_count - 1 ELSE 0 END');
        $dir->save();

        // katalog musi nalezec do dysku
        $drive = $dir->Drive;

        // TODO co z usuwaniem pliku z dysku?
        $size = (int) $this->size;
        $result = parent::delete();

        if ($drive) {
            // zaktualizuj zajmowane miejsce na dysku
            $drive->disk_usage = new Zend_Db_Expr('disk_usage - ' . $size);
            $drive->save();
        }

        return $result;
    } // }}}
}
