<?php

interface ManipleDrive_FileInterface
{
    /**
     * @return mixed
     */
    public function getId();

    /**
     * @return string
     */
    public function getName();

    /**
     * @return int
     */
    public function getSize();

    /**
     * @return string
     */
    public function getMimeType();
}