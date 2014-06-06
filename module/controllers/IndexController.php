<?php

class Drive_IndexController extends Drive_Controller_Action
{
    public function indexAction()
    {
        $path = explode('/', $this->getScalarParam('path'));

        $dirs = $this->getTable('Drive_Model_DbTable_Dirs');
        $name = array_shift($path);

        $dir = $dirs->fetchRow(array(
            'name = ?' => $name,
            'parent_id IS NULL',
        ));

        if ($dir) {
            $file = $this->getTable('Drive_Model_DbTable_Drives')->fetchByPath(
                $dir->Drive, implode('/', $path)
            );
            if ($file) {
                if ($this->getDriveHelper()->isFileReadable($file)) {
                    $this->_helper->serveFile(
                        $file->getPath(),
                        array(
                            'type' => $file->mimetype,
                            'name' => $file->name,
                        )
                    );
                } else {
                    if ($this->getSecurityContext()->isAuthenticated()) {
                        echo 'Nie masz uprawnień do oglądania tego pliku';
                        exit;
                    } else {
                        $this->_forward(
                            'login', 'auth', 'core', array(
                                'continue' => $this->getDriveHelper()->getFileUrl($file, array(
                                    'absolute' => false,
                                )),
                                'auth_required' => true
                            )
                        );
                        return;
                    }
                }
            }
        }

        echo '404 Not Found';
        exit;
    }

    public function dirAction()
    {
    
    }

    public function fileAction()
    {
        
    
    }
}
