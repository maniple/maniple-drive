<?php

class Drive_FileController_EditAction extends Zefram_Controller_Action_Standalone_Form
{
    protected $_file;

    protected function _init() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $user = App::get('user');
        $this->assertAccess($user->isAuthenticated());

        $helper = $this->_helper->drive;
        $file = $helper->fetchFile($this->getParam('id'));
        $this->assertAccess(
            $helper->isFileWritable($file),
            'Nie masz uprawnień do edycji metadanych tego pliku'
        );

        $form = new Form(array('elements' => array(
            new Form_Element_Token('token'),
            'title' => array(
                'type' => 'text',
                'options' => array(
                    'label' => 'Tytuł',
                    'value' => $file->title,
                ),
            ),
            'author' => array(
                'type' => 'text',
                'options' => array(
                    'label' => 'Autor',
                    'value' => $file->author,
                ),
            ),
            'description' => array(
                'type' => 'textarea',
                'options' => array(
                    'label' => 'Opis',
                    'value' => $file->description,
                ),
            ),
        )));

        $this->_form = $form;
        $this->_file = $file;
    } // }}}

    public function _processForm($values) // {{{
    {
        $user = App::get('user');
        $file = $this->_file;

        $db = $file->getAdapter();
        $db->beginTransaction();

        try {
            $file->setFromArray($values);
            $file->modified_by = $user->id;
            $file->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        return $this->_helper->dialog->completionUrl(array(
            'id' => $file->id,
        ));
    } // }}}
}
