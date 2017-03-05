<?php

/**
 * Przenoszenie katalogu do innego katalogu. Użytkownik wykonujący
 * akcje musi miec uprawnienia zapisu zarówno do nadrzędnego jak
 * i przenoszonego katalogu. Parametry wywołania akcji muszą być
 * przekazane metodą POST.
 */
class ManipleDrive_DirController_MoveAction extends Maniple_Controller_Action_StandaloneForm
{
    /**
     * @var ManipleDrive_Model_Dir
     */
    protected $_dir;

    protected function _prepare()
    {
        $drive_helper = $this->getDriveHelper();

        $dir_id = $this->getScalarParam('dir_id');
        $dir = $drive_helper->getRepository()->getDirOrThrow($dir_id);

        $this->assertAccess($drive_helper->isDirWritable($dir));

        $this->_dir = $dir;
        $this->_form = new Zefram_Form(array('elements' => array(
            'parent_id' => array(
                'type' => 'hidden',
                'options' => array(
                    'required' => true,
                ),
            ),
        )));
    }

    protected function _process()
    {
        $drive_helper = $this->getDriveHelper();

        $parent_id = $this->_form->getValue('parent_id');
        $parent_dir = $drive_helper->fetchDir($parent_id);
        $this->assertAccess($drive_helper->isDirWritable($parent_dir));

        $db = $this->_dir->getAdapter();
        $db->beginTransaction();
        try {
            $this->_dir->parent_id = $parent_dir->dir_id;
            $this->_dir->modified_by = $this->getSecurityContext()->getUser()->getId();
            $this->_dir->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $ajaxResponse = $this->_helper->ajaxResponse();
        $ajaxResponse->sendAndExit();
    }
}
