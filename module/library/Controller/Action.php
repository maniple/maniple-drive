<?php

abstract class ManipleDrive_Controller_Action extends Zefram_Controller_Action
{
    public function getTable($table)
    {
        return $this->getResource('db.table_provider')->getTable($table);
    }

    public function getDriveHelper()
    {
        return $this->getResource('drive.helper');
    }

    public function getSecurity()
    {
        return $this->getDriveHelper()->getSecurityContext();
    }

    public function getSecurityContext()
    {
        return $this->getDriveHelper()->getSecurityContext();
    }

    public function assertAccess($expr, $message = null)
    {
        if ($expr) {
            return;
        }

        if ($message === null) {
            $message = $this->view->translate('You do not have permissions to perform this action');
        }

        throw new Exception($message);
    }
}
