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

        $is_direct_parent = true;
        $dir = $this->Dir;

        while ($dir) {
            if ($is_direct_parent) {
                $is_direct_parent = false;
                $dir->file_count = new Zend_Db_Expr('file_count + 1');
            }
            $dir->total_file_count = new Zend_Db_Expr('total_file_count + 1');
            $dir->total_file_size = new Zend_Db_Expr(sprintf('total_file_size + %d', $this->size));
            $dir->save();

            $dir = $dir->ParentDir;
        }

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
        $drives = $this->_getTable('Drive_Model_DbTable_Drives');
        return $drives->getFilePath($this);
    } // }}}

    public function isReadable($user_id) // {{{
    {
        $dirs = $this->_getTable('Drive_Model_DbTable_Dirs');
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
        // these variables will be used later
        $size = (int) $this->size;
        $drive = $this->Dir->Drive;

        $is_direct_parent = true;
        $dir = $this->Dir;

        while ($dir) {
            // update file_count only in direct parent dir of this file
            if ($is_direct_parent) {
                $is_direct_parent = false;
                $dir->file_count = new Zend_Db_Expr(
                    'CASE WHEN file_count > 0 THEN file_count - 1 ELSE 0 END'
                );
            }
            $dir->total_file_count = new Zend_Db_Expr(
                'CASE WHEN total_file_count > 0 THEN total_file_count - 1 ELSE 0 END'
            );
            $dir->total_file_size = new Zend_Db_Expr(sprintf(
                'CASE WHEN total_file_size >= %d THEN total_file_size - %d ELSE 0 END',
                $size, $size
            ));
            $dir->save();

            $dir = $dir->ParentDir;
        }

        // TODO co z usuwaniem pliku z dysku?
        $result = parent::delete();

        if ($drive) {
            // zaktualizuj zajmowane miejsce na dysku
            $drive->disk_usage = new Zend_Db_Expr(sprintf('disk_usage - %d', $size));
            $drive->save();
        }

        return $result;
    } // }}}
}
