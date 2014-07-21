<?php

class ManipleDrive_FileIndexer
{
    /**
     * @var Maniple_Search_IndexFactoryInterface
     */
    protected $_indexFactory;

    /**
     * @var Maniple_Search_Stemmer_StemmerInterface
     */
    protected $_stemmer;

    /**
     * Sets index factory.
     *
     * @param  Maniple_Search_IndexFactoryInterface
     * @return ManipleDrive_FileIndexer
     */
    public function setIndexFactory(Maniple_Search_IndexFactoryInterface $indexFactory) // {{{
    {
        $this->_indexFactory = $indexFactory;
        return $this;
    } // }}}

    /**
     * Retrieves index factory.
     *
     * @return Maniple_Search_IndexFactoryInterface
     */
    public function getIndexFactory() // {{{
    {
        if (empty($this->_indexFactory)) {
            throw new Exception('Index factory is not initialized');
        }
        return $this->_indexFactory;
    } // }}}

    /**
     * Sets a stemmer instance.
     *
     * @param  Maniple_Search_Stemmer_StemmerInterface $stemmer
     * @return ManipleDrive_FileIndexer
     */
    public function setStemmer(Maniple_Search_Stemmer_StemmerInterface $stemmer) // {{{
    {
        $this->_stemmer = $stemmer;
        return $this;
    } // }}}

    /**
     * @return Maniple_Search_IndexInterface
     */
    protected function _getIndex() // {{{
    {
        if (empty($this->_index)) {
            $this->_index = $this->getIndexFactory()->getIndex('drive.file_index');
        }
        return $this->_index;
    } // }}}

    public function insert(ManipleDrive_Model_File $file)
    {
        $doc = new Maniple_Search_Document();

        $doc->addField(Maniple_Search_Field::Id('file_id', $file->file_id));
        $doc->addField(Maniple_Search_Field::Text('name', $file->name));
        $doc->addField(Maniple_Search_Field::Text('title', $file->title));
        $doc->addField(Maniple_Search_Field::Text('author', $file->author));

        $doc->addField(Maniple_Search_Field::Text('description', $this->stemWords($file->description)));

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
                $doc->addField(Maniple_Search_Field::Text('text_content', $this->stemWords($output)));
            }
        }

        $this->_getIndex()->insert($doc);

        return $this;
    }

    public function update(ManipleDrive_Model_File $file)
    {
        
    }

    public function delete($fileId)
    {
        if ($fileId instanceof ManipleDrive_Model_File) {
            $fileId = $fileId->file_id;
        }
        $fileId = (int) $fileId;
        $this->_getIndex()->delete($fileId);
        return $this;
    }

    public function search($query)
    {
var_dump($query);
        return $this->_getIndex()->search((string) $query);
    }

    public function stemWords($text)
    {
        $text = trim($text);

        if ($this->_stemmer) {
            $text = implode(
                ' ',
                array_map(
                    array($this->_stemmer, 'stem'),
                    preg_split('/\s+/', $text)
                )
            );
        }

        return $text;
    }
}
