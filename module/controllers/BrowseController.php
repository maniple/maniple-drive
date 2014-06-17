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
            // retrieve root dir
            $parts = explode('/', trim($path, '/'));
            $segment = array_shift($parts);

            switch ($segment) {
                case 'shared':
                    $dir = new Drive_Model_PseudoDir_SharedEntries(
                        $this->getSecurityContext()->getUserId(),
                        $this->getDriveHelper()->getTableProvider()
                    );
                    break;

                case 'public':
                    $dir = new Drive_Model_PseudoDir_DrivesWithPublicEntries(
                        $this->getDriveHelper()->getTableProvider()
                    );
                    break;

                default:
                    $tableProvider = $this->getDriveHelper()->getTableProvider();
                    // fetch root directory of given ID
                    $select = Zefram_Db_Select::factory($tableProvider->getAdapter());
                    $select->from(
                        array('dirs' => $tableProvider->getTable('Drive_Model_DbTable_Dirs'))
                    );
                    $select->join(
                        array('drives' => $tableProvider->getTable('Drive_Model_DbTable_Drives')),
                        'drives.root_dir = dirs.dir_id',
                        array()
                    );
                    $select->where('dir_id = ?', (int) $segment);

                    $dir = $tableProvider->getTable('Drive_Model_DbTable_Dirs')->fetchRow($select);
                    if (empty($dir)) {
                        throw new Exception('Dir was not found');
                    }
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
                $dir = end($dirs)->getSubdir($part);
                if (empty($dir)) {
                    throw new Exception('Invalid ID path specified');
                }
                $dirs[] = $dir;
            }

            $dir = array_pop($dirs);
            $parents = $dirs;
        }

        echo '<pre>';
        print_r($this->getDriveHelper()->browseDir2($dir, $parents));
        exit;
    }
}
