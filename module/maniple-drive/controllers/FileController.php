<?php

class ManipleDrive_FileController extends ManipleDrive_Controller_Action
{
    public function readAction() // {{{
    {
        $file_id = (string) $this->getScalarParam('file_id');
        $file = $this->getDriveHelper()->getRepository()->getFileOrThrow($file_id);

        $this->getResource('core.file_helper')->sendFile(
            $this->_request,
            $this->_response,
            $file->getPath(),
            array(
                'type' => $file->mimetype,
                'name' => $file->name,
                'etag' => $file->md5sum,
                'cache' => true,
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
        $drive_helper = $this->getDriveHelper();

        $file_id = $this->getScalarParam('file_id');
        $file = $drive_helper->fetchFile($file_id);
        $this->assertAccess($drive_helper->isDirWritable($file->Dir));

        $dir_id = $this->_request->getPost('dir_id');
        $dir = $drive_helper->fetchDir($dir_id);
        $this->assertAccess($drive_helper->isDirWritable($dir));

        $db = $file->getAdapter();
        $db->beginTransaction();

        try {
            $file->dir_id = $dir->dir_id;
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
        $drive_helper = $this->_helper->drive;

        $file_id = (string) $this->_request->getPost('file_id');
        $file = $drive_helper->fetchFile($file_id);

        $this->assertAccess($drive_helper->isFileChownable($file));

        $db = $file->getAdapter();
        $users = Zefram_Db::getTable('Model_Core_Users', $db);
        $owner = $users->findRow((string) $this->_request->getPost('owner'));

        if (!$owner) {
            throw new App_Exception_InvalidArgument('Niepoprawny identyfikator użytkownika');
        }

        $user = App::get('user')->getRow();

        $db->beginTransaction();

        try {
            $file->owner = $owner->id;
            $file->modified_by = $user->id;
            $file->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData(array(
            'file_id' => $file->id,
            'owner' => $drive_helper->projectUserData($owner),
            'mtime' => $drive_helper->getDate($file->mtime),
            'modified_by' => $drive_helper->projectUserData($user),
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
        $file = $this->getDriveHelper()->getRepository()->getFileOrThrow($file_id);

        if (!$this->getDriveHelper()->isFileReadable($file)) {
            throw new Maniple_Controller_NotAllowedException('You are not allowed to access this file');
        }

        if (!in_array($file->mimetype, array('image/jpeg', 'image/gif', 'image/png'))) {
            throw new Exception('Plik nie jest obrazem');
        }

        if (null !== ($dims = $this->getScalarParam('dims'))) {
            $dims = explode('x', $dims);
            $width = (int) array_shift($dims);
            $height = (int) array_shift($dims);
        }

        $image_path = $this->getResource('core.image_helper')->getImagePath(
            $file->getPath(),
            array(
                'width' => min($width, 1024),
                'height' => min($height, 1024),
                'scale' => true,
                'crop' => true,
            )
        );

        $this->getResource('core.file_helper')->sendFile(
            $this->_request,
            $this->_response,
            $image_path,
            array(
                'type' => $file->mimetype,
                'etag' => $file->md5sum,
                'cache' => true,
            )
        );
    } // }}}
}