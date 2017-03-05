<?php

class ManipleDrive_DirController_UploadAction extends Maniple_Controller_Action_Standalone
{
    protected function _getTempName() // {{{
    {
        $prefix = sprintf('%06d.', $this->getSecurityContext()->getUser()->getId());
        return ManipleDrive_FileStorage::requireTempDir('uploads') . uniqid($prefix, true);
    } // }}}

    /**
     * @param ManipleDrive_Options_FileUpload $options
     * @return Zend_File_Transfer_Adapter_Http
     */
    public function getFileTransfer(ManipleDrive_Options_FileUpload $options = null)
    {
        if ($options === null) {
            $options = new ManipleDrive_Options_FileUpload();
        }

        $upload = new Zend_File_Transfer_Adapter_Http();

        $filter = new Zefram_Filter_FileSizeToInteger();
        $iniSize = min(
            $filter->filter(ini_get('post_max_size')),
            $filter->filter(ini_get('upload_max_filesize'))
        );

        $file_validator_upload_messages = array(
            Zend_Validate_File_Upload::INI_SIZE       => 'File exceeds the defined ini size (' . $this->view->fileSize($iniSize) . ')',
            Zend_Validate_File_Upload::FORM_SIZE      => 'File exceeds the defined form size',
            Zend_Validate_File_Upload::PARTIAL        => 'File was only partially uploaded',
            Zend_Validate_File_Upload::NO_FILE        => 'File was not uploaded',
            Zend_Validate_File_Upload::NO_TMP_DIR     => 'No temporary directory was found',
            Zend_Validate_File_Upload::CANT_WRITE     => "File can't be written",
            Zend_Validate_File_Upload::EXTENSION      => 'A PHP extension returned an error while uploading the file',
            Zend_Validate_File_Upload::ATTACK         => 'File was illegally uploaded. This could be a possible attack',
            Zend_Validate_File_Upload::FILE_NOT_FOUND => 'File was not uploaded',
            Zend_Validate_File_Upload::UNKNOWN        => 'Unknown error while uploading file',
        );

        $file_validator_mimetype_messages = array(
            Zend_Validate_File_MimeType::FALSE_TYPE   => 'File is of invalid type',
            Zend_Validate_File_MimeType::NOT_DETECTED => 'MIME type of this file could not be detected',
            Zend_Validate_File_MimeType::NOT_READABLE => 'File is not readable',
        );

        $file_validator_size_messages = array(
            Zend_Validate_File_Size::TOO_BIG   => 'Size of this file exceeds %max%',
            Zend_Validate_File_Size::TOO_SMALL => 'Minimum expected size for file is %min%',
            Zend_Validate_File_Size::NOT_FOUND => 'File was not found',
        );

        $upload->getValidator('upload')->setMessages($file_validator_upload_messages);

        $validatorChain = new Zefram_Validate();
        $validatorChain->addValidator('File_Size', true, array(
            'min' => $options->getMinSize(),
            'max' => $options->getMaxSize(),
            'bytestring' => true,
            'messages' => $file_validator_size_messages,
        ));

        if ($options->getAllowedMimeTypes()) {
            $validatorChain->addValidator('File_MimeType', true, array(
                $options->getAllowedMimeTypes(),
                'messages' => $file_validator_mimetype_messages,
            ));
        }

        if ($options->getImageSize()) {
            $validatorChain->addValidator('File_ImageSize', true, $options->getImageSize());
        }

        $upload->addValidator($validatorChain);

        return $upload;
    }

    protected function _getUploadOptions()
    {
        // if uploadOptions request param is passed as an object, it means that
        // it is provided internally via _forward)
        $uploadOptions = $this->_request->get('uploadOptions');
        if (!$uploadOptions instanceof ManipleDrive_Options_FileUpload) {
            $uploadOptions = null;
        }
        return $uploadOptions;
    }

    /**
     * Pobiera treść pliku przesłanego metodą POST.
     *
     * @param string $key
     * @return array
     * @throws Zend_File_Transfer_Exception
     */
    protected function _handlePostUpload($key = 'file') // {{{
    {
        $uploadOptions = $this->_getUploadOptions();
        $upload = $this->getFileTransfer($uploadOptions);

        // zapamietaj oryginalna nazwe pliku
        $name = $upload->getFileName($key, false);

        // wygeneruj tymczasowa nazwe pliku na potrzeby przetwarzania
        // wstepnego poprzedzajacego zapis do docelowej lokalizacji
        $tempname = $this->_getTempName();
        $upload->addFilter(new Zend_Filter_File_Rename(array(
            'target' => $tempname,
            'overwrite' => true,
        )));

        if ($upload->receive($key)) {
            chmod($tempname, 0444);

            // pobierz informacje o zapisanym pliku, przywroc jego
            // oryginalna nazwe
            $info = $upload->getFileInfo($key);
            $info = reset($info);
            $info['name'] = $name;

            return $info;
        }

        if (!$upload->isValid($key)) {
            $messages = $upload->getMessages();
            throw new Zend_File_Transfer_Exception(reset($messages));
        }

        throw new Zend_File_Transfer_Exception('Unable to receive file contents');
    } // }}}

    /**
     * @param string $initial
     * @param ManipleDrive_Model_Dir $dir
     * @param int $limit OPTIONAL
     */
    /*
    protected function _uniqueName($initial, $dir, $limit = 0)
    {
        $limit = (int) $limit;

        // nie zezwalaj na otaczajace spacje
        $initial = trim($initial);

        // ani na kropke na koncu pliku (Windowsowy menadzer okien nie potrafi
        // usuwac takich plikow)
        $initial = rtrim($initial, '.');

        // wykrywanie powtarzajacej sie nazwy pliku, trzeba dodac przyrostek.
        // Sprawdz nie wiecej niz 16 potencjalnych nazw pliku. Jezeli one
        // sa zajete zglos blad
        $files = Zefram_Db::getTable('ManipleDrive_Model_DbTable_Files', $dir->getAdapter());
        $counter = 0;

        $parts = array_merge(
            array('filename' => '', 'extension' => ''),
            (array) pathinfo($initial)
        );

        if (strlen($parts['extension'])) {
            $parts['extension'] = '.' . $parts['extension'];
        }

        $newname = $parts['filename'] . $parts['extension'];

        $where = array(
            'dir_id = ?' => $dir->dir_id,
            'name = ?' => $newname,
        );

        while ($files->countAll($where)) {
            $newname = ltrim($parts['filename'] . ' (' . ++$counter . ')') . $parts['extension'];
            $where['name = ?'] = $newname;

            if ((0 < $limit) && ($limit <= $counter)) {
                return false;
            }
        }

        // wykonaj to samo sprawdzajac wsrod nazw podkatalogow tego katalogu
        // dla katalogow pozniej, bo zwykle pliki maja rozszerzenia, a katalogi
        // nie bardzo
        $where = array(
            'parent_id = ?' => $dir->dir_id,
            'name = ?' => $newname,
        );
        $dirs = $dir->getTable();

        while ($dirs->countAll($where)) {
            $newname = ltrim($parts['filename'] . ' (' . ++$counter . ')') . $parts['extension'];
            $where['name = ?'] = $newname;

            if ((0 < $limit) && ($limit <= $counter)) {
                return false;
            }
        }

        return $newname;
    }*/

    /**
     * @param array $info
     * @param string $destination
     */
    protected function _saveUploadedFile($dir, $info)
    {
        $name = trim($info['name']);

        // usun ewentualna kropke na koncu nazwy pliku, dopuszczona jest
        // nazwa pliku rozpoczynajaca sie kropka
        // Windows Explorer nie jest w stanie usunac wpisow z kropka na koncu
        $name = rtrim($name, '.');

        // jezeli nikt nie mieszal przy nazwie pliku, to nie powinna ona
        // zawierac tych znakow
        $name = preg_replace('#[\/:*?"<>|]#', '', $name);

        if (!strlen($name)) {
            throw new InvalidArgumentException($this->view->translate('Invalid file name'));
        }

        $info['name'] = $name;
        $tempname = $info['tmp_name'];

        if (!is_file($tempname)) {
            throw new Exception('Nie odnaleziono pliku.');
        }

        // wykonaj skan antywirusem
        if (0) {
        $output = Zefram_Os::exec('clamscan', escapeshellarg($tempname));
        if (false !== stripos($output, 'SCAN SUMMARY') && 
            false === stripos($output, 'Infected files: 0'))
        {
            unlink($tempname);
            throw new Exception('W pliku został wykryty wirus.');
        }
        }

        //$info['name'] = $this->_uniqueName($info['name'], $dir, 16);
        //if (false === $info['name']) {
        //    unlink($tempname);
        //    throw new App_Exception('Plik o podanej nazwie już istnieje');
        //}

        $user = $this->getSecurityContext()->getUser();

        $info['owner'] = $user->getId();
        $info['created_by'] = $user->getId();
        $info['modified_by'] = $user->getId();

        $db = $dir->getAdapter();
        $db->beginTransaction();

        try {
            $file = $dir->saveFile($info['tmp_name'], $info);
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        if (($uploadOptions = $this->_getUploadOptions())
            && ($fileSaveListener = $uploadOptions->getFileSaveListener())
        ) {
            $fileSaveListener->invoke($file);
        }

        $result = $this->getDriveHelper()->getViewableData($file);

        // do zwracanych danych dolacz jeszcze informacje o zajetym
        // miejscu na dysku
        try {
            $drive = $dir->getDrive();

            // zwroc te wartosci jako floaty, zeby uniknac przekroczenia zakresu
            // liczb calkowitych na 32-bitowych maszynach
            $result['disk_usage'] = $drive->getDiskUsage();
            $result['quota'] = (float) $drive->quota;
        } catch (Exception $e) {
            $result['disk_usage'] = '';
            $result['quota'] = '';
        }
        $result['file'] = $file;

        return $result;
    }

    public function run()
    {
        try {
            $this->assertAccess($this->getSecurityContext()->isAuthenticated());

            // katalog, w ktorym umieszczony ma zostac plik
            $dir = $this->getParam('dir');

            if (!$dir instanceof ManipleDrive_Model_Dir) {
                $dir_id = (int) $this->getScalarParam('dir_id');
                $dir = $this->getDriveHelper()->fetchDir($dir_id);
            }

            // TODO uprawnienia zapisu do dysku
            if (!$this->getDriveHelper()->isDirWritable($dir)) {
                throw new Exception($this->view->translate('This directory is not writable'));
            }

            $fileinfo = $this->_handlePostUpload();
            $result = $this->_saveUploadedFile($dir, $fileinfo);
            $file = $result['file'];
            unset($result['file']);

        } catch (Exception $e) {
            $result = array(
                'error' => $this->view->translate($e->getMessage()),
            );
        }

        // nie helper, bo to moze byc otwarte w IFRAME, a wtedy ssacy niemozebnie
        // IE bedzie chcial otworzyc to jako plik
        $output = Zefram_Json::encode($result);

        header('Content-Type: text/html; charset=utf-8');
        header('Connection: close');
        header('Content-Length: ' . strlen($output));

        while (@ob_end_clean());

        echo $output;
        //flush();

        //session_write_close();

        if (isset($file)) {
            try {
                $this->getResource('drive.file_indexer')->insert($file);
            } catch (Exception $e) {
                // echo $e->getMessage();
                // TODO log exception
            }
        }

        exit;
    }
}
