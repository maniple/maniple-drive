<?php

interface ManipleDrive_Access_HandlerInterface
{
    /**
     * Is provided access type supported by this handler
     * @param ManipleDrive_Model_EntryInterface $entry
     * @return mixed
     */
    public function canHandle(ManipleDrive_Model_EntryInterface $entry);

    /**
     * Get access value
     * @param ManipleDrive_Model_EntryInterface $entry
     * @param ManipleUser_Model_UserInterface $user
     * @return int
     */
    public function getAccess(ManipleDrive_Model_EntryInterface $entry, $user);
}
