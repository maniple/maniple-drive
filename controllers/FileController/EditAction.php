<?php

/**
 * @method void assertAccess(bool $expr)
 */
class ManipleDrive_FileController_EditAction extends Maniple_Controller_Action_StandaloneForm
{
    protected $_actionControllerClass = ManipleDrive_FileController::className;

    protected $_ajaxFormHtml = true;

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
            'You are not allowed to edit metadata of this file'
        );

        $form = new Zefram_Form(array('elements' => array(
            // new Form_Element_Token('token'),
            'title' => array(
                'type' => 'text',
                'options' => array(
                    'label' => 'Title',
                    'required' => true,
                    'value' => strlen($file->title) ? $file->title : $file->name,
                    'validators' => array(
                        array('StringLength', true, array('max' => 128)),
                    ),
                    'filters' => array(
                        'StringTrim',
                    ),
                ),
            ),
            'author' => array(
                'type' => 'text',
                'options' => array(
                    'label' => 'Author / source',
                    'value' => $file->author,
                    'validators' => array(
                        array('StringLength', true, array('max' => 128)),
                    ),
                    'filters' => array(
                        'StringTrim',
                    ),
                ),
            ),
            'description' => array(
                'type' => 'textarea',
                'options' => array(
                    'label' => 'Description',
                    'value' => $file->description,
                    'validators' => array(
                        array('StringLength', true, array('max' => 512)),
                    ),
                    'filters' => array(
                        'StringTrim',
                    ),
                ),
            ),
        )));

        $this->_form = $form;
        $this->_file = $file;
    } // }}}

    protected function _process() // {{{
    {
        $values = $this->_form->getValues();
        $file = $this->_file;

        $this->_db->beginTransaction();

        try {
            $file->setFromArray($values);
            $file->modified_by = $this->getSecurityContext()->getUser()->getId();
            $file->save();
            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        $response = Zefram_Json::encode(array(
            'status' => 'success',
            'data' => $this->_driveHelper->getViewableData($file)
        ));

        header('Content-Type: application/json; charset=utf-8');
        header('Connection: close');
        header('Content-Length: ' . strlen($response));

        while (@ob_end_clean());

        echo $response;
        flush();

        // this is a must
        session_write_close();

        $this->getResource('drive.file_indexer')->update($file);

        exit;
    } // }}}
}
