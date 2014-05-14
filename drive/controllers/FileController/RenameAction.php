<?php

/**
 * Zmiana nazwy pliku.
 *
 * @version 2012-12-13
 */
class Drive_FileController_RenameAction extends Zefram_Controller_Action_Standalone_Form
{
    protected function _init() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $user = App::get('user');
        $this->assertAccess($user->isAuthenticated());

        $helper = $this->_helper->drive;
        $file = $helper->fetchFile($this->getParam('id'));
        $this->assertAccess(
            $helper->isFileWritable($file),
            'Nie masz uprawnien do zmiany nazwy tego pliku'
        );

        $form = new Form(array('elements' => array(
            new Form_Element_Token('token'),
            'name' => array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'Nowa nazwa pliku',
                    'required'   => true,
                    'filters'    => array('StringTrim'),
                    'validators' => array(
                        new Drive_Validate_FileName,
                        // nazwa pliku nie musi byc unikalna w obrebie katalogu
                    ),
                    'value'      => $file->name,
                    'attribs'    => array(
                        'autocomplete' => 'off',
                    ),
                ),
            ),
        )));

        $this->_form = $form;
        $this->_file = $file;
    } // }}}

    protected function _processForm($values) // {{{
    {
        $user = App::get('user');
        $file = $this->_file;

        $db = $file->getAdapter();
        $db->beginTransaction();

        try {
            $file->name = $values['name'];
            $file->modified_by = $user->id;
            $file->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $result = $this->_helper->drive->getViewableData($file, true);

        return $this->_helper->dialog->completionUrl(array(
            'file' => $result,
        ));
    } // }}}
}
