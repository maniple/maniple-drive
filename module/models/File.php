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
        // $this->_updateCounters($this->Dir, true, $this->size);

        return $result;
    } // }}}

    protected function _update() // {{{
    {
        $this->mtime = time();

        if ($this->_cleanData['dir_id'] != $this->dir_id) {
            // fetch previous parent dir
            $dir = $this->_getTableFromString('Drive_Model_DbTable_Dirs')->findRow($this->_cleanData['dir_id']);
            if ($dir) {
                $this->_updateCounters($dir, false, $this->size);
            }
            $this->_updateCounters($this->Dir, true, $this->size);
        }

        return parent::_update();
    } // }}}

    public function getPath() // {{{
    {
        $drives = $this->_getTableFromString('Drive_Model_DbTable_Drives');
        return $drives->getFilePath($this);
    } // }}}

    public function isReadable($user_id) // {{{
    {
        $dirs = $this->_getTableFromString('Drive_Model_DbTable_Dirs');
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

        // $this->_updateCounters($this->Dir, false, $size);

        // TODO co z usuwaniem pliku z dysku?
        $result = parent::delete();
        $drive->refreshDiskUsage();

        return $result;
    } // }}}

    protected function _updateCounters(Drive_Model_Dir $dir = null, $inc, $size) // {{{
    {
        $size = abs($size);
        $is_direct_parent = true;

        while ($dir) {
            if ($is_direct_parent) {
                $is_direct_parent = false;

                if ($inc) {
                    $dir->file_count = new Zend_Db_Expr(
                        'file_count + 1'
                    );
                } else {
                    $dir->file_count = new Zend_Db_Expr(
                        'CASE WHEN file_count > 0 THEN file_count - 1 ELSE 0 END'
                    );
                }
            }

            if ($inc) {
                $dir->total_file_count = new Zend_Db_Expr(
                    'total_file_count + 1'
                );
            } else {
                $dir->total_file_count = new Zend_Db_Expr(
                    'CASE WHEN total_file_count > 0 THEN total_file_count - 1 ELSE 0 END'
                );
            }

            if ($inc) {
                $dir->total_file_size = new Zend_Db_Expr(sprintf(
                    'total_file_size + %d', $size
                ));
            } else {
                $dir->total_file_size = new Zend_Db_Expr(sprintf(
                    'CASE WHEN total_file_size >= %d THEN total_file_size - %d ELSE 0 END',
                    $size, $size
                ));
            }

            $dir->save();
            $dir = $dir->ParentDir;
        }
    } // }}}
}
