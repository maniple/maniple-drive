<?php

/**
 * @method void assertAccess(bool $expr)
 */
class ManipleDrive_FileController_RemoveAction extends Maniple_Controller_Action_StandaloneForm
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

        $file_id = $this->getScalarParam('file_id');
        $file = $this->_driveHelper->fetchFile($file_id);

        $this->assertAccess($this->_driveHelper->isFileRemovable($file));

        $form = new Zefram_Form;

        $this->_file = $file;
        $this->_form = $form;

        $this->view->name= $file->name;
    } // }}}

    protected function _process() // {{{
    {
        $file = $this->_file;
        $dir = $file->Dir;

        // pobierz teraz identyfikator pliku, poniewaz po usunieciu pliku
        // nie bedzie on dostepny
        $file_id = $file->getId();
        $name = $file->getName();

        $this->_db->beginTransaction();

        try {
            $file->delete();
            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }


        $response = Zefram_Json::encode(array(
            'status' => 'success',
            'data' => array_merge(
                array(
                    'file_id' => $file_id,
                    'name' => $name,
                ),
                $this->_driveHelper->getUsageSummary($dir)
            ),
        ));

        header('Content-Type: application/json; charset=utf-8');
        header('Connection: close');
        header('Content-Length: ' . strlen($response));

        /** @noinspection PhpStatementHasEmptyBodyInspection */
        while (@ob_end_clean());

        echo $response;
        flush();

        // this is a must
        session_write_close();

        $this->getResource('drive.file_indexer')->delete($file_id);

        exit;
    } // }}}
}
