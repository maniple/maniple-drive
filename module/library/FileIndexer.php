<?php

class ManipleDrive_FileIndexer
{
    /**
     * @var Maniple_Search_IndexFactoryInterface
     */
    protected $_index;

    /**
     * Sets index.
     *
     * @param  Maniple_Search_WritableIndexInterface
     * @return ManipleDrive_FileIndexer
     */
    public function setIndex(Maniple_Search_WritableIndexInterface $index) // {{{
    {
        $this->_index = $index;
        return $this;
    } // }}}

    /**
     * Retrieves index factory.
     *
     * @return Maniple_Search_WritableIndexInterface
     */
    public function getIndex() // {{{
    {
        if (empty($this->_index)) {
            throw new Exception('Index is not initialized');
        }
        return $this->_index;
    } // }}}

    public function insert(ManipleDrive_Model_File $file)
    {
        $textContent = $this->_getFileTextContent($file);
        $doc = $this->_createFileDocument($file, $textContent);

        $this->getIndex()->insert($doc);

        return $this;
    }

    protected function _getFileTextContent(ManipleDrive_Model_File $file)
    {
        $devnull = stripos(PHP_OS, 'win') !== false ? 'nul' : '/dev/null';
        $commands = array(
            Zefram_File_MimeType_Data::PDF => 'pdftotext -enc UTF-8 %filename% - 2>' . $devnull,
            /*Zefram_File_MimeType_Data::PPT => 'catppt -d UTF-8 %filename% 2>' . $devnull,
            Zefram_File_MimeType_Data::DOC => 'catdoc -d UTF-8 %filename% 2>' . $devnull,
            Zefram_File_MimeType_Data::XLS => 'xls2csv -d UTF-8 %filename% 2>' . $devnull,*/
        );
        
        if (isset($commands[$file->mimetype])) {
            $filename = escapeshellarg($file->name);
            $cmd = str_replace('%filename%', $file->getPath(), $commands[$file->mimetype]);
            $output = array();
            $status = 0;
            exec($cmd, $output, $status);

            if ($status === 0) {
                $output = implode($output, "\n");
                $output = preg_replace('/[\p{Z}\p{C}]+/u', ' ', $output); // Z - separators, C - other
                return $output;
            }
        }

        return null;
    }

    public function update(ManipleDrive_Model_File $file)
    {
        // find document with given
        $textContent = null;
        $hits = $this->getIndex()->find($this->getIndex()->getFieldQuery('file_id', $file->file_id));

        foreach ($hits as $hit) {
            $textContent = $hit->text_content;
            break;
        }

        if ($textContent === null) {
            $textContent = $this->_getFileTextContent($file);
        }

        $doc = $this->_createFileDocument($file, $textContent);
        $this->getIndex()->insert($doc);
    }

    protected function _createFileDocument(ManipleDrive_Model_File $file, $textContent = null)
    {
        $doc = new Maniple_Search_Document();

        $doc->addField(Maniple_Search_Field::Id('file_id',       $file->file_id));
        $doc->addField(Maniple_Search_Field::Meta('drive_id',    $file->Dir->drive_id));
        $doc->addField(Maniple_Search_Field::Text('name',        $file->name));
        $doc->addField(Maniple_Search_Field::Text('title',       $file->title));
        $doc->addField(Maniple_Search_Field::Text('author',      $file->author));
        $doc->addField(Maniple_Search_Field::Text('description', $file->description));

        if ($textContent) {
            $doc->addField(Maniple_Search_Field::Text('text_content', $textContent));
        }        

        return $doc;
    }

    public function delete($fileId)
    {
        if ($fileId instanceof ManipleDrive_Model_File) {
            $fileId = $fileId->file_id;
        }
        $fileId = (int) $fileId;
        $this->getIndex()->delete(Maniple_Search_Field::Id('file_id', $fileId));
        return $this;
    }

    public function search($query)
    {
        return $this->getIndex()->search((string) $query);
    }

    public function searchInDrive($query, $drive_id)
    {
        return $this->getIndex()->search($query . $this->getIndex()->getFieldQuery('drive_id', $drive_id));
    }
}
