<?php

/**
 * Edycja dysku wirtualnego.
 *
 * @version 2014-05-14 / 2013-01-25
 * @author xemlock
 */
class ManipleDrive_DriveController_EditAction extends Maniple_Controller_Action_StandaloneForm
{
    protected $_drive;

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

        $drive_id = $this->getScalarParam('drive_id', 0);
        $drive = $this->getResource('db.table_provider')->getTable(ManipleDrive_Model_DbTable_Drives::className)->findRow($drive_id);

        if (empty($drive)) {
            throw new Exception('Dysk o podanym identyfikatorze nie został znaleziony.');
        }

        $this->_drive = $drive;
        $this->_form  = new ManipleDrive_Form_Drive(array(
            'userMapper' => $this->_driveHelper->getUserMapper(),
            'tableProvider' => $this->_driveHelper->getTableProvider(),
            'drive' => $drive,
        ));
    }

    public function _process()
    {
        $values = $this->_form->getValues();

        $this->_db->beginTransaction();

        try {
            $drive = $this->_drive;
            $drive->setFromArray($values);
            $drive->modified_by = $this->getSecurity()->getUser()->getId();
            $drive->save();
            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
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

