<?php

/**
 * Dodawanie nowego dysku wirtualnego.
 *
 * @method void assertAccess(bool $expr)
 *
 * @version 2013-01-25
 * @author xemlock
 */
class ManipleDrive_DriveController_CreateAction extends Maniple_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    /**
     * @Inject
     * @var ManipleDrive_Helper
     */
    protected $_driveHelper;

    /**
     * @Inject
     * @var Zefram_Db
     */
    protected $_db;

    protected function _prepare()
    {
        $this->_helper->layout->setLayout('dialog');
        $this->_helper->viewRenderer->setRender('form');

        $this->assertAccess($this->getSecurityContext()->isSuperUser());

        $form = new ManipleDrive_Form_Drive(array(
            'tableProvider' => $this->_driveHelper->getTableProvider(),
            'userMapper' => $this->_driveHelper->getUserMapper(),
        ));

        $this->_form = $form;
    }

    protected function _process()
    {
        $values = $this->_form->getValues();

        $this->_db->beginTransaction();

        try {
            $drive = $this->_db->getTable(ManipleDrive_Model_DbTable_Dirs::className)->createRow($values);
            $drive->setFromArray(array(
                'name'       => $values['name'],
                'created_by' => $this->getSecurity()->getUser()->getId(),
            ));
            $drive->save();
            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        $response = $this->_helper->ajaxResponse();
        $response->setMessage(sprintf(
            $this->view->translate('Drive <em>%s</em> has been successfully created'),
            $drive->getName()
        ));
        $response->setData(array(
            'dir_id' => $drive->getId(),
        ));
        $response->sendAndExit();
    }
}
