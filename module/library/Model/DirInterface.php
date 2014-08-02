<?php

interface ManipleDrive_Model_DirInterface
{
    // NOPE! Dir ID is not required
    /**
     * Gets directory ID.
     *
     * @return int|string
     */
    public function getId();

    /**
     * Gets directory name
     *
     * @return string
     */
    public function getName();

    /**
     * Returns the visibility of this directory
     *
     * @return string|null
     */
    public function getVisibility();

    // I'm starting to think that owner is not necessary
    /**
     * Returns user ID of the owner of this directory
     *
     * @return int|null
     */
    public function getOwner();

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
