<?php

class ManipleDrive_Helper
{
    /**
     * @var Zefram_View_Interface
     */
    protected $_view;

    /**
     * @Inject
     * @var Zefram_Db
     */
    protected $_db;

    /**
     * @Inject('user.model.userMapper')
     * @var ManipleUser_Model_UserMapperInterface
     */
    protected $_userRepository;

    /**
     * @var string
     */
    protected $_userSearchRoute;

    /**
     * @var Zend_EventManager_EventManager
     */
    protected $_eventManager;

    /**
     * @var ManipleDrive_Access_Manager
     */
    protected $_security;

    public function __construct()
    {
        $this->setEventManager(new Zend_EventManager_EventManager());
    }

    /**
     * @return Zefram_Db
     */
    public function getDb()
    {
        return $this->_db;
    }

    /**
     * @param ManipleDrive_Access_Manager $security
     * @return $this
     */
    public function setSecurity(ManipleDrive_Access_Manager $security)
    {
        $this->_security = $security;
        return $this;
    }

    /**
     * @return ManipleDrive_Access_Manager
     * @throws Exception
     */
    public function getSecurity()
    {
        if (empty($this->_security)) {
            throw new Exception('Security manager has not been provided');
        }
        return $this->_security;
    }

    public function setEventManager(Zend_EventManager_EventManager $eventManager)
    {
        try {
            /** @var Zend_Application_Bootstrap_BootstrapAbstract $bootstrap */
            $bootstrap = Zend_Controller_Front::getInstance()->getParam('bootstrap');
            $sharedEventManager = $bootstrap->getResource('SharedEventManager');
        } catch (Exception $e) {
            $sharedEventManager = null;
        }

        $this->_eventManager = $eventManager;
        $this->_eventManager->setIdentifiers(array(
            __CLASS__,
            'drive.helper',
        ));

        if ($sharedEventManager) {
            $this->_eventManager->setSharedCollections($sharedEventManager);
        }

        return $this;
    }

    public function getEventManager()
    {
        return $this->_eventManager;
    }

    public function fetchDir($dir_id)
    {
        return $this->getDir($dir_id);
    }

    /**
     * Pobiera z bazy rekord katalogu i sprawdza, czy bieżący użytkownik
     * ma uprawnienia do jego odczytu.
     *
     * @param int|string $dir_id
     * @return ManipleDrive_Model_Dir
     */
    public function getDir($dir_id)
    {
        return $this->getRepository()->getDirOrThrow($dir_id);
    }

    /**
     * Pobiera z bazy rekord pliku i sprawdza, czy bieżący użytkownik ma
     * uprawnienia do jego odczytu.
     *
     * @param int $file_id
     * @return ManipleDrive_Model_File
     * @throws Zend_Db_Table_Exception
     * @throws Exception
     */
    public function fetchFile($file_id)
    {
        $file_id = (int) $file_id;
        $file = $this->_db->getTable(ManipleDrive_Model_DbTable_Files::className)->findRow($file_id);

        if (empty($file)) {
            throw new Exception('Plik nie został znaleziony', 404);
        }

        if (!$this->isDirReadable($file->Dir)) {
            throw new Exception('Nie masz uprawnień dostępu do tego pliku', 403);
        }

        return $file;
    }

    const READ   = 'read';
    const WRITE  = 'write';
    const RENAME = 'rename';
    const REMOVE = 'remove';
    const SHARE  = 'share';
    const CHOWN  = 'chown';
    const ADMIN  = 'admin';

    const PERM_CHANGE_OWNER = 'drive.change_owner';
    const PERM_READ_ANY     = 'drive.read_any';
    const PERM_EDIT_ANY     = 'drive.edit_any';

    protected $_dirPermissions = array();

    /**
     * @param ManipleDrive_Model_DirInterface $dir
     * @param string $property
     * @return mixed
     * @throws Maniple_Security_Exception_InvalidStateException
     */
    public function getDirPermissions(ManipleDrive_Model_DirInterface $dir, $property = null)
    {
        $id = $dir->getId();

        if (empty($this->_dirPermissions[$id])) {
            $access = $this->getSecurity()->getAccess($dir);

            $perms = array(
                '_value'     => $access,
                self::READ   => ManipleDrive_Access_Access::canRead($access),
                self::WRITE  => ManipleDrive_Access_Access::canWrite($access),
                self::RENAME => ManipleDrive_Access_Access::canRename($access),
                self::REMOVE => ManipleDrive_Access_Access::canDelete($access),
                self::SHARE  => ManipleDrive_Access_Access::canShare($access),
                self::CHOWN  => $this->getSecurityContext()->isAllowed(self::PERM_CHANGE_OWNER),
                self::ADMIN  => $this->getSecurityContext()->isSuperUser(),
            );

            $this->_dirPermissions[$id] = $perms;
        }

        if (null === $property) {
            return $this->_dirPermissions[$id];
        }

        return isset($this->_dirPermissions[$id][$property])
            ? $this->_dirPermissions[$id][$property]
            : false;

        // deprecated code



        $dir_id = $dir->dir_id;

        if (empty($this->_dirPermissions[$dir_id])) {
            $user = $this->getSecurityContext()->getUser();
            $user_id = $user ? $user->getId() : null;

            // Dodatkowe reguly:
            // - tylko wlasciciel i administrator moga zmienic ustawienia
            //   prywatnosci katalogu
            // - katalogi w korzeniu nie moga miec zmienionej nazwy, ani nie
            //   moga byc przenoszone w inne miejsce (zmiana nazwy takiego
            //   katalogu jedynie poprzez zmiane nazwy dysku)

            if ($this->getSecurityContext()->isSuperUser()) {
                // superuser ignores readonly flag
                $perms = array(
                    self::READ   => true,
                    self::WRITE  => true,
                    self::RENAME => $dir->parent_id, // internal dirs can be renamed by superuser
                    self::REMOVE => !$dir->is_system && !$dir->system_count && !$dir->isInternal() && $dir->parent_id,
                    self::SHARE  => true,
                    self::CHOWN  => true,
                    self::ADMIN  => true,
                );
            } else {
                $write  = !$dir->is_readonly && ($this->getSecurityContext()->isAllowed(self::PERM_EDIT_ANY) || $dir->isWritable($user_id));
                $read   = $this->getSecurityContext()->isAllowed(self::PERM_READ_ANY) || $dir->isReadable($user_id);
                $rename = false;
                $remove = false;

                // zeby przeniesc lub usunac katalog trzeba miec uprawnienia do
                // zapisu tego katalogu, oraz miec uprawnienia do zapisu
                // w katalogu nadrzednym (ten ostatni musi istniec)
                if ($write && ($parent = $dir->getParentDir()) && $this->isDirWritable($parent)) {
                    $remove = !$dir->is_system && !$dir->is_readonly && !$dir->system_count && !$dir->isInternal();
                    $rename = !$dir->is_readonly;
                }

                $perms = array(
                    self::READ   => $read,
                    self::WRITE  => $write,
                    self::RENAME => $rename,
                    self::REMOVE => $remove,
                    self::SHARE  => $dir->owner && $dir->owner == $user_id,
                    self::CHOWN  => $this->getSecurityContext()->isAllowed(self::PERM_CHANGE_OWNER),
                    self::ADMIN  => false,
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
    }

    /**
     * @param ManipleDrive_Model_File $file
     * @return mixed
     * @throws Maniple_Security_Exception_InvalidStateException
     */
    public function getFilePermissions(ManipleDrive_Model_File $file)
    {
        $user = $this->getSecurityContext()->getUser();
        $perms = $this->getDirPermissions($file->Dir);

        if ($user) {
            if ($file->owner == $user->getId() || $this->getSecurityContext()->isSuperUser()) {
                $perms[self::READ]   = true;
                $perms[self::WRITE]  = true;
                $perms[self::RENAME] = true;
                $perms[self::REMOVE] = true;
                $perms[self::SHARE]  = true;
                $perms[self::ADMIN]  = $this->getSecurityContext()->isSuperUser();
            }
        }

        return $perms;
    }

    public function getDate($time)
    {
        return (float) $time;
    }

    /**
     * @param  ManipleDrive_Model_File $file
     * @param  array $options
     * @return string
     */
    public function getFileUrl(ManipleDrive_Model_File $file, array $options = null)
    {
        $dir = $file->Dir;
        $path = array(urlencode($file->name));
        while ($dir) {
            array_unshift($path, urlencode($dir->name));
            $dir = $dir->ParentDir;
        }
        $url = '!' . implode('/', $path);
        if (isset($options['download']) && $options['download']) {
            $url .= '?download=1';
        }
        if (isset($options['absolute']) && !$options['absolute']) {
            return $url;
        }
        return $this->getView()->serverUrl() . $this->getView()->baseUrl($url);
    }

    /**
     * Zwraca tablicę wartości, które wymagane są do poprawnego wyświetlenia
     * danych katalogu. Dane nie zawierają danych technicznych (np. kluczy
     * obcych) i są gotowe do bezpośredniego przesłania np. poprzez AJAX.
     *
     * @param ManipleDrive_Model_DirInterface|ManipleDrive_Model_File $row
     * @param bool $fetchUserData
     * @return array
     * @throws Maniple_Security_Exception_InvalidStateException
     */
    public function getViewableData($row, $fetchUserData = true, $type = null)
    {
        switch (true) {
            case $row instanceof ManipleDrive_Model_Dir:
                $data = array(
                    'dir_id' => $row->getId(),
                    'name'  => $row->getName(),
                    'owner' => $row->getOwner(),
                    'ctime' => $this->getDate($row->ctime),
                    'mtime' => $this->getDate((int) $row->mtime),
                    'perms' => $this->getDirPermissions($row),
                    'private' => ManipleDrive_Model_DbTable_Dirs::VISIBILITY_PRIVATE == $row->visibility,
                    'created_by' => (int) $row->created_by,
                    'modified_by' => (int) $row->modified_by,
                );
                break;

            case $row instanceof ManipleDrive_Model_File:
                $data = array(
                    'file_id' => (int) $row->file_id,
                    'dir_id'  => (int) $row->dir_id, // a must-have, to know if uploaded file belongs to current dir
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
                if (in_array($row->mimetype, array('image/jpeg', 'image/png', 'image/gif'))) {
                    $data['thumb_url'] = $this->getView()->url('drive.file.thumb', array('file_id' => $row->file_id, 'dims' => '100x100'));
                    $data['preview_url'] = $this->getView()->url('drive.file.thumb', array('file_id' => $row->file_id));
                }

                // content metadata
                $title = trim($row->title);
                $data['title'] = strlen($title) ? $title : $row->name;
                $data['author'] = $row->author;
                $data['description'] = $row->description;
                break;

            case $row instanceof ManipleDrive_Model_DirInterface:
                $data = array(
                    // 'class' => get_class($row),
                    'dir_id' => $row->getId(),
                    'name'  => $row->getName(),
                    'owner' => $row->getOwner(),
                    'ctime' => null,
                    'mtime' => null,
                    'perms' => $this->getDirPermissions($row),
                    'private' => false,
                    'created_by' => null,
                    'modified_by' => null,
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

        if ($row instanceof ManipleDrive_Model_Dir) {
            $dir = $row;
        } elseif ($row instanceof ManipleDrive_Model_File) {
            $dir = $row->Dir;
        } else {
            $dir = null;
        }

        if ($dir) {
            $data = array_merge($data, $this->getUsageSummary($dir));
        }

        return $data;
    }

    public function projectUserData(array $user)
    {
        $columns = array(
            'user_id' => true,
            'first_name' => true,
            'last_name'  => true,
        );

        $data = array_intersect_key($user, $columns);

        if (count($data)) {
            return array(
                'user_id' => (int) @$data['user_id'],
                'name' => $this->getView()->fullName($data, array(
                    'escape' => false,
                    'firstNameAttrib' => 'first_name',
                    'lastNameAttrib'  => 'last_name',
                )),
            );
        }

        return null;
    }

    /**
     * @param int|array|ManipleUser_Model_UserInterface
     * @return array
     */
    public function fetchUserData($user_id)
    {
        /** @var ManipleUser_Model_UserInterface $user */
        $user = $this->getUserMapper()->getUser($user_id);
        if ($user) {
            return $this->projectUserData(array(
                'user_id' => $user->getId(),
                'first_name' => $user->getFirstName(),
                'last_name' => $user->getLastName(),
                'mid_name' => method_exists($user, 'getMiddleName') ? $user->getMiddleName() : '',
            ));
        }
    }

    protected function _isPseudoRootDir($name)
    {
        return in_array($name, array('shared', 'public'), true);
    }

    protected function _getPseudoRootDir($name)
    {
        switch ($name) {
            case 'shared':
                return new ManipleDrive_Model_SharedDir(
                    $this->getSecurityContext()->getUser()->getId(),
                    $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className)
                );

            case 'public':
                return new ManipleDrive_Model_PublicDir(
                    $this->getSecurityContext()->getUser()->getId(),
                    $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className)
                );
        }

        throw new Exception(sprintf('Invalid pseudo-root directory ID specified (%s)', $name));
    }

    /**
     * Zwracana tablica ma następujące klucze: dir, parents, subdirs, files
     * zawierające odpowiednio dane katalogu, listę katalogów nadrzędnych,
     * listę podkatalogów i listę plików. Rekordy plikow i podkatalogów mają
     * zastąpione pola owner, created_by i modified_by odpowiadającymi im
     * rekordami uzytkownikow.
     *
     * @param ManipleDrive_Model_DirInterface $dir
     * @param array $parents OPTIONAL
     * @param array $options OPTIONAL
     * @return array
     * @throws Exception
     */
    public function browseDir2(ManipleDrive_Model_DirInterface $dir, array $parents = null, $options = null)
    {
        if (!$this->isDirReadable($dir)) {
            throw new Exception('You cannot read this directory');
        }

        $user_ids = array();

        if ($owner = $dir->getOwner()) {
            $user_ids[$owner] = true;
        }

        // build path to the current dir

        $path_segments = array();
        if ($parents) {
            foreach ($parents as $parent) {
                $path_segments[] = $parent->getId();
            }
        }
        $path_segments[] = $dir->getId();

            // $dir->created_by  => true,
            // $dir->modified_by => true,

        $parentsData = array();

        if ($parents) {
            $keys = array_keys($parents);
            for ($i = count($parents) - 1; $i >= 0; --$i) {
                $parent = $parents[$keys[$i]];
                if (!$this->isDirReadable($parent)) {
                    break;
                }
                $path = implode('/', array_slice($path_segments, 0, $i + 1));
                $data = array(
                    'dir_id'  => $parent->getId(),
                    'path'    => $path,
                    'name'    => $parent->getName(),
                    'perms'   => $this->getDirPermissions($parent),
                    'private' => ManipleDrive_Model_DbTable_Dirs::VISIBILITY_PRIVATE == @$parent->visibility,
                );

                if ($parent->getOwner()) {
                    $user_ids[$parent->getOwner()] = true;
                }

                $user_ids[@$parent->created_by] = true;
                $user_ids[@$parent->modified_by] = true;

                array_unshift($parentsData, $data);
            }
        }

        $files = array();
        $subdirs = array();

        // w tym miejscu wiadomo ze biezacy uzytkownik ma dostep do katalogu
        // przynajmniej w trybie do odczytu - mozna wylistowac wszystkie pliki

        // filtruj pliki
        $where = array();
        $filter = null;
        $inverseFilter = null;
        if (isset($options['filter'])) {
            $filter = $options['filter'];
            $inverseFilter = isset($options['inverseFilter']) && $options['inverseFilter'];
        }

        // posortuj pliki
        if (isset($options['orderByWeight']) && $options['orderByWeight']) {
            $order = 'weight ASC, name ASC';
        } else {
            $order = 'name ASC';
        }

        foreach ($dir->getFiles() as $row) {
            if ($filter) {
                if (($inverseFilter && $row->filter == $filter) ||
                    (!$inverseFilter && $row->filter != $filter)
                ) {
                    continue;
                }
            }
            $files[] = $this->getViewableData($row, false);

            $user_ids[$row->owner] = true;
            $user_ids[$row->created_by] = true;
            $user_ids[$row->modified_by] = true;
        }


        $path = implode('/', $path_segments);

        if (!isset($options['filesOnly']) || !$options['filesOnly']) {
            // pobierz podkatalogi
            foreach ($dir->getSubDirs() as $row) {
                $subdir = $this->getViewableData($row, false);
                $subdir['path'] = $path . '/' . $row->getId();
                $subdirs[] = $subdir;

                $user_ids[@$row->owner] = true;
                $user_ids[@$row->created_by] = true;
                $user_ids[@$row->modified_by] = true;
            }
        }

        // wczytaj wszystkie potrzebne rekordy uzytkownikow
        $users = $this->getUserMapper()->getUsers(array_keys($user_ids));

        // w kazdym z plikow i podkatalogow oraz katalogow nadrzednych
        // zamien identyfikator wlasciciela na odpowiadajacy mu rekord
        $that = $this;
        $attach_users = function (&$item) use ($that, $users) {
            $owner = @$users[$item['owner']];
            $created_by = @$users[$item['created_by']];
            $modified_by = @$users[$item['modified_by']];

            $item['owner'] = $owner
                ? $that->projectUserData($that->_userToArray($owner))
                : null;

            $item['created_by'] = $created_by
                ? $that->projectUserData($that->_userToArray($created_by))
                : null;

            $item['modified_by'] = $modified_by
                ? $that->projectUserData($that->_userToArray($modified_by))
                : null;
        };

        // array_walk($parents, $attach_users);
        array_walk($subdirs, $attach_users);
        array_walk($files,   $attach_users);

        // zwroc dane potrzebne do wyswietlenia zawartosci katalogu
        $result = $this->getViewableData($dir);

        $result['path'] = $path;
        $result['parents'] = $parentsData;
        $result['subdirs'] = $subdirs;
        $result['files']   = $files;

        $result['visibility'] = @$dir->visibility;
        $result['can_inherit_visibility'] = !$dir->isPseudo() && $dir->parent_id;

        // dodaj dane dotyczace rozmiaru dysku i zajmowanego miejsca
        if ($dir instanceof ManipleDrive_Model_Dir) {
            $result = array_merge($result, $this->getUsageSummary($dir));
        }

        return $result;
    }

    public function getUsageSummary(ManipleDrive_Model_Dir $dir)
    {
        $quota = null;
        $diskUsage = null;

        try {
            /** @var ManipleDrive_Model_Drive $drive */
            $drive = $dir->getDrive();
            if ($drive) {
                $result['disk_usage'] = +$drive->getDiskUsage();
                $result['quota'] = +$drive->quota;
            }
        } catch (Exception $e) {}

        if ($quota === null) {
            $diskUsage = +$dir->byte_count;

            $d = $dir;
            while ($d) {
                $maxByteSize = +$d->getMaxByteSize();
                if ($maxByteSize) {
                    $quota = $maxByteSize;
                    break;
                }
                $d = $d->getParentDir();
            }
        }

        return array(
            'quota'      => +$quota,
            'disk_usage' => $diskUsage,
        );
    }

    public function _userToArray($user)
    {
        if (method_exists($user, 'toArray')) {
            return $user->toArray(Maniple_Model::UNDERSCORE);
        }
        return array(
            'user_id' => $user->getId(),
            'first_name' => $user->getFirstName(),
            'last_name' => $user->getLastName(),
        );
    }

    /**
     * @param ManipleDrive_Model_Dir $dir
     * @return bool
     * @throws Maniple_Security_Exception_InvalidStateException
     */
    public function isDirWritable(ManipleDrive_Model_Dir $dir)
    {
        return $this->getDirPermissions($dir, self::WRITE);
    }

    /**
     * @param ManipleDrive_Model_DirInterface $dir
     * @return bool
     */
    public function isDirReadable(ManipleDrive_Model_DirInterface $dir)
    {
        return $this->getDirPermissions($dir, self::READ);
    }

    /**
     * @param ManipleDrive_Model_DirInterface $dir
     * @return bool
     */
    public function isDirShareable(ManipleDrive_Model_DirInterface $dir)
    {
        return $this->getDirPermissions($dir, self::SHARE);
    }

    public function isDirRemovable(ManipleDrive_Model_DirInterface $dir)
    {
        return $this->getDirPermissions($dir, self::REMOVE);
    }

    public function isDirChownable(ManipleDrive_Model_DirInterface $dir)
    {
        return $this->getDirPermissions($dir, self::CHOWN);
    }

    public function isFileRemovable(ManipleDrive_Model_File $file)
    {
        return $this->isDirWritable($file->Dir);
    }

    public function isFileReadable(ManipleDrive_Model_File $file)
    {
        return $this->isDirReadable($file->Dir);
    }

    public function isFileWritable(ManipleDrive_Model_File $file)
    {
        return $this->isDirWritable($file->Dir);
    }

    public function isFileChownable(ManipleDrive_Model_File $file)
    {
        return $this->isDirChownable($file->Dir);
    }

    // resources

    public function setTableProvider(Zefram_Db_Table_FactoryInterface $tableProvider = null)
    {
        $this->_tableProvider = $tableProvider;
        return $this;
    }

    public function setView(Zend_View_Abstract $view = null)
    {
        $this->_view = $view;
        return $this;
    }

    public function getView()
    {
        return $this->_view;
    }

    /**
     * @return Maniple_Security_ContextAbstract
     */
    public function getSecurityContext()
    {
        return $this->getSecurity()->getSecurityContext();
    }

    public function setUserRepository(ManipleUser_Model_UserMapperInterface $userRepository)
    {
        if (!$userRepository instanceof ManipleUser_Model_UserMapperInterface
        ) {
            throw new InvalidArgumentException(sprintf(
                'User repository must be an instance of %s, %s given',
                'ManipleUser_Model_UserMapperInterface',
                is_object($userRepository) ? get_class($userRepository) : gettype($userRepository)
            ));
        }
        $this->_userRepository = $userRepository;
        return $this;
    }

    /**
     * @return ManipleUser_Model_UserMapperInterface
     */
    public function getUserRepository()
    {
        return $this->_userRepository;
    }

    /**
     * @param ManipleUser_Model_UserMapperInterface $userRepository
     * @return $this
     * @throws InvalidArgumentException
     * @deprecated Use setUserRepository instead
     */
    public function setUserMapper(ManipleUser_Model_UserMapperInterface $userRepository)
    {
        return $this->setUserRepository($userRepository);
    }

    /**
     * @return ManipleUser_Model_UserMapperInterface
     */
    public function getUserMapper()
    {
        return $this->getUserRepository();
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

    public function getRepository()
    {
        return new ManipleDrive_Model_Repository($this->_db);
    }
}
