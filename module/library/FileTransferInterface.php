<?php

interface ManipleDrive_FileTransferInterface
{
    /**
     * Performs file retrieval and returns the corresponding model
     * @return ManipleDrive_Model_File
     */
    public function getFile();

    /**
     * Returns true if the file has already been saved
     * @return bool
     */
    public function isSaved();
}