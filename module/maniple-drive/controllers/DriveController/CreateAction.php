<?php

/**
 * Dodawanie nowego dysku wirtualnego.
 *
 * @version 2013-01-25
 * @author xemlock
 */
class ManipleDrive_DriveController_CreateAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    protected function _prepare()
    {
        $this->_helper->layout->setLayout('dialog');
        $this->_helper->viewRenderer->setRender('form');

        $this->assertAccess($this->getSecurityContext()->isSuperUser());

        $form = new ManipleDrive_Form_Drive(array(
            'tableProvider' => $this->getDriveHelper()->getTableProvider(),
            'userMapper' => $this->getDriveHelper()->getUserMapper(),
        ));

        $this->_form = $form;
    }

    protected function _process()
    {
        $values = $this->_form->getValues();

        $db = $this->getResource('db');
        $db->beginTransaction();

        try {
            $drive = $this->getTable('ManipleDrive_Model_DbTable_Drives')->createRow($values);
            $drive->setName($values['name']);
            $drive->created_by = $this->getSecurity()->getUser()->getId();
            $drive->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $response = $this->_helper->ajaxResponse();
        $response->setMessage(sprintf(
            $this->view->translate('Drive <em>%s</em> has been successfully created'),
            $drive->getName()
        ));
        $response->setData(array(
            'drive_id' => $drive->drive_id,
        ));
        $response->sendAndExit();
    }
}
