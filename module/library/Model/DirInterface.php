<?php

interface Drive_Model_DirInterface
{
    public function getId();

    public function getName();

    // public function getVisibility();

    // public function getOwner();

    public function isReadable($userId);

    public function isWritable($userId);

    public function isMovable($userId);

    public function isRemovable($userId);

    public function isShareable($userId);

    /**
     * @return Drive_Model_DirInterface[]
     */
    public function getSubdirs();

    /**
     * @param  int|string $dirId
     * @return Drive_Model_DirInterface|null
     */
    public function getSubdir($dirId);

    public function getFiles();
}
