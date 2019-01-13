<?php

/**
 * Klasa reprezentujaca rekordy dyskow wirtualnych.
 *
 * @author xemlock
 * @version 2013-01-15
 *
 * @method ManipleDrive_Model_DbTable_Drives getTable()
 */
class ManipleDrive_Model_Drive extends Zefram_Db_Table_Row
{
    const className = __CLASS__;

    protected $_tableClass = ManipleDrive_Model_DbTable_Drives::className;

    /**
     * Nazwa dysku zapisywana w katalogu ustawionym jako korzen dysku.
     * @var string
     */
    protected $_name;

    protected $_diskUsage;

    public function getName() // {{{
    {
        if (null === $this->_name) {
            $dir = $this->RootDir;
            $this->_name = (string) ($dir ? $dir->name : '');
        }
        return $this->_name;
    } // }}}

    public function setName($name) // {{{
    {
        $this->_name = (string) $name;
        return $this;
    } // }}}

    protected function _saveRootDir() // {{{
    {
        $dir = $this->RootDir;

        if (empty($dir)) {
            $dirs = $this->_getTableFromString(ManipleDrive_Model_DbTable_Dirs::className);
            $dir = $dirs->createRow();

            // nowo tworzony katalog bedacy korzeniem dysku jest prywatny
            // - jego wlasciciel jezeli chce moze zmienic to ustawienie
            $dir->visibility = ManipleDrive_Model_DbTable_Dirs::VISIBILITY_PRIVATE;
            $dir->created_by = $this->created_by;
        }

        $dir->drive_id    = $this->drive_id;
        $dir->parent_id   = null;
        $dir->name        = $this->getName();
        $dir->owner       = $this->owner;
        $dir->modified_by = $this->modified_by;

        $dir->save();

        return $dir;
    } // }}}

    public function setFromArray(array $data) // {{{
    {
        parent::setFromArray($data);

        if (isset($data['name'])) {
            $this->setName($data['name']);
        }

        return $this;
    } // }}}

    protected function _insert() // {{{
    {
        $this->create_time = date('Y-m-d H:i:s');
        $this->root_dir    = null;  // at this point RootDir does not exist,
                                    // as parent drive ID is not yet known

        return parent::_insert();
    } // }}}

    protected function _postInsert() // {{{
    {
        $dir = $this->_saveRootDir();

        // podepnij katalog jako korzen dysku
        $this->getTable()->update(array('root_dir' => $dir->dir_id), array('drive_id = ?' => $this->drive_id));
        $this->RootDir = $dir;

        return parent::_postInsert();
    } // }}}

    protected function _update() // {{{
    {
        $dir = $this->_saveRootDir();

        $this->root_dir = $dir->dir_id;
        $this->modify_time = date('Y-m-d H:i:s');

        return parent::_update();
    } // }}}

    public function __get($columnName) // {{{
    {
        if ($columnName === 'name') {
            return $this->getName();
        }
        if ($columnName === 'disk_usage') {
            return $this->getDiskUsage();
        }
        return parent::__get($columnName);
    } // }}}

    public function __set($columnName, $value) // {{{
    {
        if ($columnName === 'name') {
            $this->setName($value);
            return;
        }
        if ($columnName === 'disk_usage') {
            $this->setDiskUsage($value);
            return;
        }
        parent::__set($columnName, $value);
    } // }}}

    public function __isset($columnName) // {{{
    {
        return ($columnName === 'name')
            || ($columnName === 'disk_usage')
            || parent::__isset($columnName);
    } // }}}

    /**
     * Alias funkcji {@link ManipleDrive_Model_DbTable_Drives::getFilePath()}.
     * Umieszczenie tej funkcji (nawet jeżeli jest tylko aliasem) wynika
     * z podziału odpowiedzialności. To konkretny dysk wie, czy w jego obrębie
     * znajduje się plik. Przekierowanie do funkcji jest konsekwencją przyjętej
     * implementacji przechowywania plików na dysku.
     *
     * @param string|ManipleDrive_Model_File $file
     * @param bool $check
     * @return false|string
     */
    public function getFilePath($file, $check = true) // {{{
    {
        return $this->getTable()->getFilePath($file, $check);
    } // }}}

    /**
     * @param string $md5
     * @return bool
     */
    public function prepareFilePath($md5) // {{{
    {
        return $this->getTable()->prepareFilePath($md5);
    } // }}}

    public function refresh() // {{{
    {
        $this->refreshDiskUsage();
        return parent::refresh();
    } // }}}

    /**
     * @return float|false
     */
    public function getDiskUsage() // {{{
    {
        if (null === $this->_diskUsage) {
            $usage = $this->RootDir->getContentSummary();
            $this->_diskUsage = (int) $usage['size'];
        }
        return $this->_diskUsage;
    } // }}}

    /**
     * @return ManipleDrive_Model_Drive
     */
    public function refreshDiskUsage() // {{{
    {
        $this->_diskUsage = null;
        return $this;
    } // }}}

    /**
     * @param  float $diskUsage
     * @return ManipleDrive_Model_Drive
     */
    public function setDiskUsage($diskUsage) // {{{
    {
        $this->_diskUsage = round($diskUsage);
        return $this;
    } // }}}
}
