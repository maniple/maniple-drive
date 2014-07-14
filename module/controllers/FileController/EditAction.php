<?php

class ManipleDrive_FileController_EditAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    /**
     * @var ManipleDrive_Model_File
     */
    protected $_file;

    protected function _prepare() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $security = $this->getSecurityContext();
        $this->assertAccess($security->isAuthenticated());

        $helper = $this->getDriveHelper();

        $file_id = $this->getScalarParam('file_id');
        $file = $helper->fetchFile($file_id);

        $this->assertAccess(
            $helper->isFileWritable($file),
            'Nie masz uprawnień do edycji metadanych tego pliku'
        );

        $form = new Zefram_Form(array('elements' => array(
            // new Form_Element_Token('token'),
            'title' => array(
                'type' => 'text',
                'options' => array(
                    'label' => 'Tytuł',
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
                    'label' => 'Autor / źródło',
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
                    'label' => 'Opis',
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

        $db = $file->getAdapter();
        $db->beginTransaction();

        try {
            $file->setFromArray($values);
            $file->modified_by = $this->getSecurityContext()->getUser()->getId();
            $file->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $response = $this->_helper->ajaxResponse();
        $response->setData($this->getDriveHelper()->getViewableData($file));
        $response->sendAndExit();
    } // }}}
}
