<?php

interface ManipleDrive_Access_HandlerInterface
{
    /**
     * Is provided access type supported by this handler
     * @param $type
     * @return mixed
     */
    public function canHandleType($type);

    /**
     * Get access value
     * @param ManipleDrive_Model_EntryInterface $entry
     * @param ManipleCore_Model_UserInterface $user
     * @return int
     */
    public function getAccess(ManipleDrive_Model_EntryInterface $entry, $user);
}