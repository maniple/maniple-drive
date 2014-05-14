<?php

/**
 * Zmiana nazwy katalogu. Aby uzytkownik mogl zmienic nazwe katalogu musi
 * miec uprawnienia zapisu do katalogu (byc jego wlascicielem lub miec ten
 * katalog udostepniony do zapisu) albo byc administratorem.
 *
 * @version 2012-12-09
 */
class Drive_DirController_RenameAction extends Zefram_Controller_Action_Standalone_Form
{
    protected function _init() // {{{
    {
        $this->_helper->layout->setLayout('dialog');
        $this->_helper->viewRenderer->setRender('create');

        $current_user = App::get('user');
        $this->assertAccess($current_user->isAuthenticated());

        $id  = $this->_getParam('id');
        $dir = $this->_helper->drive->fetchDir($id);

        // za pomoca tej akcji nie mozna zmienic nazwy katalogu,
        // ktory jest w korzeniu dysku (innymi slowy nie mozna
        // zmienic nazwy dysku)
        if (empty($dir->parent_id)) {
            throw new App_Exception_ApplicationLogic('Nazwa tego katalogu nie może zostać zmieniona');
        }

        $this->assertAccess(
            $this->_helper->drive->isDirWritable($dir),
            'Nie masz uprawnien do zmiany nazwy tego katalogu'
        );
    
        $form = new Form(array('elements' => array(
            new Form_Element_Token('token'),
            'name' => array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'Nowa nazwa katalogu',
                    'required'   => true,
                    'filters'    => array('StringTrim'),
                    'validators' => array(
                        new Drive_Validate_FileName,
                        new Drive_Validate_DirNotExists(array(
                            'adapter'  => $dir->getAdapter(),
                            'allowed'  => $dir->name,
                            'parentId' => $dir->parent_id
                        )),
                    ),
                    'value'      => $dir->name,
                    'attribs'    => array(
                        'autocomplete' => 'off',
                    ),
                ),
            ),
        )));

        $this->_form = $form;
        $this->_dir  = $dir;
    } // }}}

    protected function _processForm() // {{{
    {
        $user = App::get('user');
        $dir = $this->_dir;

        $db = $dir->getAdapter();
        $db->beginTransaction();

        try {
            $dir->name = $this->_form->getValue('name');
            $dir->modified_by = $user->id;
            $dir->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $result = $this->_helper->drive->getViewableData($dir, true);

        return $this->_helper->dialog->completionUrl(array(
            'dir' => $result,
        ));
    } // }}}
}
