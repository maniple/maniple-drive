<?php

abstract class ManipleDrive_Controller_Action extends Maniple_Controller_Action
{
    /**
     * @return ManipleDrive_DriveManager
     */
    public function getDriveManager()
    {
        return $this->getResource('drive.manager');
    }

    /**
     * @return ManipleDrive_Model_DirInterface
     * @throws Maniple_Controller_Exception_NotFound
     */
    public function getDirFromRequest()
    {
        $dir = $this->getParam('dir');

        if ($dir instanceof ManipleDrive_Model_DirInterface) {
            return $dir;
        }

        $dirId = $this->getParam('dir_id');
        $dir = $this->getDriveManager()->getDir($dirId);

        if (!$dir instanceof ManipleDrive_Model_DirInterface) {
            throw new Maniple_Controller_Exception_NotFound('Directory was not found');
        }

        return $dir;
    }

    /**
     * @deprecated
     */
    public function getTable($table)
    {
        return $this->getResource('db.table_provider')->getTable($table);
    }

    /**
     * @deprecated
     */
    public function getDriveHelper()
    {
        return $this->getResource('drive.helper');
    }

    /**
     * @deprecated
     */
    public function getSecurity()
    {
        return $this->getDriveHelper()->getSecurityContext();
    }

    /**
     * @deprecated
     */
    public function getSecurityContext()
    {
        return $this->getDriveHelper()->getSecurityContext();
    }

    /**
     * @deprecated
     */
    public function assertAccess($expr, $message = null)
    {
        if ($expr) {
            return;
        }

        if ($message === null) {
            $message = $this->view->translate('You do not have permissions to perform this action');
        }

        throw new Maniple_Controller_Exception_NotAllowed($message);
    }
}
