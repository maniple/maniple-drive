<?php

class Drive_IndexController extends Controller_Action
{
    public function indexAction()
    {
        $path = explode('/', $this->getScalarParam('path'));

        $dirs = Zefram_Db::getTable('Drive_Model_DbTable_Dirs');
        $name = array_shift($path);

        $dir = $dirs->fetchRow(array(
            'name = ?' => $name,
            'parent_id IS NULL',
        ));

        if ($dir) {
            $file = Zefram_Db::getTable('Drive_Model_DbTable_Drives')->fetchByPath(
                $dir->Drive, implode('/', $path)
            );
            if ($file) {
                if ($this->_helper->drive->isFileReadable($file)) {
                    $this->_helper->serveFile(
                        $file->getPath(),
                        array(
                            'type' => $file->mimetype,
                            'name' => $file->name,
                        )
                    );
                } else {
                    if (App::get('user')->isAuthenticated()) {
                        echo 'Nie masz uprawnień do oglądania tego pliku';
                        exit;
                    } else {
                        $this->_forward(
                            'login', 'auth', 'core', array(
                                'continue' => $this->_helper->drive->getFileUrl($file, array(
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
