<?php

/**
 * Handler stack
 */
class ManipleDrive_Access_HandlerRegistry
{
    /**
     * @var ManipleDrive_Access_HandlerInterface[]
     */
    protected $_handlers;

    /**
     * @var array
     */
    protected $_handlerCache;

    /**
     * Add handler to registry
     *
     * @param ManipleDrive_Access_HandlerInterface $handler
     * @return ManipleDrive_Access_HandlerRegistry
     */
    public function registerHandler(ManipleDrive_Access_HandlerInterface $handler)
    {
        $this->_handlers[] = $handler;
        $this->_handlerCache = null;
        return $this;
    }

    /**
     * Retrieve handler for a given entry
     *
     * @param ManipleDrive_Model_EntryInterface $entry
     * @return ManipleDrive_Access_HandlerInterface
     * @throws ManipleDrive_Access_Exception_HandlerNotFoundException
     */
    public function getHandlerForEntry(ManipleDrive_Model_EntryInterface $entry)
    {
        $key = $this->_generateCacheKey($entry);
        if (!isset($this->_handlerCache[$key])) {
            $found = null;
            foreach (array_reverse($this->_handlers) as $handler) {
                /** @var $handler ManipleDrive_Access_HandlerInterface */
                if ($handler->canHandle($entry)) {
                    $found = $handler;
                    break;
                }
            }
            if (empty($found)) {
                throw new ManipleDrive_Access_Exception_HandlerNotFoundException(
                    sprintf('No handler found for entry %s:%s', get_class($entry), $entry->getId())
                );
            }
            $this->_handlerCache[$key] = $found;
        }
        return $this->_handlerCache[$key];
    }

    /**
     * Generate cache key for given entry
     *
     * @param ManipleDrive_Model_EntryInterface $entry
     * @return string
     */
    protected function _generateCacheKey(ManipleDrive_Model_EntryInterface $entry)
    {
        return sprintf('%s.%d', get_class($entry), $entry->getId());
    }
}