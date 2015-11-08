<?php

interface ManipleDrive_Model_DirInterface
    extends ManipleDrive_Model_EntryInterface
{
    /**
     * Returns the visibility of this directory
     *
     * @return string|null
     */
    public function getVisibility();

    // public function getCreatedAt();

    // public function getCreatedBy();

    // public function getLastModifiedAt();

    // public function getLastModifiedBy();

    /**
     * Is this directory a pseudo-directory, i.e. not stored in the database
     * and possibly having non-trivial retrieval rules for subdirectories
     * or files.
     *
     * @return bool
     */
    public function isPseudo();

    /**
     * Returns parent directory of this directory.
     *
     * @return ManipleDrive_Model_DirInterface|null
     */
    public function getParentDir();

    /**
     * @return ManipleDrive_Model_DirInterface[]
     */
    public function getSubDirs();

    /**
     * @param  int|string $dirId
     * @return ManipleDrive_Model_DirInterface|null
     */
    public function getSubDir($dirId);

    public function getFiles();

    public function getFile($fileId);

    /**
     * @param  string $name
     * @return ManipleDrive_Model_FileInterface|null
     */
    public function getFileByName($name);
}
