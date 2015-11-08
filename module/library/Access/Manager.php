<?php

class ManipleDrive_Access_Manager
{
    /**
     * @var ManipleDrive_Access_HandlerRegistry
     */
    protected $_handlerManager;

    /**
     * Entry access cache
     * @var array
     */
    protected $_access;

    public function __construct(Maniple_Security_ContextAbstract $securityContext, Zefram_Db $db)
    {
        $this->_handlerManager = new ManipleDrive_Access_HandlerRegistry();
        $this->_handlerManager->registerHandler(new ManipleDrive_Access_StandardHandler($this));

        $this->_securityContext = $securityContext;

        // FIXME access to shares, should by via repository
        $this->_db = $db;
    }

    /**
     * @param ManipleDrive_Model_EntryInterface $entry
     * @param int $user
     * @return int
     */
    public function getAccess(ManipleDrive_Model_EntryInterface $entry, $user = null)
    {
        if ($user === null) {
            $user = ($u = $this->_securityContext->getUser()) ? $u->getId() : null;
        }
        $key = sprintf('%d.%s', $user, $entry->getId());
        if (!isset($this->_access[$key])) {
            $handler = $this->_handlerManager->getHandlerForType($entry->getAccessType());
            $this->_access[$key] = $handler->getAccess($entry, $user);
        }
        return $this->_access[$key];
    }

    /**
     * @param $user
     * @param ManipleDrive_Model_DirInterface $dir
     * @return int
     */
    public function getSharedAccess(ManipleDrive_Model_DirInterface $dir, $user)
    {
        $row = $this->_db->getTable('ManipleDrive_Model_DbTable_DirShares')->fetchRow(array(
            'dir_id = ?' => (int) $dir->getId(),
            'user_id = ?' => (int) $user,
        ));
        $access = ManipleDrive_Access_Access::ACCESS_NONE;
        if ($row) {
            $access |= ManipleDrive_Access_Access::ACCESS_READ;
            if ($row->can_write) {
                $access |= ManipleDrive_Access_Access::ACCESS_WRITE;
            }
        }
        return $access;
    }

    public function isSuperUser($user)
    {
        return $this->_securityContext->isSuperUser($user);
    }
}