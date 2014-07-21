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
                    $this->getResource('core.file_helper')->sendFile(
                        $this->_request,
                        $this->_response,
                        $file->getPath(),
                        array(
                            'type' => $file->mimetype,
                            'etag' => $file->md5sum,
                            'cache' => true,
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
        $this->assertAccess($this->getSecurityContext()->isAuthenticated());

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

    public function searchAction()
    {
        $q = $this->getScalarParam('q');
        $q = mb_strtolower($q);
        $indexFactory = $this->getResource('search')->getIndexFactory('drive');
        $index = $indexFactory->getIndex('drive');
        if (!$index) {
            echo '[NO RESULTS]';
            exit;
        }

        $hits = $index->search($q);
        exit;
    }

    public function updateIndexAction()
    {
        $this->_helper->viewRenderer->setNoRender();

        $indexFactory = $this->getResource('search')->getIndexFactory('drive');
        $index = $indexFactory->getIndex('drive');
        if ($index) {
            return;
        }

        $index = $indexFactory->createIndex('drive');
        $sql = "SELECT files.*, dirs.drive_id FROM " . 
            $this->getResource('db.table_provider')->tableName('drive_files')
            . " files JOIN " .
            $this->getResource('db.table_provider')->tableName('drive_dirs')
            . " dirs ON files.dir_id = dirs.dir_id ORDER BY ctime";
        $stmt = $this->getResource('db.adapter')->query($sql);
        while ($row = $stmt->fetch()) {
            $doc = new Maniple_Search_Document();
            $doc->addField(Maniple_Search_Field::Meta('file_id', $row['file_id']));
            $doc->addField(Maniple_Search_Field::Meta('name',    mb_strtolower($row['name'])));

            $doc->addField(Maniple_Search_Field::Meta('title',   mb_strtolower($row['title'])));
            $doc->addField(Maniple_Search_Field::Meta('author',  mb_strtolower($row['author'])));

            $doc->addField(Maniple_Search_Field::Text('title_t', $row['title']));
            $doc->addField(Maniple_Search_Field::Meta('author_t',$row['author']));
            $doc->addField(Maniple_Search_Field::Text('name_t',  $row['name']));
            $doc->addField(Maniple_Search_Field::Text('description', $row['description']));

            // TODO extract and index file contents
            $index->insert($doc);
        }
        $index->rebuild();
    }
}
