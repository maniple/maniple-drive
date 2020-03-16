<?php

/**
 * This class represents a directory containing all entries (directories
 * and files) which are shared with the user of given ID either explicitly
 * or via 'usersonly' visibility.
 *
 * @version 2014-08-22
 * @author xemlock
 */
class ManipleDrive_Model_PseudoDir_SharedEntries extends ManipleDrive_Model_PseudoDir
{
    /**
     * @var int
     */
    protected $_userId;

    /**
     * @var Zefram_Db
     */
    protected $_db;

    /**
     * @param  int $userId
     * @param  Zefram_Db $db
     */
    public function __construct($userId, Zefram_Db $db) // {{{
    {
        $this->_userId = (int) $userId;
        $this->_db = $db;
    } // }}}

    public function getId() // {{{
    {
        return 'shared';
    } // }}}

    /**
     * @return string
     */
    public function getName() // {{{
    {
        return 'Shared with me';
    } // }}}

    /**
     * @return ManipleDrive_Model_Dir[]
     */
    public function getSubDirs() // {{{
    {
        $select = $this->_createSelect();
        $table = $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className);

        $subdirs = array();
        foreach ($table->fetchAll($select) as $row) {
            $subdirs[] = $row;
        }
        return $subdirs;
    } // }}}

    /**
     * @param  int $dirId
     * @return ManipleDrive_Model_Dir
     */
    public function getSubDir($dirId) // {{{
    {
        $select = $this->_createSelect();
        $select->where('dirs.dir_id = ?', (int) $dirId);
        $select->limit(1);

        $table = $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className);
        return $table->fetchRow($select);
    } // }}}

    /**
     * @return Zefram_Db_Select
     */
    protected function _createSelect() // {{{
    {
        $tableProvider = $this->_db;

        $select = Zefram_Db_Select::factory($tableProvider->getAdapter());
        $select->from(array(
            'dirs' => $tableProvider->getTable(ManipleDrive_Model_DbTable_Dirs::className),
        ));
        $select->joinLeft(
            array(
                'dir_shares' => $tableProvider->getTable(ManipleDrive_Model_DbTable_DirShares::className),
            ),
            array(
                'dir_shares.dir_id = dirs.dir_id',
                'dir_shares.user_id = ?' => $this->_userId,
            ),
            array()
        );
        $select->whereParams(
            '(dir_shares.user_id IS NOT NULL) OR (visibility = :usersonly)',
            array(
                'private' => ManipleDrive_DirVisibility::VIS_PRIVATE,
                'usersonly' => ManipleDrive_DirVisibility::VIS_USERSONLY,
            )
        );
        $select->order('name_normalized');

        return $select;
    } // }}}

    public function getFiles()
    {
        return array();
    }

    public function getFile($fileId) // {{{
    {
        return null;
    } // }}}

    public function getFileByName($name) // {{{
    {
        return null;
    } // }}}
}
