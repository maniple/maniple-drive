<?php

class Drive_DriveController extends Controller_Action
{
    public function indexAction() // {{{
    {
        $this->view->url_create = $this->_helper->url('create');
        $this->view->url_list = $this->_helper->url('list');
        $this->view->breadcrumbs = array(
            array('title' => 'Dyski'),
        );
    } // }}}

    public function listAction() // {{{
    {
        $db = $this->getResource('db');

        $dirs_table = $db->getTable('Drive_Model_DbTable_Dirs', $db);

        $drives = $db->getTable('Drive_Model_DbTable_Drives')
            ->select(array('d' => '*'))
            ->setIntegrityCheck(false)
            ->joinLeft(array('dirs' => $dirs_table->getName()), 'd.root_dir = dirs.id', array('name'))
            ->order('name')
            ->fetchAll();

        $user_ids = new DbUtils_ValueSet($db);
        $user_ids->collect($drives, array('owner', 'created_by'));

        $users = $db->getTable('Model_Core_Users')
            ->select(array('id', 'first_name', 'last_name'))
            ->where($user_ids->in('id'))
            ->indexBy('id')
            ->fetchAll();

        foreach ($drives as &$drive) {
            // uzupelnij rekord dysku adresami akcji
            $drive['url_edit']   = $this->view->url(array('id' => $drive['id']), 'drive_edit');
            $drive['url_browse'] = $this->view->url(array('id' => $drive['root_dir']), 'drive_dir');

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
