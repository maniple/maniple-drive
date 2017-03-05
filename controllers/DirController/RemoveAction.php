<?php

class ManipleDrive_DirController_RemoveAction extends Maniple_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    protected $_dir;

    protected function _prepare() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $helper = $this->getDriveHelper();

        $dir_id = $this->getScalarParam('dir_id');
        $dir = $helper->fetchDir($dir_id);

        $this->assertAccess($helper->isDirRemovable($dir));

        $form = new Zefram_Form;

        $this->_dir = $dir;
        $this->_form = $form;

        $this->view->assign($dir->getContentSummary());
        $this->view->name = $dir->name;
    } // }}}

    protected function _process() // {{{
    {
        $dir = $this->_dir;
        $drive = $dir->getDrive();

        // pobierz teraz identyfikator katalogu, poniewaz po usunieciu
        // katalogu nie bedzie on dostepny
        $dir_id = $dir->dir_id;
        $name = $dir->name;

        $db = $dir->getAdapter();
        $db->beginTransaction();

        try {
            $dir->delete();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $response = $this->_helper->ajaxResponse();
        $response->setData(array(
            'dir_id' => $dir_id,
            'name' => $name,
            'disk_usage' => $drive->getDiskUsage(),
            'quota' => (float) $drive->quota,
        ));
        $response->sendAndExit();
    } // }}}
}
