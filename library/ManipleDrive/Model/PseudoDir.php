<?php

abstract class ManipleDrive_Model_PseudoDir implements ManipleDrive_Model_DirInterface
{
    public $internal_name = null;

    public function isPseudo()
    {
        return true;
    }

    public function getVisibility()
    {
        return null;
    }

    public function getOwner()
    {
        return null;
    }

    public function getCreatedAt()
    {
        return null;
    }

    public function getCreatedBy()
    {
        return null;
    }

    public function getLastModifiedAt()
    {
        return null;
    }

    public function getLastModifiedBy()
    {
        return null;
    }

    public function getParentDir()
    {
        return null;
    }

    public function getParent()
    {
        return null;
    }

    public function getSharing()
    {
        return null;
    }

    public function getAccessType()
    {
        return null;
    }
}
