<?php

class Drive_Helper
{
    /**
     * @var Maniple_Security_ContextInterface
     */
    protected $_securityContext;

    /**
     * @var Zend_View_Abstract
     */
    protected $_view;

    /**
     * @var Zefram_Db_Table_Provider
     */
    protected $_tableProvider;

    /**
     * @var Core_UserMapperInterface
     */
    protected $_userMapper;

    /**
     * @var string
     */
    protected $_userSearchRoute;

    /**
     * @return Drive_Mapper
     */
    public function getMapper()
    {
        return new Drive_Mapper($this->getTableProvider());
    }

    public function fetchDir($dir_id)
    {
        return $this->getDir($dir_id);
    }

    /**
     * Pobiera z bazy rekord katalogu i sprawdza, czy bieżący użytkownik
     * ma uprawnienia do jego odczytu.
     *
     * @param int $dir_id
     * @return Drive_Model_Dir
     */
    public function getDir($dir_id) // {{{
    {
        $dir = $this->getMapper()->getDir($dir_id);

        if (!$this->isDirReadable($dir)) {
            throw new Exception('Nie masz uprawnień dostępu do tego katalogu');
        }

        return $dir;
    } // }}}

    /**
     * Pobiera z bazy rekord pliku i sprawdza, czy bieżący użytkownik ma
     * uprawnienia do jego odczytu.
     *
     * @param int $file_id
     * @return Drive_Model_File
     */
    public function fetchFile($file_id) // {{{
    {
        $file_id = (int) $file_id;
        $file = $this->getTableProvider()->getTable('Drive_Model_DbTable_Files')->findRow($file_id);

        if (empty($file)) {
            throw new Exception('Plik nie został znaleziony');
        }

        if (!$this->isDirReadable($file->Dir)) {
            throw new Exception('Nie masz uprawnień dostępu do tego pliku');
        }

        return $file;
    } // }}}

    const READ   = 'read';
    const WRITE  = 'write';
    const RENAME = 'rename';
    const REMOVE = 'remove';
    const SHARE  = 'share';
    const CHOWN  = 'chown';

    protected $_dirPermissions = array();

    public function getDirPermissions(Drive_Model_Dir $dir, $property = null) // {{{
    {
        $dir_id = $dir->dir_id;

        if (empty($this->_dirPermissions[$dir_id])) {
            $user = $this->getSecurityContext()->getUser();
            $user_id = $this->getSecurityContext()->getUserId();

            // Dodatkowe reguly:
            // - tylko wlasciciel i administrator moga zmienic ustawienia
            //   prywatnosci katalogu
            // - katalogi w korzeniu nie moga miec zmienionej nazwy, ani nie
            //   moga byc przenoszone w inne miejsce (zmiana nazwy takiego
            //   katalogu jedynie poprzez zmiane nazwy dysku)

            if ($this->getSecurityContext()->isSuperUser()) {
                $perms = array(
                    self::READ   => true,
                    self::WRITE  => true,
                    self::RENAME => (bool) $dir->parent_id,
                    self::REMOVE => (bool) $dir->parent_id,
                    self::SHARE  => true,
                    self::CHOWN  => true,
                );
            } else {
                $write  = $dir->isWritable($user_id);
                $read   = $dir->isReadable($user_id);
                $rename = false;
                $remove = false;

                // zeby przeniesc lub usunac katalog trzeba miec uprawnienia do
                // zapisu tego katalogu, oraz miec uprawnienia do zapisu
                // w katalogu nadrzednym (ten ostatni musi istniec)
                if ($write && ($parent = $dir->fetchParent()) && $parent->isWritable($use_id)) {
                    $remove = true;
                    $rename = true;
                }

                $perms = array(
                    self::READ   => $read,
                    self::WRITE  => $write,
                    self::RENAME => $rename,
                    self::REMOVE => $remove,
                    self::SHARE  => $dir->owner && $dir->owner == $user_id,
                    self::CHOWN  => false, // tylko administrator
                );
            }

            $this->_dirPermissions[$dir_id] = $perms;
        }

        if (null === $property) {
            return $this->_dirPermissions[$dir_id];
        }

        return isset($this->_dirPermissions[$dir_id][$property])
            ? $this->_dirPermissions[$dir_id][$property]
            : false;
    } // }}}

    public function getFilePermissions(Drive_Model_File $dir, $property = null) // {{{
    {
        // TODO
        return array(
            self::READ   => true,
            self::REMOVE => true,
            self::RENAME => true,
            self::WRITE  => true,
            self::CHOWN  => true,
        );
    } // }}}

    public function getDate($time) // {{{
    {
        $view = $this->getView();
        $time = (int) $time;

        return array(
            'ts'    => $time,
            'date'  => $view->dateFormat($time, 'short'),
            'short' => $view->dateFormat($time, 'short', 'short'),
            'long'  => $view->dateFormat($time, 'long', 'medium'),
        );
    } // }}}

    /**
     * @param  Drive_Model_File $file
     * @return string
     */
    public function getFileUrl(Drive_Model_File $file, array $options = null) // {{{
    {
        $dir = $file->Dir;
        $path = array($file->name);
        while ($dir) {
            array_unshift($path, $dir->name);
            $dir = $dir->ParentDir;
        }
        $url = '!' . implode('/', $path);
        if (isset($options['absolute']) && !$options['absolute']) {
            return $url;
        }
        return $this->getView()->serverUrl() . $this->getView()->baseUrl($url);
    } // }}}

    /**
     * Zwraca tablicę wartości, które wymagane są do poprawnego wyświetlenia
     * danych katalogu. Dane nie zawierają danych technicznych (np. kluczy
     * obcych) i są gotowe do bezpośredniego przesłania np. poprzez AJAX.
     *
     * @param Drive_Model_Dir|Drive_Model_File $row
     * @param bool $fetchUserData
     * @return array
     */
    public function getViewableData($row, $fetchUserData = true, $type = null) // {{{
    {
        switch (true) {
            case $row instanceof Drive_Model_Dir:
                $data = array(
                    'dir_id' => (int) $row->dir_id,
                    'name'  => $row->name,
                    'owner' => (int) $row->owner,
                    'ctime' => $this->getDate($row->ctime),
                    'mtime' => $this->getDate((int) $row->mtime),
                    'perms' => $this->getDirPermissions($row),
                    'private' => Drive_Model_DbTable_Dirs::VISIBILITY_PRIVATE == $row->visibility,
                    'created_by' => (int) $row->created_by,
                    'modified_by' => (int) $row->modified_by,
                );
                break;

            case $row instanceof Drive_Model_File:
                $data = array(
                    'file_id' => (int) $row->file_id,
                    'name'  => $row->name,
                    'owner' => (int) $row->owner,
                    'size'  => (int) $row->size,
                    'ctime' => $this->getDate($row->ctime),
                    'mtime' => $this->getDate($row->mtime),
                    'perms' => $this->getFilePermissions($row),
                    'filter'   => $row->filter,
                    'md5sum'   => $row->md5sum,
                    'mimetype' => $row->mimetype,
                    'created_by'  => (int) $row->created_by,
                    'modified_by' => (int) $row->modified_by,
                    'url' => $this->getFileUrl($row),
                );
                break;

            default:
                $data = null;
                break;
        }

        if ($data && $fetchUserData) {
            $data['owner'] = $this->fetchUserData((int) $data['owner']);
            $data['created_by'] = $this->fetchUserData((int) $data['created_by']);
            $data['modified_by'] = $this->fetchUserData((int) $data['modified_by']);
        }

        return $data;
    } // }}}

    public function projectUserData(array $user) // {{{
    {
        $columns = array(
            'user_id' => true,
            'first_name' => true,
            'last_name'  => true,
        );

        $data = array_intersect_key($user, $columns);

        if (count($data)) {
            return array(
                'user_id' => (int) $data['user_id'],
                'name' => $this->getView()->fn($data, array('escape' => false)),
            );
        }

        return null;
    } // }}}

    /**
     * @param int|array|Model_Core_User
     */
    public function fetchUserData($user_id) // {{{
    {
        $user = $this->getUserMapper()->getUser($user_id);
        if ($user) {
            return $this->projectUserData($user->toArray(Maniple_Model::UNDERSCORE));
        }
    } // }}}

    /**
     * Zwracana tablica ma następujące klucze: dir, parents, subdirs, files
     * zawierające odpowiednio dane katalogu, listę katalogów nadrzędnych,
     * listę podkatalogów i listę plików. Rekordy plikow i podkatalogów mają
     * zastąpione pola owner, created_by i modified_by odpowiadającymi im
     * rekordami uzytkownikow.
     *
     * @param int|Drive_Model_Dir $dir
     * @param array $options OPTIONAL
     * @return array
     */
    public function browseDir($dir, $options = null) // {{{
    {
        if (!$dir instanceof Drive_Model_Dir) {
            $dir = $this->fetchDir($dir);
        }

        $user_ids = array(
            $dir->owner       => true,
            $dir->created_by  => true,
            $dir->modified_by => true,
        );

        // pobierz kolejno nadrzedne katalogi, przerwij na pierwszym katalogu,
        // do ktorego biezacy uzytkownik nie ma dostepu
        $parents = array();
        $row = $dir;
        while (($row = $row->fetchParent()) && $this->isDirReadable($row)) {
            // $parents[] = $this->getViewableData($row, false);
            $parents[] = array(
                'dir_id'  => (int) $row->dir_id,
                'name'    => $row->name,
                'perms'   => $this->getDirPermissions($row),
                'private' => Drive_Model_DbTable_Dirs::VISIBILITY_PRIVATE == $row->visibility,
            );
            // $set->add($row->owner, $row->created_by, $row->modified_by);
            $user_ids[$row->owner] = true;
            $user_ids[$row->created_by] = true;
            $user_ids[$row->modified_by] = true;
        }

        $files = array();
        $subdirs = array();

        // w tym miejscu wiadomo ze biezacy uzytkownik ma dostep do katalogu
        // przynajmniej w trybie do odczytu - mozna wylistowac wszystkie pliki

        // filtruj pliki
        $where = array();
        if (isset($options['filter'])) {
            if (isset($options['inverseFilter']) && $options['inverseFilter']) {
                $where['filter <> ?'] = $options['filter'];
            } else {
                $where['filter = ?'] = $options['filter'];
            }
        }

        // posortuj pliki
        if (isset($options['orderByWeight']) && $options['orderByWeight']) {
            $order = 'weight ASC, name ASC';
        } else {
            $order = 'name ASC';
        }

        foreach ($dir->fetchFiles($where) as $row) {
            $files[] = $this->getViewableData($row, false);

            $user_ids[$row->owner] = true;
            $user_ids[$row->created_by] = true;
            $user_ids[$row->modified_by] = true;
        }

        if (!isset($options['filesOnly']) || !$options['filesOnly']) {
            // pobierz podkatalogi
            foreach ($dir->fetchSubDirs() as $row) {
                $subdirs[] = $this->getViewableData($row, false);
                $user_ids[$row->owner] = true;
                $user_ids[$row->created_by] = true;
                $user_ids[$row->modified_by] = true;
            }
        }

        // wczytaj wszystkie potrzebne rekordy uzytkownikow
        $users = $this->getUserMapper()->getUsers(array_keys($user_ids));

        // w kazdym z plikow i podkatalogow oraz katalogow nadrzednych
        // zamien identyfikator wlasciciela na odpowiadajacy mu rekord
        $that = $this;
        $attach_users = function (&$item) use ($that, $users) {
            $owner = $users[$item['owner']];
            $created_by = $users[$item['created_by']];
            $modified_by = $users[$item['modified_by']];

            $item['owner'] = $owner 
                ? $that->projectUserData($owner->toArray(Maniple_Model::UNDERSCORE))
                : null;

            $item['created_by'] = $created_by
                ? $that->projectUserData($created_by->toArray(Maniple_Model::UNDERSCORE))
                : null;

            $item['modified_by'] = $modified_by
                ? $that->projectUserData($modified_by->toArray(Maniple_Model::UNDERSCORE))
                : null;
        };

        // array_walk($parents, $attach_users);
        array_walk($subdirs, $attach_users);
        array_walk($files,   $attach_users);

        // zwroc dane potrzebne do wyswietlenia zawartosci katalogu
        $result = $this->getViewableData($dir);
        $result['parents'] = $parents;
        $result['subdirs'] = $subdirs;
        $result['files']   = $files;

        // dodaj dane dotyczace rozmiaru dysku i zajmowanego miejsca
        $drive = $dir->Drive;
        $result['disk_usage'] = (float) $drive->disk_usage;
        $result['quota'] = (float) $drive->quota;

        return $result;
    } // }}}

    /**
     * @param Drive_Model_Dir $dir
     * @return bool
     */
    public function isDirWritable(Drive_Model_Dir $dir) // {{{
    {
        return $this->getDirPermissions($dir, self::WRITE);
    } // }}}

    /**
     * @param Drive_Model_Dir $dir
     * @return bool
     */
    public function isDirReadable(Drive_Model_Dir $dir) // {{{
    {
        return $this->getDirPermissions($dir, self::READ);
    } // }}}

    /**
     * @param Drive_Model_Dir $dir
     * @return bool
     */
    public function isDirShareable(Drive_Model_Dir $dir) // {{{
    {
        return $this->getDirPermissions($dir, self::SHARE);
    } // }}}

    public function isDirRemovable(Drive_Model_Dir $dir) // {{{
    {
        return $this->getDirPermissions($dir, self::REMOVE);
    } // }}}

    public function isDirChownable(Drive_Model_Dir $dir) // {{{
    {
        return $this->getDirPermissions($dir, self::CHOWN);
    } // }}}

    public function isFileRemovable(Drive_Model_File $file) // {{{
    {
        return $this->isDirWritable($file->Dir);
    } // }}}

    public function isFileReadable(Drive_Model_File $file) // {{{
    {
        return $this->isDirReadable($file->Dir);
    } // }}}

    public function isFileWritable(Drive_Model_File $file) // {{{
    {
        return $this->isDirWritable($file->Dir);
    } // }}}

    public function isFileChownable(Drive_Model_File $file) // {{{
    {
        return $this->isDirChownable($file->Dir);
    } // }}}

    // resources

    public function setTableProvider(Zefram_Db_Table_Provider $tableProvider = null)
    {
        $this->_tableProvider = $tableProvider;
        return $this;
    }

    public function getTableProvider()
    {
        return $this->_tableProvider;
    }

    public function setView(Zend_View_Abstract $view = null)
    {
        $this->_view = $view;
        return $this;
    }

    public function getView() // {{{
    {
        return $this->_view;
    } // }}}

    public function setSecurityContext(Maniple_Security_ContextInterface $security = null)
    {
        $this->_securityContext = $security;
        return $this;
    }

    public function getSecurityContext()
    {
        return $this->_securityContext;
    }

    public function setUserMapper(Core_UserMapperInterface $userMapper = null)
    {
        $this->_userMapper = $userMapper;
        return $this;
    }

    public function getUserMapper()
    {
        return $this->_userMapper;
    }

    public function setUserSearchRoute($userSearchRoute = null)
    {
        $this->_userSearchRoute = $userSearchRoute;
        return $this;
    }

    public function getUserSearchRoute()
    {
        return $this->_userSearchRoute;
    }
}
