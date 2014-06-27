<?php

class ManipleDrive_IndexController extends ManipleDrive_Controller_Action
{
    public function fileAction()
    {
        $path = explode('/', $this->getScalarParam('path'));

        $dirs = $this->getTable('ManipleDrive_Model_DbTable_Dirs');
        $name = array_shift($path);

        $dir = $dirs->fetchRow(array(
            'name = ?' => $name,
            'parent_id IS NULL',
        ));

        if ($dir) {
            $file = $this->getTable('ManipleDrive_Model_DbTable_Drives')->fetchByPath(
                $dir->Drive, implode('/', $path)
            );
            if ($file) {
                if ($this->getDriveHelper()->isFileReadable($file)) {
                    $this->_helper->serveFile(
                        $file->getPath(),
                        array(
                            'type' => $file->mimetype,
                            'name' => $file->name,
                        )
                    );
                } else {
                    if ($this->getSecurityContext()->isAuthenticated()) {
                        echo 'Nie masz uprawnień do oglądania tego pliku';
                        exit;
                    } else {
                        $this->_forward(
                            'login', 'auth', 'core', array(
                                'continue' => $this->getDriveHelper()->getFileUrl($file, array(
                                    'absolute' => false,
                                )),
                                'auth_required' => true
                            )
                        );
                        return;
                    }
                }
            }
        }

        echo '404 Not Found';
        exit;
    }

    public function dashboardAction()
    {
        $this->getSecurityContext()->requireAuthentication();

        $user_id = $this->getSecurityContext()->getUser()->getId();
        $drive_helper = $this->getDriveHelper();

        $drive = $drive_helper->getRepository()->getDriveByUserId($user_id);
        $drive_files = array();

        if ($drive) {
            // attach details about drive contents / usage
            $drive = new Zefram_Stdlib_ObjectWrapper($drive);
            $drive->addExtras($drive_helper->getRepository()->getDriveSummary($drive->drive_id));

            foreach ($drive_helper->getRepository()->getLastUploadedFiles($drive->drive_id, 5) as $file) {
                $drive_files[] = $drive_helper->getViewableData($file, false);
            }
        }

        $user_ids = array();

        $shared_files = array();
        foreach ($drive_helper->getRepository()->getLastSharedWithUserFiles($user_id, 5) as $file) {
            $shared_files[] = $drive_helper->getViewableData($file, false);
            $user_ids[$file->created_by] = true;
        }

        $public_files = array();
        foreach ($drive_helper->getRepository()->getLastPublishedFiles(null, 5) as $file) {
            $public_files[] = $drive_helper->getViewableData($file, false);
            $user_ids[$file->created_by] = true;
        }

        $users = array();
        foreach ($drive_helper->getUserMapper()->getUsers(array_keys($user_ids)) as $user) {
            $users[$user->getId()] = $user;
        }

        foreach ($shared_files as &$file) {
            $file['creator'] = isset($users[$file['created_by']]) ? $users[$file['created_by']] : null;
        }
        unset($file);

        foreach ($public_files as &$file) {
            $file['creator'] = isset($users[$file['created_by']]) ? $users[$file['created_by']] : null;
        }
        unset($file);

        $this->view->drive = $drive;
        $this->view->drive_files = $drive_files;

        $this->view->shared_files = $shared_files;
        $this->view->public_files = $public_files;
    }
}
