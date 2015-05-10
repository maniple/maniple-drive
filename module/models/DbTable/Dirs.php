<?php

class ManipleDrive_Model_DbTable_Dirs extends Zefram_Db_Table
{
    const VISIBILITY_PUBLIC    = ManipleDrive_DirVisibility::VIS_PUBLIC;
    const VISIBILITY_PRIVATE   = ManipleDrive_DirVisibility::VIS_PRIVATE;
    const VISIBILITY_INHERITED = ManipleDrive_DirVisibility::VIS_INHERITED;
    const VISIBILITY_USERSONLY = ManipleDrive_DirVisibility::VIS_USERSONLY;

    const ACCESS_NONE     = 0;
    const ACCESS_READABLE = 1;
    const ACCESS_WRITABLE = 2;

    const CACHE_TAG = 'DirAccess';

    protected $_name = ManipleDrive_Model_TableNames::TABLE_DIRS;

    protected $_rowClass = 'ManipleDrive_Model_Dir';
    protected $_referenceMap = array(
        'ParentDir' => array(
            'columns'       => 'parent_id',
            'refTableClass' => 'ManipleDrive_Model_DbTable_Dirs',
            'refColumns'    => 'dir_id',
        ),
    );

    protected static $_dirAccessCache = array();

    public static function isValidVisibility($visibility) // {{{
    {
        return in_array($visibility, array(
            self::VISIBILITY_PUBLIC,
            self::VISIBILITY_USERSONLY,
            self::VISIBILITY_PRIVATE,
            self::VISIBILITY_INHERITED,
        ));
    } // }}}

    protected static function _getCache() // {{{
    {
        return null;
    } // }}}

    /**
     * Pamięć podręczna przechowująca informacje o dostępie do katalogów
     * dla danego użytkownika.
     *
     * @param int $user_id
     * @return array|Data\CachedArray
     */
    protected static function _getDirAccessCache($user_id) // {{{
    {
        $user_id = (int) $user_id;

        if (!isset(self::$_dirAccessCache[$user_id])) {
            if ($cache = self::_getCache()) {
                // jezeli ustawiono cache, uzyj cache'owanej tablicy
                $key = 'ManipleDrive_DirAccess_' . $user_id;
                self::$_dirAccessCache[$user_id] = new Data\CachedArray($cache, $key, self::CACHE_TAG);

            } else {
                // uzyj statycznej tablicy jako pamieci podrecznej
                self::$_dirAccessCache[$user_id] = array();
            }
        }

        return self::$_dirAccessCache[$user_id];
    } // }}}

    public static function clearDirAccessCache() // {{{
    {
        self::$_dirAccessCache = null;

        if ($cache = self::_getCache()) {
            $cache->clean(Zend_Cache::CLEANING_MODE_ALL, self::CACHE_TAG);
        }
     } // }}}

    /**
     * @return bool
     */
    public function isDirReadable($dir_id, $user_id) // {{{
    {
        return (bool) (self::ACCESS_READABLE & $this->getDirAccess($dir_id, $user_id));
    } // }}}

    /**
     * @return bool
     */
    public function isDirWritable($dir_id, $user_id) // {{{
    {
        return (bool) (self::ACCESS_WRITABLE & $this->getDirAccess($dir_id, $user_id));
    } // }}}

    /**
     * Wynik działania tej funkcji jest przechowywany w pamięci podręcznej.
     *
     * @param int|ManipleDrive_Model_Dir
     * @return int
     */
    // TODO wlasciciel dysku ma dostep do wszystkich katalogow w poddrzewie!
    public function getDirAccess($dir_id, $user_id) // {{{
    {
        if ($dir_id instanceof ManipleDrive_Model_Dir) {
            $dir = $dir_id;
        } else {
            $dir = $this->findRow($dir_id);
            if (empty($dir)) {
                return self::ACCESS_NONE;
            }
        }

        $dir_id = (int) $dir->dir_id;
        $user_id = (int) $user_id;

        // sprawdz czy dostep do dysku nie jest obecny w pamieci podrecznej
        $cache = self::_getDirAccessCache($user_id);

        if ($cache && isset($cache[$dir_id])) {
            return $cache[$dir_id];
        }

        // wlasciciel dysku ma zawsze dostep do wszystkich plikow w jego
        // obrebie
        try {
            $drive = $dir->getDrive();
        } catch (Exception $e) {
            $drive = null;
        }
        if ($drive && $drive->owner && $drive->owner == $user_id) {
            $access = self::ACCESS_READABLE | self::ACCESS_WRITABLE;

        } elseif ($dir->owner && $dir->owner == $user_id) {
            // wlasciciel ma zawsze dostep do odczytu i zapisu
            // Uwaga: katalog moze nie miec wlasciciela, jezeli jest katalogiem
            // systemowym.
            $access = self::ACCESS_READABLE | self::ACCESS_WRITABLE;
        } else {
            switch ($dir->visibility) {
                case self::VISIBILITY_PRIVATE:
                    $access = self::ACCESS_NONE;
                    break;

                case self::VISIBILITY_USERSONLY:
                    // dostep tylko dla zalogowanych uzytkownikow (user_id != 0)
                    if ($user_id) {
                        $access = self::ACCESS_READABLE;
                    }
                    break;

                case self::VISIBILITY_PUBLIC:
                    $access = self::ACCESS_READABLE;
                    break;

                case self::VISIBILITY_INHERITED:
                default:
                    if ($dir->parent_id) {
                        // dostep dziedziczony z katalogu nadrzednego,
                        // uwzglednij rowniez wpis ze wspoldzielenia (moze dac
                        // dostep w trybie do zapisu)
                        $access = $this->getDirAccess($dir->parent_id, $user_id);
                    }
                    break;
            }

            // sprawdz dostep nadany uzytkownikowi explicite, wpis w tabeli
            // DirShares odpowiada uprawnieniom do tylko do odczytu, jezeli
            // zas wartosc kolumny can_write jest niezerowa, uzytkownik ma
            // dostep rowniez do zapisu
            if ($user_id) {
                $row = $this->_getTableFromString('ManipleDrive_Model_DbTable_DirShares')->fetchRow(array(
                    'dir_id = ?' => $dir_id,
                    'user_id = ?' => $user_id,
                ));

                if ($row) {
                    $access = self::ACCESS_READABLE;
                    if ($row['can_write']) {
                        $access |= self::ACCESS_WRITABLE;
                    }
                }
            }
        }

        if ($cache) {
            $cache[$dir_id] = $access;
        }

        return $access;
    } // }}}

    /**
     * Zwraca SELECT wybierający katalogi jawnie udostępnione podanemu
     * użytkownikowi, znajdujące się na dyskach nienależących do tego
     * użytkownika.
     *
     * @param int $user_id
     * @return Zefram_Db_Table_Select
     */
    public function selectSharedDirs($user_id)
    {
        $user_id = (int) $user_id;

        $select = Zefram_Db_Select::factory($this->getAdapter())
            ->from(
                array(
                    'Dirs' => ManipleDrive_Model_TableNames::TABLE_DIRS,
                )
            )
            ->join(
                array(
                    'DirShares' => ManipleDrive_Model_TableNames::TABLE_DIR_SHARES,
                ),
                'DirShares.dir_id = Dirs.dir_id',
                'can_write'
            )
            ->where('DirShares.user_id = ?', $user_id)
            ->where('Dirs.owner <> ?', $user_id);

        return $select;
    }

    public function fetchFilesByDir($dir_id, $where = null, $order = null)
    {
        $where = (array) $where;
        $where['dir_id = ?'] = (int) $dir_id;

        $files = $this->_getTableFromString('ManipleDrive_Model_DbTable_Files')->fetchAll($where, $order);

        return $files;
    }

    /**
     * @param  int|array $dir_id
     */
    public function fetchDirShares($dir_id)
    {
        $dir_ids = array_map('intval', (array) $dir_id);

        $where = null;

        if (count($dir_ids)) {
            $where['dir_id IN (?)'] = $dir_ids;
        } else {
            $where[] = 'dir_id IN (NULL)';
        }

        $shares = $this->_getTableFromString('ManipleDrive_Model_DbTable_DirShares')->fetchAll($where, 'dir_id');
        return $shares;
    }
}
