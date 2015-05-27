<?php

class ManipleDrive_ImageController extends ManipleDrive_Controller_Action
{
    public function browseAction()
    {
        $dir = $this->getDirFromRequest();

        $files = array();

        if ($dir) {
            if (!$dir instanceof ManipleDrive_Model_DirInterface) {
                throw new InvalidArgumentException('Invalid dir');
            }
            foreach ($dir->getFiles() as $file) {
                if (in_array($file->mimetype, array('image/jpeg', 'image/gif', 'image/png'))) {
                    $files[] = array(
                        'id'       => $file->file_id,
                        'name'     => $file->name,
                        'bytes'    => $file->size,
                        'size'     => $this->view->fileSize($file->size),
                        'mimeType' => $file->mimetype,
                        'url'      => $this->view->drive()->fileUrl($file),
                        'tileUrl'  => $this->view->url('drive.file.image', array('file_id' => $file->file_id, 'scale' => '200x200')),
                        'thumbUrl' => $this->view->url('drive.file.image', array('file_id' => $file->file_id, 'scale' => 'max:200')),
                    );
                }
            }
        }

        $this->view->upload_url = $this->view->drive()->browseUrl($dir);
        $this->view->files = $files;
        $html = $this->view->render('image/browse.twig');

        $response = $this->_helper->ajaxResponse();
        $response->setData($html);
        $response->sendAndExit();
    }

}