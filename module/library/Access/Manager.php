<?php

class ManipleDrive_Access_Manager
{
    /**
     * @var Zend_Stdlib_PriorityQueue
     */
    protected static $_sharedHandlers;

    /**
     * @var Maniple_Security_ContextAbstract
     */
    protected $_securityContext;

    /**
     * @var ManipleDrive_Access_StandardHandler
     */
    protected $_defaultHandler;

    /**
     * @var array
     */
    protected $_handlerCache;

    /**
     * Entry access cache
     * @var array
     */
    protected $_access;

    public function __construct(Maniple_Security_ContextAbstract $securityContext, Zefram_Db $db)
    {
        $this->_securityContext = $securityContext;
        $this->_defaultHandler = new ManipleDrive_Access_StandardHandler($this);

        // FIXME access to shares, should by via repository
        $this->_db = $db;
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
            $foundHandler = null;
            if (self::$_sharedHandlers) {
                foreach (self::$_sharedHandlers as $handler) {
                    $handler = $handler($this);
                    /** @var ManipleDrive_Access_HandlerInterface $handler */
                    if ($handler instanceof ManipleDrive_Access_HandlerInterface
                        && $handler->canHandle($entry)
                    ) {
                        $foundHandler = $handler;
                        break;
                    }
                }
            }
            if ($foundHandler) {
                $this->_handlerCache[$key] = $foundHandler;
            } else {
                $this->_handlerCache[$key] = false;
            }
        }
        if ($this->_handlerCache[$key] === false) {
            return $this->_defaultHandler;
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
    public static function registerHandler($handler, $priority = 1)
    {
        if ($handler instanceof ManipleDrive_Access_HandlerInterface) {
            $callback = function () use ($handler) {
                return $handler;
            };
        } elseif (is_callable($handler)) {
            $callback = function (ManipleDrive_Access_Manager $manager) use ($handler) {
                static $result = null;
                if ($result === null) {
                    $result = call_user_func($handler, $manager);
                    if (!$result instanceof ManipleDrive_Access_HandlerInterface) {
                        $result = false;
                    }
                }
                return $result;
            };
        } else {
            throw new ManipleDrive_Access_Exception_InvalidArgumentException('Handler must be an instanceof HandlerInterface or a callable');
        }
        if (self::$_sharedHandlers === null) {
            self::$_sharedHandlers = new Zend_Stdlib_PriorityQueue();
        }
        self::$_sharedHandlers->insert($callback, $priority);
    }
}
