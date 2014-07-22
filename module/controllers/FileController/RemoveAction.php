<?php

class ManipleDrive_FileController_RemoveAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    protected $_file;

    protected function _prepare() // {{{
    {
        $this->_helper->layout->setLayout('dialog');

        $helper = $this->getDriveHelper();

        $file_id = $this->getScalarParam('file_id');
        $file = $helper->fetchFile($file_id);

        $this->assertAccess($helper->isFileRemovable($file));

        $form = new Zefram_Form;

        $this->_file = $file;
        $this->_form = $form;

        $this->view->name= $file->name;
    } // }}}

    protected function _process() // {{{
    {
        $file = $this->_file;
        $drive = $file->Dir->Drive;

        // pobierz teraz identyfikator pliku, poniewaz po usunieciu pliku
        // nie bedzie on dostepny
        $file_id = $file->file_id;
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


        $response = Zefram_Json::encode(array(
            'status' => 'success',
            'data' => array(
                'file_id' => $file_id,
                'name' => $name,
                'disk_usage' => $drive->getDiskUsage(),
                'quota' => (float) $drive->quota,
            ),
        ));

        header('Content-Type: application/json; charset=utf-8');
        header('Connection: close');
        header('Content-Length: ' . strlen($response));

        while (@ob_end_clean());

        echo $response;
        flush();

        // this is a must
        session_write_close();

        $this->getResource('drive.file_indexer')->delete($file_id);

        exit;
    } // }}}
}
