<?php

class ManipleDrive_DriveController extends ManipleDrive_Controller_Action
{
    public function adminAction() // {{{
    {
        $this->assertAccess($this->getSecurityContext()->isSuperUser());

        $this->view->url_create = $this->_helper->url('create');
        $this->view->url_list = $this->_helper->url('list');
        $this->view->breadcrumbs = array(
            array('title' => $this->view->translate('Drives')),
        );
    } // }}}

    public function listAction() // {{{
    {
        $this->assertAccess($this->getSecurityContext()->isSuperUser());

        $db = $this->getResource('db');

        $dirs_table = $this->getTable('ManipleDrive_Model_DbTable_Dirs');
        $drives_table = $this->getTable('ManipleDrive_Model_DbTable_Drives');

        $drives = array();
        foreach ($this->getResource('drive.manager')->getDrives() as $drive) {
            $drives[$drive->drive_id] = new Zefram_Stdlib_ObjectWrapper($drive);
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

        foreach ($drives as $drive) {
            // uzupelnij rekord dysku adresami akcji
            $drive->setExtras(array(
                'url_edit' => $this->view->routeUrl('drive.drive', array('action' => 'edit', 'drive_id' => $drive->drive_id)),
                'url_browse' => $this->view->drive()->browseUrl($drive->root_dir),
            ));

            // dodaj rekordy uzytkownikow odpowiadajace wlascicielowi
            // i osobie, ktora utworzyla dysk
            foreach (array('owner', 'created_by') as $column) {
                $user_id = $drive[$column];
                $drive->setExtra($column, isset($users[$user_id]) ? $users[$user_id] : null);
            }
        }

        $this->view->drives = $drives;
        $this->_helper->layout->disableLayout();

        // przeslij naglowek z kodowaniem, zeby ominac ewentualne problemy
        $this->getResponse()->setHeader('Content-Type', 'text/html; charset=utf-8');
    } // }}}
}
