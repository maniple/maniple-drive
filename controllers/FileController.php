<?php

class ManipleDrive_FileController extends ManipleDrive_Controller_Action
{
    const className = __CLASS__;

    /**
     * @Inject
     * @var ManipleDrive_Helper
     */
    protected $_driveHelper;

    public function readAction() // {{{
    {
        $file_id = (string) $this->getScalarParam('file_id');
        $file = $this->_driveHelper->getRepository()->getFileOrThrow($file_id);

        if (!$this->_driveHelper->isFileReadable($file)) {
            if (!$this->getSecurity()->isAuthenticated()) {
                $continue = $this->_request->getRequestUri();
                $this->forward('login', 'auth', 'maniple-user', compact('continue'));
                return;
            }
            echo '403 Forbidden';
            exit;
        }

        $this->getResource('core.file_helper')->sendFile(
            $this->_request,
            $this->_response,
            $file->getPath(),
            array(
                'type' => $file->mimetype,
                'name' => $file->name,
                'cache' => true,
                'etag' => $file->md5sum,
            )
        );
    } // }}}

    /**
     * Parametry wywołania:
     * file_id - identyfikator przenoszonego pliku
     * dir_id - identyfikator docelowego katalogu
     */
    public function moveAction() // {{{
    {
        $file_id = $this->getScalarParam('file_id');
        $file = $this->_driveHelper->fetchFile($file_id);
        $this->assertAccess($this->_driveHelper->isDirWritable($file->Dir));

        $dir_id = $this->_request->getPost('dir_id');
        $dir = $this->_driveHelper->fetchDir($dir_id);
        $this->assertAccess($this->_driveHelper->isDirWritable($dir));

        $db = $file->getAdapter();
        $db->beginTransaction();

        try {
            $file->dir_id = $dir->dir_id;
            $file->weight = 0; // reset file weight
            $file->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->sendAndExit();
    } // }}}

    /**
     * Zmiana właściciela pliku. Parametry wywołania akcji (id, owner)
     * muszą być przekazane metodą POST.
     *
     * @version 2012-12-18
     */
    public function chownAction() // {{{
    {
        $file_id = (string) $this->_request->getPost('file_id');
        $file = $this->_driveHelper->fetchFile($file_id);

        $this->assertAccess($this->_driveHelper->isFileChownable($file));

        $db = $file->getAdapter();

        $owner_id = (int) $this->_request->getPost('owner');
        $owner = $this->_driveHelper->getUserMapper()->getUser($owner_id);

        if (!$owner) {
            throw new InvalidArgumentException('Niepoprawny identyfikator użytkownika');
        }

        $user = $this->getSecurityContext()->getUser();

        $db->beginTransaction();

        try {
            $file->owner = $owner->id;
            $file->modified_by = $user->getId();
            $file->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData(array(
            'file_id' => $file->file_id,
            'owner' => $this->_driveHelper->projectUserData($owner),
            'mtime' => $this->_driveHelper->getDate($file->mtime),
            'modified_by' => $this->_driveHelper->projectUserData($user),
        ));
        $ajaxResponse->sendAndExit();
    } // }}}

    /**
     * Thumbnail image for given file.
     *
     * Action params:
     * - file_id
     * - dims
     *
     * @version 2014-06-22
     */
    public function thumbAction() // {{{
    {
        $file_id = $this->getScalarParam('file_id', 0);
        $file = $this->_driveHelper->getRepository()->getFileOrThrow($file_id);

        if (!$this->_driveHelper->isFileReadable($file)) {
            throw new Maniple_Controller_NotAllowedException('You are not allowed to access this file');
        }

        if (!in_array($file->mimetype, array('image/jpeg', 'image/gif', 'image/png'))) {
            throw new Exception('Plik nie jest obrazem');
        }

        $options = array(
            'width'  => 0,
            'height' => 0,
            'scale'  => true,
            'crop'   => true,
        );

        if (null !== ($dims = $this->getScalarParam('dims'))) {
            $dims = explode('x', $dims);
            $width = (int) array_shift($dims);
            $height = (int) array_shift($dims);
            $options['width'] = min($width, 1024);
            $options['height'] = min($height, 1024);
        } elseif (null !== ($max = $this->getScalarParam('max'))) {
            $options['max'] = max(0, $max);
        }

        $image_path = $this->getResource('core.image_helper')->getImagePath(
            $file->getPath(),
            $options
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

    /**
     * Search for files
     */
    public function searchAction()
    {
        $user_id = $this->getSecurityContext()->getUser()->getId();
        $drive = $this->_driveHelper->getRepository()->getDriveByUserId($user_id);

        $q = $this->getScalarParam('q');
        // $hits = $this->getResource('drive.file_indexer')->searchInDrive($q, $drive->drive_id);
        $hits = $this->getResource('drive.file_indexer')->search($q);

        echo '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
        echo '<strong>', $hits->hitCount, '</strong> hits<br/>';
        foreach ($hits->hits as $hit) {
            $file = $this->_driveHelper->getRepository()->getFile($hit->document->file_id);
            if (empty($file)) {
                echo 'Invalid file ID: ', $hit->document->file_id;
            }
            if ($file && $this->_driveHelper->isFileReadable($file)) {
                echo '<div>', '<strong>', $file->name, '</strong> ', $this->view->fileSize($file->size), '</div>';
            }
        }
        exit;
    }
}
