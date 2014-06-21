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

        $drives = Zefram_Db_Select::factory($db)
            ->from(array('drives' => $drives_table))
            ->joinLeft(array('dirs' => $dirs_table), 'dirs.dir_id = drives.root_dir', array('name'))
            ->order('name')
            ->query()
            ->fetchAll();

        $disk_usage = $this->getTable('ManipleDrive_Model_DbTable_Drives')->getDiskUsageReport(array_column($drives, 'drive_id'));

        $user_ids = array();
        foreach ($drives as &$drive) {
            $drive_id = $drive['drive_id'];
            $drive['disk_usage'] = $disk_usage[$drive_id]['disk_usage'];

            $user_ids[$drive['owner']] = true;
            $user_ids[$drive['created_by']] = true;
        }
        unset($drive);
        $user_ids = array_keys($user_ids);

        $users = $this->getDriveHelper()->getUserMapper()->getUsers($user_ids);

        foreach ($drives as &$drive) {
            // uzupelnij rekord dysku adresami akcji
            $drive['url_edit']   = $this->view->routeUrl('drive.drive', array('action' => 'edit', 'drive_id' => $drive['drive_id']));
            $drive['url_browse'] = $this->view->drive()->browseUrl($drive['root_dir']);

            // dodaj rekordy uzytkownikow odpowiadajace wlascicielowi
            // i osobie, ktora utworzyla dysk
            foreach (array('owner', 'created_by') as $column) {
                $user_id = $drive[$column];
                $drive[$column] = isset($users[$user_id]) ? $users[$user_id] : null;
            }
        }
        unset($drive);

        $this->view->drives = $drives;
        $this->_helper->layout->disableLayout();

        // przeslij naglowek z kodowaniem, zeby ominac ewentualne problemy
        $this->getResponse()->setHeader('Content-Type', 'text/html; charset=utf-8');
    } // }}}
}
