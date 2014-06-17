<?php

/**
 * A directory containing root directories of drives that contain
 * public entries (directories or files).
 *
 * @version 2014-06-17
 * @author xemlock
 */
class Drive_Model_PseudoDir_DrivesWithPublicEntries extends Drive_Model_PseudoDir
{
    /**
     * @var Zefram_Db_TableProvider
     */
    protected $_tableProvider;

    /**
     * @param  Zefram_Db_TableProvider
     */
    public function __construct(Zefram_Db_TableProvider $tableProvider) // {{{
    {
        $this->_tableProvider = $tableProvider;
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
     * @return Drive_Model_PublicDir[]
     */
    public function getSubDirs() // {{{
    {
        return $this->_fetchDrivesWithRootDirs();
    } // }}}

    /**
     * @param  int $dirId
     * @return Drive_Model_DirInterface|null
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
     * @return Drive_Model_DirInterface[]
     */
    protected function _fetchDrivesWithRootDirs($where = null, $limit = null) // {{{
    {
        $select = $this->_selectDrivesWithRootDirs($where, $limit);

        $drives_table = $this->_tableProvider->getTable('Drive_Model_DbTable_Drives');
        $dirs_table = $this->_tableProvider->getTable('Drive_Model_DbTable_Dirs');

        $rows = array();

        foreach ($select->query()->fetchAll() as $row) {
            $data = array();

            foreach ($row as $key => $value) {
                $key = explode('__', $key, 2);
                $data[$key[0]][$key[1]] = $value;
            }

            $drive = $drives_table->_createStoredRow($data['Drive']);
            $drive->RootDir = $dirs_table->_createStoredRow($data['Dir']);

            $rows[] = new Drive_Model_PseudoDir_PublicEntriesInDrive($drive, $this->_tableProvider);
        }

        return $rows;
    } // }}}

    /**
     * @return Zefram_Db_Select
     */
    protected function _selectDrivesWithRootDirs($where = null, $limit = null) // {{{
    {
        // this SELECT chooses drives along with their root dirs

        $tableProvider = $this->_tableProvider;
        $dbAdapter = $tableProvider->getAdapter();

        $select = Zefram_Db_Select::factory($dbAdapter);
        $select->from(
            array(
                'drives' => $tableProvider->getTable('Drive_Model_DbTable_Drives'),
            ),
            'Drive__*'
        );
        $select->join(
            array(
                'dirs' => $tableProvider->getTable('Drive_Model_DbTable_Dirs'),
            ),
            'dirs.dir_id = drives.root_dir',
            'Dir__*'
        );
        // select IDs of drives containing public directories
        $select->join(
            array(
                'drive_ids' => Zefram_Db_Select::factory($dbAdapter)
                    ->distinct(true)
                    ->from(
                        $tableProvider->getTable('Drive_Model_DbTable_Dirs'),
                        'drive_id'
                    )
                    ->where('visibility = ?', Drive_DirVisibility::VIS_PUBLIC)
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

    public function getFiles() // {{{
    {
        return array(); // TODO
    } // }}}
}
