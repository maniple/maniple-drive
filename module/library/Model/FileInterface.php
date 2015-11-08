<?php

interface ManipleDrive_Model_FileInterface
    extends ManipleDrive_Model_EntryInterface
{
    /**
     * @return int
     */
    public function getSize();

    /**
     * @return string
     */
    public function getMimeType();
}