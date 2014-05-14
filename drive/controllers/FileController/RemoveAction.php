<?php

class Drive_FileController_RemoveAction extends Zefram_Controller_Action_Standalone_Form
{
    protected $_file;

    protected function _init() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $helper = $this->_helper->drive;

        $id = $this->_getParam('id');
        $file = $helper->fetchFile($id);

        $this->assertAccess($helper->isFileRemovable($file));

        $form = new Form(array('elements' => array(
            new Form_Element_Token('token'),
        )));

        $this->_file = $file;
        $this->_form = $form;

        $this->view->name= $file->name;
    } // }}}

    protected function _processForm() // {{{
    {
        $file = $this->_file;
        $drive = $file->Dir->Drive;

        // pobierz teraz identyfikator pliku, poniewaz po usunieciu pliku
        // nie bedzie on dostepny
        $id = $file->id;
        $name = $file->name;

        $db = $file->getAdapter();
        $db->beginTransaction();

        try {
            $file->delete();
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
