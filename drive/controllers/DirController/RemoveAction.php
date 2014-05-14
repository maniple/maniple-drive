<?php

class Drive_DirController_RemoveAction extends Zefram_Controller_Action_Standalone_Form
{
    protected $_dir;

    protected function _init() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $helper = $this->_helper->drive;

        $id = $this->_getParam('id');
        $dir = $helper->fetchDir($id);

        $this->assertAccess($helper->isDirRemovable($dir));

        $form = new Form(array('elements' => array(
            new Form_Element_Token('token'),
        )));

        $this->_dir = $dir;
        $this->_form = $form;

        $this->view->assign($dir->getContentSummary());
        $this->view->name = $dir->name;
    } // }}}

    protected function _processForm() // {{{
    {
        $dir = $this->_dir;
        $drive = $dir->Drive;

        // pobierz teraz identyfikator katalogu, poniewaz po usunieciu
        // katalogu nie bedzie on dostepny
        $id = $dir->id;
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

        return $this->_helper->dialog->completionUrl(array(
            'id' => $id,
            'name' => $name,
            'disk_usage' => (float) $drive->disk_usage,
            'quota' => (float) $drive->quota,
        ));
    } // }}}
}
