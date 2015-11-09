<?php

class ManipleDrive_Access_Manager
    implements \Zend\EventManager\EventManagerAwareInterface
{
    const SHARED_EVENT_ID = 'drive.security';

    const EVENT_COLLECT_HANDLERS = 'collectHandlers';

    /**
     * @var Maniple_Security_ContextAbstract
     */
    protected $_securityContext;

    /**
     * @var \Zend\EventManager\EventManagerInterface
     */
    protected $_eventManager;

    /**
     * @var ManipleDrive_Access_HandlerRegistry
     */
    protected $_handlerManager;

    protected $_collectHandlers = true;

    /**
     * Entry access cache
     * @var array
     */
    protected $_access;

    public function __construct(Maniple_Security_ContextAbstract $securityContext, Zefram_Db $db, \Zend\EventManager\EventManager $events = null)
    {
        $this->_handlerManager = new ManipleDrive_Access_HandlerRegistry();
        $this->_handlerManager->registerHandler(new ManipleDrive_Access_StandardHandler($this));

        $this->_securityContext = $securityContext;

        // FIXME access to shares, should by via repository
        $this->_db = $db;

        if ($events === null) {
            $events = new \Zend\EventManager\EventManager();
        }

        $this->setEventManager($events);
    }

    /**
     * Register access handler
     *
     * @param ManipleDrive_Access_HandlerInterface $handler
     * @return $this
     */
    public function registerHandler(ManipleDrive_Access_HandlerInterface $handler)
    {
        $this->_handlerManager->registerHandler($handler);
        return $this;
    }

    /**
     * @param ManipleDrive_Model_EntryInterface $entry
     * @param int $user
     * @return int
     */
    public function getAccess(ManipleDrive_Model_EntryInterface $entry, $user = null)
    {
        // collect handlers before first use of getAccess(). This is to allow lazy
        // initialization of handlers before this class is instantiated
        if ($this->_collectHandlers) {
            $this->_collectHandlers = false;
            $this->_trigger(self::EVENT_COLLECT_HANDLERS);
        }

        if ($user === null) {
            $user = ($u = $this->_securityContext->getUser()) ? $u->getId() : null;
        }
        $key = sprintf('%d.%s', $user, $entry->getId());
        if (!isset($this->_access[$key])) {
            $handler = $this->_handlerManager->getHandlerForEntry($entry);
            $this->_access[$key] = $handler->getAccess($entry, $user);
        }
        return $this->_access[$key];
    }

    /**
     * Get user shares for given entry
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
            if (@$row->can_write) {
                $access |= ManipleDrive_Access_Access::ACCESS_WRITE;
            }
        }
        return $access;
    }

    /**
     * Get security context
     * @return Maniple_Security_ContextAbstract
     */
    public function getSecurityContext()
    {
        return $this->_securityContext;
    }

    public function setEventManager(Zend\EventManager\EventManagerInterface $events)
    {
        // identifiers are important for shared events
        $events->setIdentifiers(array(
            __CLASS__,
            get_class($this),
            self::SHARED_EVENT_ID,
        ));
        $this->_eventManager = $events;
        return $this;
    }

    public function getEventManager()
    {
        return $this->_eventManager;
    }

    protected function _trigger($name, array $params = array())
    {
        $event = new \Zend\EventManager\Event();
        $event->setName($name);
        $event->setParam('security', $this);
        if ($params) {
            $event->setParams($params);
        }
        $this->_eventManager->trigger($event);
    }
}