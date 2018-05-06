<?php

interface ManipleDrive_Model_EntryInterface
{
    /**
     * Returns ID
     * @return mixed
     */
    public function getId();

    /**
     * Returns name
     * @return string
     */
    public function getName();

    /**
     * Returns owner ID
     * @return int
     */
    public function getOwner();

    /**
     * Returns parent directory
     * @return ManipleDrive_Model_EntryInterface|null
     */
    public function getParent();

    /**
     * Returns sharing setting (public, private, etc.)
     * @return string
     */
    public function getSharing();

    /**
     * Returns access type
     * @return string
     */
    public function getAccessType();
}