<?php

class Drive_BrowseController extends Drive_Controller_Action
{
    public function browseAction()
    {
        $path = $this->getScalarParam('path');
        if (null === $path) {
            $this->assertAccess($this->getSecurityContext()->isAuthenticated());

            $db = $this->getResource('db');
            $drive = $this->getDriveHelper()->getTableProvider()->getTable('Drive_Model_DbTable_Drives')
                ->fetchRow(array('owner = ?' => $this->getSecurityContext()->getUser()->getId()), 'drive_id');
            if (empty($drive)) {
                throw new Exception('Drive was not found');
            }
            $dir = $drive->RootDir;

        } else {
            $parts = explode('/', trim($path, '/'));
            $drive_id = array_shift($parts);

            switch ($drive_id) {
                case 'shared':
                    $dir = new Drive_Model_SharedDir(
                        $this->getSecurityContext()->getUserId(),
                        $this->getDriveHelper()->getTableProvider()->getTable('Drive_Model_DbTable_Dirs')
                    );
                    break;

                case 'public':
                    $dir = new Drive_Model_PublicDir(
                        $this->getSecurityContext()->getUserId(),
                        $this->getDriveHelper()->getTableProvider()->getTable('Drive_Model_DbTable_Dirs')
                    );
                    break;

                default:
                    $drive = $this->getDriveHelper()->getTableProvider()->getTable('Drive_Model_DbTable_Drives')->findRow($drive_id);
                    if (empty($drive)) {
                        throw new Exception('Drive was not found');
                    }
                    $dir = $drive->RootDir;
                    break;
            }
        }

        if (empty($dir)) {
            throw new Exception('Invalid ID path specified');
        }

        $parents = null;

        if (isset($parts)) {
            $dirs = array($dir);
            $parent = 0;
            while ($part = array_shift($parts)) {
                $dir = $dirs[$parent]->findChild($part);
                if (empty($dir)) {
                    throw new Exception('Invalid ID path specified');
                }
                $dirs[++$parent] = $dir;
            }

            $dir = array_pop($dirs);
            $parents = $dirs;
        }

        echo '<pre>';
        print_r($this->getDriveHelper()->browseDir2($dir, $parents));
        exit;
    }
}
