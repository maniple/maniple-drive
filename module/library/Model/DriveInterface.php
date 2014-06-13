<?php

interface Drive_Model_DriveInterface
{
    public function getId();

    /**
     * @return Drive_Model_DirInterface
     */
    public function getRootDir();

    /**
     * @return int
     */
    public function getQuota();

    /**
     * @return int
     */
    public function getUsage();
}
