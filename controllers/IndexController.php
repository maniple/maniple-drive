<?php

class ManipleDrive_IndexController extends ManipleDrive_Controller_Action
{
    /**
     * @Inject
     * @var ManipleDrive_Helper
     */
    protected $_driveHelper;

    /**
     * @Inject('drive.manager')
     * @var ManipleDrive_DriveManager
     */
    protected $_driveManager;

    /**
     * @Inject
     * @var Zefram_Db
     */
    protected $_db;

    /**
     * Return file as optionally scaled image.
     *
     * Action parameters:
     *   - file     (internal usage)
     *   - file_id  (required, if no file was supplied)
     *   - scale    (optional)
     *   - download (optional)
     */
    public function imageAction() // {{{
    {
        $file = $this->getParam('file');

        if (!$file instanceof ManipleDrive_Model_File) {
            $file_id = (int) $this->getScalarParam('file_id');
            $file = $this->_driveHelper->getRepository()->getFileOrThrow($file_id);
        }

        if (!$this->_driveHelper->isFileReadable($file)) {
            throw new Maniple_Controller_NotAllowedException('You are not allowed to access this file');
        }

        if (!in_array($file->mimetype, array('image/jpeg', 'image/gif', 'image/png'))) {
            throw new Exception('File is not an image');
        }

        $image_path = $this->getResource('core.image_helper')->getImagePath(
            $file->getPath(),
            (string) $this->getScalarParam('scale')
        );

        $options = array(
            'type' => $file->mimetype,
            'cache' => true,
        );
        if ($this->getScalarParam('download')) {
            $options['name'] = $file->name;
        }

        $this->getResource('core.file_helper')->sendFile(
            $this->_request,
            $this->_response,
            $image_path,
            $options
        );
    } // }}}

    public function fileAction() // {{{
    {
        $path = explode('/', $this->getScalarParam('path'));

        $dirs = $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className);
        $name = array_shift($path);

        $dir = $dirs->fetchRow(array(
            'name = ?' => $name,
            'parent_id IS NULL',
        ));

        if ($dir) {
            $file = $this->_db->getTable(ManipleDrive_Model_DbTable_Drives::className)->fetchByPath(
                $dir, implode('/', $path)
            );
            if ($file) {
                if ($this->_driveHelper->isFileReadable($file)) {
                    $options = array(
                        'type' => $file->mimetype,
                        'etag' => $file->md5sum,
                        'cache' => true,
                    );
                    if ($this->getScalarParam('download')) {
                        $options['name'] = $file->name; // this will force file download
                    }
                    $this->getResource('core.file_helper')->sendFile(
                        $this->_request,
                        $this->_response,
                        $file->getPath(),
                        $options
                    );
                } else {
                    if ($this->getSecurityContext()->isAuthenticated()) {
                        echo 'Nie masz uprawnień do oglądania tego pliku';
                        exit;
                    } else {
                        $this->_forward(
                            'login', 'auth', 'core', array(
                                'continue' => $this->_driveHelper->getFileUrl($file, array(
                                    'absolute' => false,
                                    'download' => (bool) intval($this->getScalarParam('download')),
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
    } // }}}

    public function dashboardAction()
    {
        $this->assertAccess($this->getSecurityContext()->isAuthenticated());

        $user_id = $this->getSecurityContext()->getUser()->getId();

        $drive = $this->_driveHelper->getRepository()->getDriveByUserId($user_id);
        $drive_files = array();

        if ($drive) {
            // attach details about drive contents / usage
            $drive = new Zefram_Stdlib_ObjectWrapper($drive);
            $drive->addExtras($this->_driveHelper->getRepository()->getDriveSummary($drive->drive_id));

            foreach ($this->_driveHelper->getRepository()->getLastUploadedFiles($drive->drive_id, 5) as $file) {
                $drive_files[] = $this->_driveHelper->getViewableData($file, false);
            }
        }

        $user_ids = array();

        $shared_files = array();
        foreach ($this->_driveHelper->getRepository()->getLastSharedWithUserFiles($user_id, 5) as $file) {
            $data = $this->_driveHelper->getViewableData($file, false);
            $data['dirname'] = $this->dirname($file);
            $shared_files[] = $data;

            $user_ids[$file->created_by] = true;
        }

        $public_files = array();
        /*
        foreach ($drive_helper->getRepository()->getLastPublishedFiles(null, 5) as $file) {
            $public_files[] = $drive_helper->getViewableData($file, false);

            $user_ids[$file->created_by] = true;
        }*/

        $users = array();
        foreach ($this->_driveHelper->getUserMapper()->getUsers(array_keys($user_ids)) as $user) {
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
        $this->view->public_files = null; // $public_files;

        // shared dirs - dirs I have explicit access to
        $this->view->shared_dirs = $this->_driveManager->getSharedDirs();

        $this->view->title = 'Drive dashboard';
    }

    public function dirname(ManipleDrive_Model_File $file)
    {
        $parts = array();
        $dir = $file->Dir;
        while ($dir) {
            array_unshift($parts, $dir->name);
            $dir = $dir->ParentDir;
        }
        return implode('/', $parts);
    }

    public function dirZippedAction()
    {
        set_time_limit(0);
        $dir_id = (int) $this->getScalarParam('dir_id');
        $dir = $this->_driveManager->getDir($dir_id);
        if (!$dir) {
            throw new Exception('Directory not found');
        }

        // TODO store somewhere this file for later use

        $path = Zefram_Os::getTempDir() . '/' . md5(mt_rand());
        $zip = new Zefram_File_Archive_ZipWriter();
        $zip->open($path);
        $dirs = array($dir);

        while ($d = array_shift($dirs)) {
            foreach ($d->getSubDirs() as $dd) {
                $dirs[] = $dd;
            }
            foreach ($d->getFiles() as $file) {
                // full path
                $zip->addFile($file->getPath(), $this->view->drive()->filePath($file, $dir));
            }
        }
        $zip->close();

        $filter = new Zefram_Filter_Slug();
        $this->getResource('core.file_helper')->sendFile(
            $this->_request,
            $this->_response,
            $path,
            array(
                'type' => Zefram_File_MimeType_Data::ZIP,
                'name' => $filter->filter($dir->name) . '.zip',
            )
        );
    }

    public function jsBundleAction()
    {
        $locale = $this->getScalarParam('locale');

        /** @var ManipleDrive_Service_JsBundle $jsBundle */
        $jsBundle = $this->getResource('ManipleDrive.JsBundle');

        $this->_helper->layout->disableLayout();
        $this->_helper->viewRenderer->setNoRender();

        $this->getResponse()
            ->setHeader('Content-Type', 'application/javascript; charset=UTF-8')
            ->setBody($jsBundle->renderSource($locale));
    }
}
