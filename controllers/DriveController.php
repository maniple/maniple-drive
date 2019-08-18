<?php

class ManipleDrive_DriveController extends ManipleDrive_Controller_Action
{
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

    public function adminAction() // {{{
    {
        $this->assertAccess($this->getSecurityContext()->isSuperUser());

        $this->view->url_create = $this->_helper->url('create');
        $this->view->url_list = $this->_helper->url('list');
        $this->view->breadcrumbs = array(
            array('title' => $this->view->translate('Drives')),
        );

        $this->view->drive();
    } // }}}

    public function listAction() // {{{
    {
        $this->assertAccess($this->getSecurityContext()->isSuperUser());

        $dirsTable = $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className);

        // $drives_table = $this->getTable('ManipleDrive_Model_DbTable_Drives');


        $drives = array();
        foreach ($dirsTable->fetchAll('parent_id IS NULL', 'name_normalized') as $drive) {
            $drives[$drive->getId()] = $drive;
        }

        $user_ids = array();
        foreach ($drives as $drive) {
            if ($drive->owner) {
                $user_ids[$drive->owner] = true;
            }
            if ($drive->created_by) {
                $user_ids[$drive->created_by] = true;
            }
        }

        $users = $this->getDriveHelper()->getUserMapper()->getUsers(array_keys($user_ids));

        $drivesArray = array();
        foreach ($drives as $drive) {
            // uzupelnij rekord dysku adresami akcji
            $driveArray = array_merge(
                $drive->toArray(),
                array(
                    'url_edit' => $this->view->url('drive.drive', array('action' => 'edit', 'drive_id' => $drive->getId())),
                    'url_browse' => $this->view->drive()->browseUrl($drive->getId()),
                )
            );

            // dodaj rekordy uzytkownikow odpowiadajace wlascicielowi
            // i osobie, ktora utworzyla dysk
            foreach (array('owner', 'created_by') as $column) {
                $user_id = $drive[$column];
                $driveArray[$column] = isset($users[$user_id]) ? $users[$user_id] : null;
            }

            $drivesArray[$drive->getId()] = $driveArray;
        }

        $this->view->drives = $drivesArray;
        $this->_helper->layout->disableLayout();

        // przeslij naglowek z kodowaniem, zeby ominac ewentualne problemy
        $this->getResponse()->setHeader('Content-Type', 'text/html; charset=utf-8');
    } // }}}
}
