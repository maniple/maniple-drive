<?php

class ManipleDrive_Access_HandlerRegistry
{
    /**
     * @var ManipleDrive_Access_HandlerInterface[]
     */
    protected $_handlers;

    /**
     * @var array
     */
    protected $_handlerTypeCache;

    /**
     * Add handler to registry
     *
     * @param ManipleDrive_Access_HandlerInterface $handler
     * @return ManipleDrive_Access_HandlerRegistry
     */
    public function registerHandler(ManipleDrive_Access_HandlerInterface $handler)
    {
        $this->_handlers[] = $handler;
        $this->_handlerTypeCache = null;
        return $this;
    }

    /**
     * Retrieve handler for given type
     *
     * @param string $name
     * @return ManipleDrive_Access_HandlerInterface
     * @throws Exception
     */
    public function getHandlerForType($type)
    {
        if (!isset($this->_handlerTypeCache[$type])) {
            $found = null;
            foreach (array_reverse($this->_handlers) as $handler) {
                /** @var $handler ManipleDrive_Access_HandlerInterface */
                if ($handler->canHandleType($type)) {
                    $found = $handler;
                    break;
                }
            }
            if (empty($found)) {
                throw new Exception(sprintf('No handler found for type %s', $type));
            }
            $this->_handlerTypeCache[$type] = $found;
        }
        return $this->_handlerTypeCache[$type];
    }
}