<?php

class ManipleDrive_SearchController extends ManipleDrive_Controller_Action
{
    public function updateIndexAction()
    {
        $this->_helper->viewRenderer->setNoRender();
        $this->_helper->layout->disableLayout();

        header('Content-Type: text/plain; charset=utf-8');

        while (@ob_end_clean());
        set_time_limit(0);
        $start = microtime(true);

        try {
            $fileIndexer = $this->getResource('drive.file_indexer');

            echo sprintf("%8s  %-60s %s\n%s\n", 'file_id', 'name', 'stat', str_repeat('-', 76));

            $files = $this->getResource('db.table_provider')->getTable('ManipleDrive_Model_DbTable_Files')->fetchAll(null, 'file_id');

            foreach ($files as $file) {
                $s = microtime(true);
                $name = substr($file->name, 0, 59) . ' ';
                echo sprintf("%8d  %s", $file->file_id, str_pad($name, 60, '.'));
                flush();
                $fileIndexer->insert($file);
                printf(" done. (%.2fs)\n", microtime(true) - $s);
                flush();
            }
            echo "\n";
            echo "Rebuilding index ..."; flush();
            $s = microtime(true);

            $fileIndexer->getIndex()->rebuild();
            printf(" done. (%.2fs)\n", microtime(true) - $s);

            echo 'Total time elapsed: ', sprintf('%.2fs', microtime(true) - $start);

        } catch (Exception $e) {
            echo 'Error: ', $e->getMessage(), "\n";
            echo $e;
        }

        exit;
    }
}
