<?php

class ManipleDrive_Access_SecurityEvent extends \Zend\EventManager\Event
{
    /**
     * @var ManipleDrive_Access_Manager
     */
    protected $_security;

    /**
     * @param ManipleDrive_Access_Manager $security
     * @return ManipleDrive_Access_SecurityEvent
     */
    public function setSecurity(ManipleDrive_Access_Manager $security)
    {
        $this->setParam('security', $security);
        $this->_security = $security;
        return $this;
    }

    /**
     * @return ManipleDrive_Access_Manager
     */
    public function getSecurity()
    {
        return $this->_security;
    }
}
