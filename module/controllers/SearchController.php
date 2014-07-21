<?php

class ManipleDrive_SearchController extends ManipleDrive_Controller_Action
{
    public function updateAction()
    {
        $searchDir = APPLICATION_PATH . '/../variable/search';
        if (!is_dir($searchDir)) {
            mkdir($searchDir, 0777, true);
        }

//Zend_Search_Lucene_Analysis_Analyzer::setDefault(new Zend_Search_Lucene_Analysis_Analyzer_Common_Utf8());
//Zend_Search_Lucene_Search_QueryParser::setDefaultEncoding('UTF-8');
//Zend_Search_Lucene_Analysis_Analyzer::setDefault(new Zend_Search_Lucene_Analysis_Analyzer_Common_Utf8_CaseInsensitive());

        $index = Zend_Search_Lucene::create($searchDir . '/drive_index');

        $sql = 'SELECT * FROM ' . $this->getResource('db.table_provider')->tableName(ManipleDrive_Model_TableNames::TABLE_FILES);
        $db = $this->getResource('db.adapter');
        $stmt = $db->query($sql);

        while ($row = $stmt->fetch(Zend_Db::FETCH_ASSOC)) {
            $doc = new Zend_Search_Lucene_Document();

            $doc->addField(Zend_Search_Lucene_Field::Text('file_id', $row['file_id'], 'utf-8'));

            $doc->addField(Zend_Search_Lucene_Field::UnStored('name', $row['name'], 'utf-8'));
            $doc->addField(Zend_Search_Lucene_Field::UnStored('title', $row['title'], 'utf-8'));
            $doc->addField(Zend_Search_Lucene_Field::UnStored('author', $row['author'], 'utf-8'));
            $doc->addField(Zend_Search_Lucene_Field::UnStored('description', $row['description'], 'utf-8'));

            $index->addDocument($doc);
        }

        $index->optimize();
        exit;
    }

    // updateFile --> update index 'all' and for matching drive

    public function indexAction()
    {
        $searchDir = APPLICATION_PATH . '/../variable/search';

        $q = $this->getScalarParam('q');
        echo $q, '<br/>';
        $index = Zend_Search_Lucene::open($searchDir . '/drive_index');

        Zend_Search_Lucene_Analysis_Analyzer::setDefault(new Zend_Search_Lucene_Analysis_Analyzer_Common_Utf8());

        $hits = $index->find($q);

        $file_ids = array();
        foreach ($hits as $hit) {
            $doc = $hit->getDocument();
            $file_ids[] = $doc->file_id;
        }

        $files = $this->getResource('db.table_provider')->getTable('ManipleDrive_Model_DbTable_Files')->fetchAll(array('file_id IN (?)' => $file_ids));
        foreach ($files as $file) {
            if ($this->getDriveHelper()->isFileReadable($file)) {
                echo $file->name, ' (id:', $file->file_id, ', size:', $file->size, ')<br/>';
            }
        }
        exit;
    }
}
