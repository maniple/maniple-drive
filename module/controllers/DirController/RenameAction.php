<?php

/**
 * Zmiana nazwy katalogu. Aby uzytkownik mogl zmienic nazwe katalogu musi
 * miec uprawnienia zapisu do katalogu (byc jego wlascicielem lub miec ten
 * katalog udostepniony do zapisu) albo byc administratorem.
 *
 * @version 2014-06-02 / 2012-12-09
 */
class Drive_DirController_RenameAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    /**
     * @var Drive_Model_Dir
     */
    protected $_dir;

    /**
     * @var Drive_DirBrowsingContext
     */
    protected $_dirContext;

    protected function _prepare() // {{{
    {
        $this->_helper->viewRenderer->setRender('create');

        $security = $this->getSecurityContext();
        $this->assertAccess($security->isAuthenticated());

        $dir_context = Drive_DirBrowsingContext::createFromString($this->getScalarParam('dir_id'));
        $dir = $this->getDriveHelper()->getDir($dir_context->getDirId());

        // za pomoca tej akcji nie mozna zmienic nazwy katalogu,
        // ktory jest w korzeniu dysku (innymi slowy nie mozna
        // zmienic nazwy dysku)
        if (empty($dir->parent_id)) {
            throw new Exception('Nazwa tego katalogu nie może zostać zmieniona');
        }

        $this->assertAccess(
            $this->getDriveHelper()->isDirWritable($dir),
            'Nie masz uprawnien do zmiany nazwy tego katalogu'
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
                        new Drive_Validate_FileName,
                        new Drive_Validate_DirNotExists(array(
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
        $this->_dirContext = $dir_context;
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
        $result['dir_id'] = (string) $this->_dirContext;

        $response = $this->_helper->ajaxResponse();
        $response->setData(array(
            'dir' => $result,
        ));
        $response->sendAndExit();
    } // }}}
}
