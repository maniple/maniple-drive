<?php

/**
 * @version 2013-05-15 / 2013-01-24 / 2012-12-18
 */
class ManipleDrive_DirController extends ManipleDrive_Controller_Action
{
    /**
     * Ustawienia udostępniania katalogu. Użytkownik musi mieć prawa do
     * współdzielenia katalogu, ergo być jego właścicielem lub administratorem.
     */
    public function shareAction() // {{{
    {
        $drive_helper = $this->getDriveHelper();

        $dir_context = ManipleDrive_DirBrowsingContext::createFromString($this->getScalarParam('dir_id'));
        $dir = $drive_helper->getDir($dir_context->getDirId());

        $this->assertAccess($drive_helper->isDirShareable($dir));

        // przeslano dane, zaktualizuj rekord katalogu
        if ($this->_request->isPost()) {
            $visibility = (string) $this->_request->getPost('visibility');
            if (!ManipleDrive_Model_DbTable_Dirs::isValidVisibility($visibility)) {
                throw new Exception('Niepoprawny typ widoczności katalogu');
            }

            $shares = (array) $this->_request->getPost('shares');

            $db = $this->getResource('db');
            $db->beginTransaction();

            try {
                $num = $dir->saveShares($shares);

                $dir->visibility = $visibility;
                $dir->modified_by = $this->getSecurity()->getUser()->getId();
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
        } else {
            $rows = $this->getDriveHelper()->getTableProvider()->getTable('ManipleDrive_Model_DbTable_Dirs')->fetchDirShares($dir->dir_id);
            $shares = array();

            $user_ids = array();

            foreach ($rows as $row) {
                $shares[] = array(
                    'user_id' => $row->user_id,
                    'can_write' => $row->can_write ? 1 : 0,
                );
                $user_ids[$row->user_id] = true;
            }
            // wczytaj wszystkie potrzebne rekordy uzytkownikow
            if ($user_ids) {
                $users = $this->getDriveHelper()->getUserMapper()->getUsers(array_keys($user_ids));
                foreach ($shares as &$share) {
                    $user_id = $share['user_id'];
                    if (isset($users[$user_id])) {
                        $share = array_merge($share, $users[$user_id]->toArray(Maniple_Model::UNDERSCORE));
                    }
                }
                unset($share);
            }
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData(array(
            'dir_id'     => (string) $dir_context,
            'visibility' => $dir->visibility,
            'can_inherit_visibility' => (bool) $dir->parent_id,
            'shares'     => $shares,
        ));
        $ajaxResponse->sendAndExit();
    } // }}}

    /**
     * Zmiana właściciela katalogu. Parametry wywołania akcji (id, owner)
     * muszą być przekazane metodą POST.
     */
    public function chownAction() // {{{
    {
        $drive_helper = $this->getDriveHelper();

        $dir_id = $this->_request->getPost('dir_id');
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
            $dir->modified_by = $this->getSecurity()->getUser()->getId();
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
