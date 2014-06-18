<?php

/**
 * This class represents a directory containing all entries (directories
 * and files) which have 'public' visibility and are located within a given
 * drive.
 *
 * @version 2014-06-17
 * @author xemlock
 */
class Drive_Model_PseudoDir_PublicEntriesInDrive extends Drive_Model_PseudoDir
{
    /**
     * @var Drive_Model_Drive
     */
    protected $_drive;

    /**
     * @var Zefram_Db_TableProvider
     */
    protected $_tableProvider;

    /**
     * @param  int $driveId
     * @param  string $name
     * @param  Zefram_Db_TableProvider $tableProvider
     */
    public function __construct(Drive_Model_Drive $drive, Zefram_Db_TableProvider $tableProvider) // {{{
    {
        $this->_drive = $drive;
        $this->_tableProvider = $tableProvider;
    } // }}}

    /**
     * Get ID of this pseudo-directory.
     *
     * ID is the same as the ID of the root directory of the drive this
     * pseudo-directory is attached to.
     *
     * @return int
     */
    public function getId() // {{{
    {
        return (int) $this->_drive->root_dir;
    } // }}}

    /**
     * Get name of this directory, which is the same as the name of the
     * drive this directory is attached to.
     *
     * @return string
     */
    public function getName() // {{{
    {
        return $this->_drive->getName();
    } // }}}

    /**
     * Returns the ID of the owner of the drive this pseudo-directory
     * is attached to.
     *
     * @return int
     */
    public function getOwner() // {{{
    {
        return $this->_drive->owner;
    } // }}}

    /**
     * @return Drive_Model_Dir[]
     */
    public function getSubDirs() // {{{
    {
        $select = $this->_selectSubDirs();
        $table = $this->_tableProvider->getTable('Drive_Model_DbTable_Dirs');

        $subdirs = array();
        foreach ($table->fetchAll($select) as $row) {
            $subdirs[] = $row;
        }
        return $subdirs;
    } // }}}

    /**
     * @param  int $dirId
     * @return Drive_Model_Dir
     */
    public function getSubDir($dirId) // {{{
    {
        $select = $this->_selectSubDirs();
        $select->where('dir_id = ?', (int) $dirId);
        $select->limit(1);

        $table = $this->_tableProvider->getTable('Drive_Model_DbTable_Dirs');
        return $table->fetchRow($select);
    } // }}}

    /**
     * Create a select instance for retrieval of all stored directories
     * located within this drive and having public visibility.
     *
     * @return Zefram_Db_Select
     */
    protected function _selectSubDirs() // {{{
    {
        $select = Zefram_Db_Select::factory($this->_tableProvider->getAdapter());
        $select->from(array(
            'dirs' => $this->_tableProvider->getTable('Drive_Model_DbTable_Dirs')
        ));
        $select->where('drive_id = ?', (int) $this->_drive->drive_id);
        $select->where('visibility = ?', Drive_DirVisibility::VIS_PUBLIC);
        $select->order('name');
        return $select;
    } // }}}

    public function getFiles() // {{{
    {
        return array(); // TODO
    } // }}}
}
