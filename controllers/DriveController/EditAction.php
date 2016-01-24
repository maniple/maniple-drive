<?php

/**
 * Edycja dysku wirtualnego.
 *
 * @version 2014-05-14 / 2013-01-25
 * @author xemlock
 */
class ManipleDrive_DriveController_EditAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_drive;

    protected $_ajaxFormHtml = true;

    protected function _prepare()
    {
        $this->_helper->layout->setLayout('dialog');
        $this->_helper->viewRenderer->setRender('form');

        $this->assertAccess($this->getSecurityContext()->isSuperUser());

        $drive_id = $this->getScalarParam('drive_id', 0);
        $drive = $this->getResource('db.table_provider')->getTable('ManipleDrive_Model_DbTable_Drives')->findRow($drive_id);

        if (empty($drive)) {
            throw new Exception('Dysk o podanym identyfikatorze nie został znaleziony.');
        }

        $this->_drive = $drive;
        $this->_form  = new ManipleDrive_Form_Drive(array(
            'userMapper' => $this->getDriveHelper()->getUserMapper(),
            'tableProvider' => $this->getDriveHelper()->getTableProvider(),
            'drive' => $drive,
        ));
    }

    public function _process()
    {
        $values = $this->_form->getValues();

        $db = $this->getResource('db.adapter');
        $db->beginTransaction();

        try {
            $drive = $this->_drive;
            $drive->setFromArray($values);
            $drive->modified_by = $this->getSecurity()->getUser()->getId();
            $drive->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $response = $this->_helper->ajaxResponse();
        $response->setMessage(sprintf(
            $this->view->translate('Drive <em>%s</em> has been successfully updated'),
            $drive->getName()
        ));
        $response->setData(array(
            'drive_id' => $drive->drive_id,
        ));
        $response->sendAndExit();
    }
}

