<?php

/**
 * Dodawanie nowego dysku wirtualnego.
 *
 * @version 2013-01-25
 * @author xemlock
 */
class Drive_DriveController_CreateAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    protected function _prepare()
    {
        $this->_helper->layout->setLayout('dialog');

        $form = new Drive_Form_Drive(array(
            'tableProvider' => $this->getResource('db.table_provider'),
            'userMapper' => $this->getResource('profile.mapper'),
        ));

        $this->_form = $form;
    }

    protected function _process()
    {
        $values = $this->_form->getValues();

        $db = $this->getResource('db');
        $db->beginTransaction();

        try {
            $drive = $this->getTable('Drive_Model_DbTable_Drives')->createRow($values);
            $drive->setName($values['name']);
            $drive->created_by = $this->getSecurity()->getUserId();
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
