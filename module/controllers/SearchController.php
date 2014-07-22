<?php

class ManipleDrive_SearchController extends ManipleDrive_Controller_Action
{
    public function updateIndexAction()
    {
        header('Content-Type: text/plain; charset=utf-8');

        while (@ob_end_clean());
        set_time_limit(0);
        $start = microtime(true);

        $this->_helper->viewRenderer->setNoRender();

        $fileIndexer = $this->getResource('drive.file_indexer');

        $files = $this->getResource('db.table_provider')->getTable('ManipleDrive_Model_DbTable_Files')->fetchAll(null, 'file_id');

        foreach ($files as $file) {
            echo sprintf("%-6d %s", $file['file_id'], str_pad($file['name']. ' ', 64, '.'));
            $fileIndexer->insert($file);
            echo " done.\n";
            flush();
        }
        echo "\n";
        echo 'Time elapsed: ', sprintf('%.4fs', (microtime(true) - $start) / 1000000);
        $fileIndexer->getIndex()->rebuild();
    }
}
