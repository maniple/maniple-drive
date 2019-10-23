<?php

/**
 * Zmiana nazwy pliku.
 *
 * @method void assertAccess(bool $expr)
 *
 * @version 2012-12-13
 */
class ManipleDrive_FileController_RenameAction extends Maniple_Controller_Action_StandaloneForm
{
    protected $_actionControllerClass = ManipleDrive_FileController::className;

    protected $_ajaxFormHtml = false;

    /**
     * @var ManipleDrive_Model_File
     */
    protected $_file;

    /**
     * @Inject
     * @var ManipleDrive_Helper
     */
    protected $_driveHelper;

    /**
     * @Inject
     * @var Zefram_Db
     */
    protected $_db;

    protected function _prepare() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $security = $this->getSecurityContext();
        $this->assertAccess($security->isAuthenticated());

        $file_id = $this->getScalarParam('file_id');
        $file = $this->_driveHelper->fetchFile($file_id);

        $this->assertAccess(
            $this->_driveHelper->isFileWritable($file),
            'Nie masz uprawnien do zmiany nazwy tego pliku'
        );

        $form = new Zefram_Form(array('elements' => array(
            // new Form_Element_Token('token'),
            'name' => array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'Nowa nazwa pliku',
                    'required'   => true,
                    'filters'    => array('StringTrim'),
                    'validators' => array(
                        new ManipleDrive_Validate_FileName,
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

    protected function _process() // {{{
    {
        $security = $this->getSecurityContext();
        $file = $this->_file;

        $this->_db->beginTransaction();

        try {
            $file->name = $this->_form->getValue('name');
            $file->modified_by = $security->getUser()->getId();
            $file->save();
            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        $result = $this->_driveHelper->getViewableData($file, true);

        $response = $this->_helper->ajaxResponse();
        $response->setData($result);
        $response->sendAndExit();
    } // }}}
}
