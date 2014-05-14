<?php

class Drive_FileController extends Controller_Action
{
    /**
     * Parametry wywołania:
     * id - identyfikator przenoszonego pliku
     * dir - identyfikator docelowego katalogu
     */
    public function moveAction() // {{{
    {
        $drive_helper = $this->_helper->drive;

        $id = $this->_request->getPost('id');
        $file = $this->_helper->drive->fetchFile($id);
        $this->assertAccess($drive_helper->isDirWritable($file->Dir));

        $dir_id = $this->_request->getPost('dir');
        $dir = $this->_helper->drive->fetchDir($dir_id);
        $this->assertAccess($drive_helper->isDirWritable($dir));

        $db = $file->getAdapter();
        $db->beginTransaction();

        try {
            $file->dir_id = $dir->id;
            $file->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->sendAndExit();
    } // }}}

    public function indexAction() // {{{
    {
        try {
            $id = $this->_getParam('id');
            $file = $this->_helper->drive->fetchFile((string) $id);

            $this->_helper->serveFile($file->getPath(), array(
                'type' => $file->mimetype,
                'name' => $file->name,
                'cache' => true,
            ));

        } catch (App_Exception_NotFound $e) {
            header('HTTP/1.0 404 Not Found');
            header('Status: 404 Not Found');
            echo 'File not found';
            exit;

        } catch (App_Exception_Forbidden $e) {
            header('HTTP/1.0 403 Forbidden');
            header('Status: 403 Forbidden');
            echo 'You don\'t have permission to access this file';
            exit;
        }
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
        $file = $drive_helper->fetchFile((string) $this->_request->getPost('id'));

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
            'id'    => $file->id,
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
