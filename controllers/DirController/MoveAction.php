<?php

/**
 * Przenoszenie katalogu do innego katalogu. Użytkownik wykonujący
 * akcje musi miec uprawnienia zapisu zarówno do nadrzędnego jak
 * i przenoszonego katalogu. Parametry wywołania akcji muszą być
 * przekazane metodą POST.
 *
 * @method void assertAccess(bool $expr)
 */
class ManipleDrive_DirController_MoveAction extends Maniple_Controller_Action_StandaloneForm
{
    /**
     * @var ManipleDrive_Model_Dir
     */
    protected $_dir;

    /**
     * @Inject
     * @var ManipleDrive_Helper
     */
    protected $_driveHelper;

    protected function _prepare()
    {
        $dir_id = $this->getScalarParam('dir_id');
        $dir = $this->_driveHelper->getRepository()->getDirOrThrow($dir_id);

        $this->assertAccess($this->_driveHelper->isDirWritable($dir));

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
        $parent_id = $this->_form->getValue('parent_id');
        $parent_dir = $this->_driveHelper->fetchDir($parent_id);
        $this->assertAccess($this->_driveHelper->isDirWritable($parent_dir));

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
