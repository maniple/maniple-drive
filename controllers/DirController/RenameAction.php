<?php

/**
 * Zmiana nazwy katalogu. Aby uzytkownik mogl zmienic nazwe katalogu musi
 * miec uprawnienia zapisu do katalogu (byc jego wlascicielem lub miec ten
 * katalog udostepniony do zapisu) albo byc administratorem.
 *
 * @version 2014-06-02 / 2012-12-09
 */
class ManipleDrive_DirController_RenameAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    /**
     * @var ManipleDrive_Model_Dir
     */
    protected $_dir;

    protected function _prepare() // {{{
    {
        $this->_helper->viewRenderer->setRender('create');

        $security = $this->getSecurityContext();
        $this->assertAccess($security->isAuthenticated());

        $dir_id = $this->getScalarParam('dir_id');
        $dir = $this->getDriveHelper()->getRepository()->getDirOrThrow($dir_id);

        // za pomoca tej akcji nie mozna zmienic nazwy katalogu,
        // ktory jest w korzeniu dysku (innymi slowy nie mozna
        // zmienic nazwy dysku)
        if (empty($dir->parent_id)) {
            throw new Exception('Name of this directory cannot be changed');
        }

        $this->assertAccess(
            $this->getDriveHelper()->isDirWritable($dir),
            $this->view->translate('You are not allowed to rename this directory')
        );
    
        $form = new Zefram_Form(array('elements' => array(
            // new Form_Element_Token('token'),
            'name' => array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'New directory name',
                    'required'   => true,
                    'filters'    => array('StringTrim'),
                    'validators' => array(
                        new ManipleDrive_Validate_FileName,
                        new ManipleDrive_Validate_DirNotExists(array(
                            'tableProvider' => $this->getDriveHelper()->getTableProvider(),
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
        $this->_dir = $dir;
    } // }}}

    protected function _process() // {{{
    {
        $user = $this->getSecurityContext()->getUser();
        $dir = $this->_dir;

        $db = $dir->getAdapter();
        $db->beginTransaction();

        try {
            $dir->name = $this->_form->getValue('name');
            $dir->modified_by = $user->getId();
            $dir->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $result = $this->getDriveHelper()->getViewableData($dir, true);

        $response = $this->_helper->ajaxResponse();
        $response->setData(array(
            'dir' => $result,
        ));
        $response->sendAndExit();
    } // }}}
}
