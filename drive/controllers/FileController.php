<?php

class Drive_FileController extends Drive_Controller_Action
{
    public function readAction() // {{{
    {
        try {
            $file_id = (string) $this->getScalarParam('file_id');
            $file = $this->getDriveHelper()->fetchFile($file_id);

            $this->_helper->serveFile($file->getPath(), array(
                'type' => $file->mimetype,
                'name' => $file->name,
                'cache' => true,
            ));

        } catch (Exception $e) {
            switch ($e->getCode()) {
                case 404:
                    header('HTTP/1.0 404 Not Found');
                    header('Status: 404 Not Found');
                    echo 'File not found';
                    exit;

                case 403:
                    header('HTTP/1.0 403 Forbidden');
                    header('Status: 403 Forbidden');
                    echo 'You don\'t have permission to access this file';

                default:
                    echo $e->getMessage();
                    exit;
            }
        }
    } // }}}

    /**
     * Parametry wywołania:
     * id - identyfikator przenoszonego pliku
     * dir - identyfikator docelowego katalogu
     */
    public function moveAction() // {{{
    {
        $drive_helper = $this->_helper->drive;

        $file_id = $this->_request->getPost('file_id');
        $file = $this->_helper->drive->fetchFile($file_id);
        $this->assertAccess($drive_helper->isDirWritable($file->Dir));

        $dir_id = $this->_request->getPost('dir_id');
        $dir = $this->_helper->drive->fetchDir($dir_id);
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

    public function imageAction()
    {
        $this->disableView();
        $this->disableLayout();

        $file_id = $this->getScalarParam('file_id', 0);
        $file = $this->_helper->drive->fetchFile($file_id);

        if (!in_array($file->mimetype, array('image/jpeg', 'image/gif', 'image/png'))) {
            throw new App_Exception('Plik nie jest obrazem');
        }

        $width = (int) $this->getScalarParam('w');
        $height = (int) $this->getScalarParam('h');

        if (null !== ($dims = $this->getScalarParam('d'))) {
            $dims = explode('x', $dims);
            $width = (int) array_shift($dims);
            $height = (int) array_shift($dims);
        }

        $path = $this->_helper->image($file->getPath(), array(
            'width' => min($width, 1024),
            'height' => min($height, 1024),
            'scale' => true,
            'crop' => true,
        ));
// sleep(2);
        $this->_helper->serveFile($path, array(
            'cache' => true,
        ));
    }
}
