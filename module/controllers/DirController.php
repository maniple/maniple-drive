<?php

/**
 * @version 2013-05-15 / 2013-01-24 / 2012-12-18
 */
class Drive_DirController extends Drive_Controller_Action
{
    public function indexAction() // {{{
    {
        // TODO access perms

        $this->view->dir_id = (int) $this->getScalarParam('dir_id', 0);
        $this->view->uri_templates = array(
            'dir' => array(
                'read'   => $this->_helper->urlTemplate('drive.dir', array('action' => 'read')),
                'create' => $this->_helper->urlTemplate('drive.dir', array('action' => 'create')),
                'remove' => $this->_helper->urlTemplate('drive.dir', array('action' => 'remove')),
                'rename' => $this->_helper->urlTemplate('drive.dir', array('action' => 'rename')),
                'share'  => $this->_helper->urlTemplate('drive.dir', array('action' => 'share')),
                'move'   => $this->_helper->urlTemplate('drive.dir', array('action' => 'move')),
                'chown'  => $this->_helper->urlTemplate('drive.dir', array('action' => 'chown')),
                'upload' => $this->_helper->urlTemplate('drive.dir', array('action' => 'upload')),
            ),
            'file' => array(
                'read'   => $this->_helper->urlTemplate('drive.file', array('action' => 'read')),
                'edit'   => $this->_helper->urlTemplate('drive.file', array('action' => 'edit')),
                'remove' => $this->_helper->urlTemplate('drive.file', array('action' => 'remove')),
                'rename' => $this->_helper->urlTemplate('drive.file', array('action' => 'rename')),
                'move'   => $this->_helper->urlTemplate('drive.file', array('action' => 'move')),
                'chown'  => $this->_helper->urlTemplate('drive.file', array('action' => 'chown')),
            ),
        );

        $this->view->locale = preg_replace('/\\..+$/', '', $this->getResource('locale'));

        $this->view->user_search_url = $this->view->routeUrl(
            (string) $this->getDriveHelper()->getUserSearchRoute()
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

    /**
     * Read directory contents.
     */
    public function readAction() // {{{
    {
        // params:
        // dir_id     - directory id
        // filter     - file type filter value, !value
        // files-only - do not include subdirectories

        $dir_id = (int) $this->getScalarParam('dir_id');
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

        $dir = $this->getDriveHelper()->browseDir($dir_id, $options);

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
        $drive_helper = $this->getDriveHelper();

        $dir_id = $this->getScalarParam('dir_id');
        $dir = $drive_helper->fetchDir($dir_id);
        $this->assertAccess($drive_helper->isDirWritable($dir));

        $parent_id = $this->_request->getPost('parent_id');
        $parent_dir = $drive_helper->fetchDir($parent_id);
        $this->assertAccess($drive_helper->isDirWritable($parent_dir));

        $db = $this->getResource('db');
        $db->beginTransaction();
        try {
            $dir->parent_id = $parent_dir->dir_id;
            $dir->modified_by = $this->getSecurity()->getUserId();
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
        $drive_helper = $this->getDriveHelper();

        $dir_id = (int) $this->getScalarParam('dir_id');
        $dir = $drive_helper->fetchDir($dir_id);

        $this->assertAccess($drive_helper->isDirShareable($dir));

        // przeslano dane, zaktualizuj rekord katalogu
        if ($this->_request->isPost()) {
            $visibility = (string) $this->_request->getPost('visibility');
            if (!Drive_Model_DbTable_Dirs::isValidVisibility($visibility)) {
                throw new Exception('Niepoprawny typ widoczności katalogu');
            }

            $shares = (array) $this->_request->getPost('shares');

            $db = $this->getResource('db');
            $db->beginTransaction();

            try {
                $num = $dir->saveShares($shares);

                $dir->visibility = $visibility;
                $dir->modified_by = $this->getSecurity()->getUserId();
                $dir->save();

                $db->commit();

            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }

            $shares = $dir->fetchShares();
            if ($shares) {
                foreach ($drive_helper->getUserMapper()->getUsers(array_keys($shares)) as $user) {
                    $shares[$user->getId()] = array_merge(
                        $user->toArray(Maniple_Model::UNDERSCORE),
                        array('can_write' => $shares[$user->getId()])
                    );
                }
            } else {
                $shares = array();
            }

            $ajaxResponse = $this->_helper->ajaxResponse();
            $ajaxResponse->setData(array(
                'dir_id' => $dir->dir_id,
                'visibility' => $dir->visibility,
                'can_inherit_visibility' => (bool) $dir->parent_id,
                'shares' => $shares,
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
        $drive_helper = $this->getDriveHelper();

        $dir_id = (int) $this->_request->getPost('dir_id');
        $dir = $drive_helper->fetchDir($dir_id);

        $this->assertAccess($drive_helper->isDirChownable($dir));

        $owner = (int) $this->_request->getPost('owner');
        $user = $drive_helper->getUserMapper()->getUser($owner);
        if (!$owner) {
            throw new Exception('Niepoprawny identyfikator użytkownika');
        }

        $db = $this->getResource('db');
        $db->beginTransaction();
        try {
            $dir->owner = $user->id;
            $dir->modified_by = $this->getSecurity()->getUserId();
            $dir->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData(array(
            'dir_id' => $dir->dir_id,
            'owner' => $drive_helper->projectUserData($owner),
            'mtime' => $drive_helper->getDate($dir->mtime),
            'modified_by' => $drive_helper->projectUserData($this->getSecurity()->getUser()),
        ));
        $ajaxResponse->sendAndExit();
    } // }}}
}
