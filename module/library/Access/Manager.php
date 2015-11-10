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
     * @var ManipleDrive_Access_StandardHandler
     */
    protected $_defaultHandler;

    /**
     * @var ManipleDrive_Access_SecurityEvent
     */
    protected $_event;

    /**
     * @var array
     */
    protected $_handlerCache;

    /**
     * Entry access cache
     * @var array
     */
    protected $_access;

    public function __construct(Maniple_Security_ContextAbstract $securityContext, Zefram_Db $db, \Zend\EventManager\EventManager $events = null)
    {
        $this->_securityContext = $securityContext;
        $this->_defaultHandler = new ManipleDrive_Access_StandardHandler($this);

        // FIXME access to shares, should by via repository
        $this->_db = $db;

        if ($events === null) {
            $events = new \Zend\EventManager\EventManager();
        }

        $this->setEventManager($events);

        $event = new ManipleDrive_Access_SecurityEvent();
        $event->setSecurity($this);
        $event->setTarget($this);

        $this->_event = $event;
    }

    /**
     * Get access for given entry
     *
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
            $handler = $this->getHandlerForEntry($entry);
            $this->_access[$key] = $handler->getAccess($entry, $user);
        }
        return $this->_access[$key];
    }

    /**
     * Get user shares for given entry
     *
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
            if ($row['can_write']) {
                $access |= ManipleDrive_Access_Access::ACCESS_WRITE;
            }
        }
        return $access;
    }

    /**
     * Retrieve access handler for a given entry
     *
     * @param ManipleDrive_Model_EntryInterface $entry
     * @return ManipleDrive_Access_HandlerInterface
     * @throws ManipleDrive_Access_Exception_HandlerNotFoundException
     */
    public function getHandlerForEntry(ManipleDrive_Model_EntryInterface $entry)
    {
        $key = $this->_generateHandlerCacheKey($entry);
        if (!isset($this->_handlerCache[$key])) {
            $results = $this->getEventManager()->trigger(
                self::EVENT_COLLECT_HANDLERS,
                $this->_event,
                // callback used to stop event propagation when handler is found
                function ($result) use ($entry) {
                    return $result instanceof ManipleDrive_Access_HandlerInterface
                        && $result->canHandle($entry);
                }
            );
            $handler = $results->last();
            if ($handler instanceof ManipleDrive_Access_HandlerInterface) {
                $this->_handlerCache[$key] = $handler;
            } else {
                throw new ManipleDrive_Access_Exception_HandlerNotFoundException(
                    sprintf('No handler found for entry %s:%s', get_class($entry), $entry->getId())
                );
            }
        }
        return $this->_handlerCache[$key];
    }

    /**
     * Generate handler cache key for given entry
     *
     * @param ManipleDrive_Model_EntryInterface $entry
     * @return string
     */
    protected function _generateHandlerCacheKey(ManipleDrive_Model_EntryInterface $entry)
    {
        return sprintf('%s.%d', get_class($entry), $entry->getId());
    }

    /**
     * Retrieve the security context
     *
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

        // default handler must have low priority
        $events->attach(self::EVENT_COLLECT_HANDLERS, $this->_defaultHandler, -1000);

        $this->_eventManager = $events;
        return $this;
    }

    public function getEventManager()
    {
        return $this->_eventManager;
    }

    /**
     * Register access handler
     *
     * Use this method to register handler even when access manager is not
     * yet instantiated.
     *
     * Handler can be provided either as an instance, or as a callable, that
     * will be invoked to instantiate a handler. Callable will be invoked
     * with active AccessManager instance as the first (and only) parameter.
     * The result of the invocation will be stored for later use.
     *
     * @param \Zend\EventManager\SharedEventManager $sharedEvents
     * @param ManipleDrive_Access_HandlerInterface|callable $handler
     * @param int $priority OPTIONAL
     * @throws ManipleDrive_Access_Exception_InvalidArgumentException
     */
    public static function registerHandler(\Zend\EventManager\SharedEventManager $sharedEvents, $handler, $priority = 1)
    {
        if ($handler instanceof ManipleDrive_Access_HandlerInterface) {
            $callback = function () use ($handler) {
                return $handler;
            };
        } elseif (is_callable($handler)) {
            $callback = function (ManipleDrive_Access_SecurityEvent $event) use ($handler) {
                static $result = null;
                if ($result === null) {
                    $result = call_user_func($handler, $event->getSecurity());
                    if (!$result instanceof ManipleDrive_Access_HandlerInterface) {
                        $result = false;
                    }
                }
                return $result;
            };
        } else {
            throw new ManipleDrive_Access_Exception_InvalidArgumentException('Handler must be an instanceof HandlerInterface or a callable');
        }
        $sharedEvents->attach(self::SHARED_EVENT_ID, self::EVENT_COLLECT_HANDLERS, $callback, $priority);
    }
}
