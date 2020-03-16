<?php

/**
 * A directory containing root directories of drives that contain
 * public entries (directories or files).
 *
 * @version 2014-08-22
 * @author xemlock
 */
class ManipleDrive_Model_PseudoDir_DrivesWithPublicEntries extends ManipleDrive_Model_PseudoDir
{
    /**
     * @var Zefram_Db
     */
    protected $_db;

    /**
     * @param  Zefram_Db
     */
    public function __construct(Zefram_Db $db) // {{{
    {
        $this->_db = $db;
    } // }}}

    /**
     * @return string
     */
    public function getId() // {{{
    {
        return 'public';
    } // }}}

    /**
     * @return string
     */
    public function getName() // {{{
    {
        return 'Public';
    } // }}}

    /**
     * @return ManipleDrive_Model_DirInterface[]
     */
    public function getSubDirs() // {{{
    {
        return $this->_fetchDrivesWithRootDirs();
    } // }}}

    /**
     * @param  int $dirId
     * @return ManipleDrive_Model_DirInterface|null
     */
    public function getSubDir($dirId) // {{{
    {
        // subdirectories are expected to be valid drive root-directories,
        // and are identified by their ID in the storage
        $where = array('dirs.dir_id = ?' => (int) $dirId);
        $limit = 1;

        $rows = $this->_fetchDrivesWithRootDirs($where, $limit);
        if ($rows) {
            return reset($rows);
        }
        return null;
    } // }}}

    /**
     * @param  Zefram_Db_Select $select
     * @return ManipleDrive_Model_DirInterface[]
     */
    protected function _fetchDrivesWithRootDirs($where = null, $limit = null) // {{{
    {
        $select = $this->_selectDrivesWithRootDirs($where, $limit);

        $drivesTable = $this->_db->getTable(ManipleDrive_Model_DbTable_Drives::className);
        $dirsTable = $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className);

        $rows = array();

        foreach ($select->query()->fetchAll() as $row) {
            $data = array();

            foreach ($row as $key => $value) {
                $key = explode('__', $key, 2);
                $data[$key[0]][$key[1]] = $value;
            }

            $drive = $drivesTable->_createStoredRow($data['Drive']);
            $drive->RootDir = $dirsTable->_createStoredRow($data['Dir']);

            $rows[] = new ManipleDrive_Model_PseudoDir_PublicEntriesInDrive($drive, $this->_db);
        }

        return $rows;
    } // }}}

    /**
     * @return Zefram_Db_Select
     */
    protected function _selectDrivesWithRootDirs($where = null, $limit = null) // {{{
    {
        // this SELECT chooses drives along with their root dirs

        $tableProvider = $this->_db;
        $dbAdapter = $tableProvider->getAdapter();

        $drivesTable = $tableProvider->getTable(ManipleDrive_Model_DbTable_Drives::className);
        $dirsTable = $tableProvider->getTable(ManipleDrive_Model_DbTable_Dirs::className);

        $select = Zefram_Db_Select::factory($dbAdapter);
        $select->from(
            array('drives' => $drivesTable),
            $drivesTable->getColsForSelect('Drive__')
        );
        $select->join(
            array('dirs' => $dirsTable),
            'dirs.dir_id = drives.root_dir',
            $dirsTable->getColsForSelect('Dir__')
        );
        // select IDs of drives containing public directories
        $select->join(
            array(
                'drive_ids' => Zefram_Db_Select::factory($dbAdapter)
                    ->distinct(true)
                    ->from($dirsTable, 'drive_id')
                    ->where('visibility = ?', ManipleDrive_DirVisibility::VIS_PUBLIC)
            ),
            'drives.drive_id = drive_ids.drive_id',
            array()
        );
        // TODO take into account public files (not yet implemented), UNION
        $select->order('dirs.name');

        if ($where) {
            $select->where($where);
        }

        if ($limit) {
            $select->limit($limit);
        }

        return $select;
    } // }}}

    /**
     * An empty file list is returned by this method, as the pseudo-directory
     * contains only root directories of drives that contain public entries.
     *
     * @param  int $fileId
     * @return null
     */
    public function getFiles() // {{{
    {
        return array();
    } // }}}

    /**
     * No file is returned by this method, as the pseudo-directory contains
     * only root directories of drives that contain public entries.
     *
     * @param  int $fileId
     * @return null
     */
    public function getFile($fileId) // {{{
    {
        return null;
    } // }}}

    /**
     * No file is returned by this method, as the pseudo-directory contains
     * only root directories of drives that contain public entries.
     *
     * @param  string $name
     * @return null
     */
    public function getFileByName($name) // {{{
    {
        return null;
    } // }}}
}
