<?php

/**
 * @version 2013-05-15 / 2013-01-24 / 2012-12-18
 */
class Drive_DirController extends Controller_Action
{
    public function indexAction() // {{{
    {
        // perms!!!

        $id = $this->getScalarParam('id', 0);

        $uri_template = $this->_helper->uriTemplate;

        $this->view->dir_id = $id;
        $this->view->uri_templates = array(
            'dir' => array(
                'view'   => $uri_template('contents', 'dir', array('id' => '{id}')),
                'create' => $uri_template('create',   'dir', array('parent' => '{parent}')),
                'remove' => $uri_template('remove',   'dir', array('id' => '{id}')),
                'rename' => $uri_template('rename',   'dir', array('id' => '{id}')),
                'share'  => $uri_template('share',    'dir', array('id' => '{id}')),
                'move'   => $uri_template('move',     'dir'),
                'chown'  => $uri_template('chown',    'dir'),
            ),
            'file' => array(
                'upload' => $uri_template('upload', 'file', array('dir' => '{id}')),
                'view'   => $uri_template('{id}',   'file'),
                'edit'   => $uri_template('edit',   'file', array('id' => '{id}')),
                'remove' => $uri_template('remove', 'file', array('id' => '{id}')),
                'rename' => $uri_template('rename', 'file', array('id' => '{id}')),
                'move'   => $uri_template('move',   'file'),
                'chown'  => $uri_template('chown',  'file'),
            ),
        );

        $this->view->breadcrumbs = array(
            array(
                'title' => 'Dyski',
                'url' => $this->_helper->url('index', 'drive'),
            ),
            array(
                'title' => '...',
            ),
        );
    } // }}}

    public function contentsAction() // {{{
    {
        // params:
        // id         - directory id
        // filter     - file type filter value, !value
        // files-only - do not include subdirectories

        $id = $this->getScalarParam('id', 0);
        $files_only = $this->getScalarParam('files-only');

        $filter = $this->getScalarParam('filter');
        $inverse_filter = false;

        if (0 === strncmp('!', $filter, 1)) {
            $inverse_filter = true;
            $filter = substr($filter, 1);
        }

        $options = array(
            'filesOnly'     => (bool) $files_only,
            'filter'        => $filter,
            'inverseFilter' => $inverse_filter,
        );

        $dir = $this->_helper->drive->browseDir($id, $options);

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData($dir);
        $ajaxResponse->sendAndExit();
    } // }}}

    /**
     * Przenoszenie katalogu do innego katalogu. Użytkownik wykonujący
     * akcje musi miec uprawnienia zapisu zarówno do nadrzędnego jak
     * i przenoszonego katalogu. Parametry wywołania akcji muszą być
     * przekazane metodą POST.
     */
    public function moveAction() // {{{
    {
        $drive_helper = $this->_helper->drive;

        $id = $this->_request->getPost('id');
        $dir = $this->_helper->drive->fetchDir($id);
        $this->assertAccess($drive_helper->isDirWritable($dir));

        $parent_id = $this->_request->getPost('parent');
        $parent_dir = $this->_helper->drive->fetchDir($parent_id);
        $this->assertAccess($drive_helper->isDirWritable($parent_dir));

        $user = $this->getBootstrapResource('user');
        $db = $this->getBootstrapResource('db');

        $db->beginTransaction();
        try {
            $dir->parent_id = $parent_dir->id;
            $dir->modified_by = $user->id;
            $dir->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->sendAndExit();
    } // }}}

    /**
     * Ustawienia udostępniania katalogu. Użytkownik musi mieć prawa do
     * współdzielenia katalogu, ergo być jego właścicielem lub administratorem.
     */
    public function shareAction() // {{{
    {
        $user = $this->getBootstrapResource('user');

        $drive_helper = $this->_helper->drive;
        $dir = $drive_helper->fetchDir($this->_getParam('id'));

        $this->assertAccess($drive_helper->isDirShareable($dir));

        // przeslano dane, zaktualizuj rekord katalogu
        if ($this->_request->isPost()) {
            $visibility = (string) $this->_request->getPost('visibility');
            if (!Drive_Model_DbTable_Dirs::isValidVisibility($visibility)) {
                throw new App_Exception_InvalidArgument('Niepoprawny typ widoczności katalogu');
            }

            $shares = (array) $this->_request->getPost('shares');

            $db = $dir->getAdapter();
            $db->beginTransaction();

            try {
                $dir->saveShares($shares);

                $dir->visibility = $visibility;
                $dir->modified_by = $user->id;
                $dir->save();

                $db->commit();

            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }

            $ajaxResponse = $this->_helper->ajaxResponse();
            $ajaxResponse->sendAndExit();

        } else {
            // katalog w korzeniu nie moze dziedziczyc widocznosci
            $select = $dir->selectShares(array('id', 'first_name', 'last_name', 'username'));
            $shares = $select->fetchAll();

            array_walk($shares, function(&$row) {
                $row['id']        = (int) $row['id'];
                $row['can_write'] = (int) $row['can_write'];
            });

            $ajaxResponse = $this->_helper->ajaxResponse();
            $ajaxResponse->setData(array(
                'visibility'  => $dir->visibility,
                'can_inherit' => (bool) $dir->parent_id,
                'shares'      => $shares,
            ));
            $ajaxResponse->sendAndExit();
        }
    } // }}}

    /**
     * Zmiana właściciela katalogu. Parametry wywołania akcji (id, owner)
     * muszą być przekazane metodą POST.
     */
    public function chownAction() // {{{
    {
        $drive_helper = $this->_helper->drive;
        $dir = $drive_helper->fetchDir((string) $this->_request->getPost('id'));

        $this->assertAccess($drive_helper->isDirChownable($dir));

        $db = $this->getBootstrapResource('db');
        $users = $db->getTable('Model_Core_Users');
        $owner = $users->findRow((string) $this->_request->getPost('owner'));

        if (!$owner) {
            throw new App_Exception_InvalidArgument('Niepoprawny identyfikator użytkownika');
        }

        $user = $this->getBootstrapResource('user');

        $db->beginTransaction();
        try {
            $dir->owner = $owner->id;
            $dir->modified_by = $user->id;
            $dir->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData(array(
            'id'    => $dir->id,
            'owner' => $drive_helper->projectUserData($owner),
            'mtime' => $drive_helper->getDate($dir->mtime),
            'modified_by' => $drive_helper->projectUserData($user),
        ));
        $ajaxResponse->sendAndExit();
    } // }}}
}
