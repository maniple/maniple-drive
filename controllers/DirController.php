<?php

/**
 * @version 2013-05-15 / 2013-01-24 / 2012-12-18
 */
class ManipleDrive_DirController extends ManipleDrive_Controller_Action
{
    /**
     * @Inject
     * @var ManipleDrive_Helper
     */
    protected $_driveHelper;

    /**
     * @Inject
     * @var Zefram_Db
     */
    protected $_db;

    /**
     * Ustawienia udostępniania katalogu. Użytkownik musi mieć prawa do
     * współdzielenia katalogu, ergo być jego właścicielem lub administratorem.
     */
    public function shareAction() // {{{
    {
        $dir_id = $this->getScalarParam('dir_id');
        $dir = $this->_driveHelper->getRepository()->getDirOrThrow($dir_id);

        $this->assertAccess($this->_driveHelper->isDirShareable($dir));

        // przeslano dane, zaktualizuj rekord katalogu
        if ($this->_request->isPost()) {
            $visibility = (string) $this->_request->getPost('visibility');
            if (!ManipleDrive_Model_DbTable_Dirs::isValidVisibility($visibility)) {
                throw new Exception('Niepoprawny typ widoczności katalogu');
            }

            $shares = (array) $this->_request->getPost('shares');

            $this->_db->beginTransaction();

            try {
                $num = $dir->saveShares($shares);

                $dir->visibility = $visibility;
                $dir->modified_by = $this->getSecurity()->getUser()->getId();
                $dir->save();

                $this->_db->commit();

            } catch (Exception $e) {
                $this->_db->rollBack();
                throw $e;
            }

            $shares = $dir->fetchShares();
            if ($shares) {
                $userShares = array();
                foreach ($this->_driveHelper->getUserMapper()->getUsers(array_keys($shares)) as $user) {
                    $userShares[$user->getId()] = array_merge(
                        $user->toArray(Maniple_Model::UNDERSCORE),
                        array('can_write' => $shares[$user->getId()])
                    );
                    unset($shares[$user->getId()]);
                }
                $shares = $userShares; // sorted by user
            } else {
                $shares = array();
            }
        } else {
            $rows = $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className)->fetchDirShares($dir->dir_id);
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
                $users = array();
                foreach ($this->_driveHelper->getUserMapper()->getUsers(array_keys($user_ids)) as $user) {
                    $users[$user->getId()] = $user->toArray(Maniple_Model::UNDERSCORE);
                }
                foreach ($shares as $share) {
                    $user_id = $share['user_id'];
                    if (isset($users[$user_id])) {
                        $users[$user_id] = array_merge(
                            $users[$user_id],
                            $share
                        );
                    }
                }
                $shares = $users;
            }
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData(array(
            'dir_id'     => $dir->dir_id,
            'visibility' => $dir->visibility,
            'can_inherit_visibility' => (bool) $dir->parent_id,
            'shares'     => array_values($shares), // force JSON array to maintain ordering
        ));
        $ajaxResponse->sendAndExit();
    } // }}}

    /**
     * Zmiana właściciela katalogu. Parametry wywołania akcji (id, owner)
     * muszą być przekazane metodą POST.
     */
    public function chownAction() // {{{
    {
        $dir_id = $this->_request->getPost('dir_id');
        $dir = $this->_driveHelper->getRepository()->getDirOrThrow($dir_id);

        $this->assertAccess($this->_driveHelper->isDirChownable($dir));

        $owner = (int) $this->_request->getPost('owner');
        $user = $this->_driveHelper->getUserMapper()->getUser($owner);
        if (!$owner) {
            throw new Exception('Niepoprawny identyfikator użytkownika');
        }

        $this->_db->beginTransaction();
        try {
            $dir->owner = $user->id;
            $dir->modified_by = $this->getSecurity()->getUser()->getId();
            $dir->save();
            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->setData(array(
            'dir_id' => $dir->dir_id,
            'owner' => $this->_driveHelper->projectUserData($owner),
            'mtime' => $this->_driveHelper->getDate($dir->mtime),
            'modified_by' => $this->_driveHelper->projectUserData($this->getSecurity()->getUser()),
        ));
        $ajaxResponse->sendAndExit();
    } // }}}
}
