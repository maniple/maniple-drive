<?php

/**
 * Edycja dysku wirtualnego.
 *
 * @version 2013-01-25
 * @author xemlock
 */
class Drive_DriveController_EditAction extends Zefram_Controller_Action_Standalone_Form
{
    protected $_drive;

    protected function _init()
    {
        $this->_helper->layout->setLayout('dialog');
        $this->_helper->viewRenderer->setRender('create');

        $this->assertAccess(App::get('user')->isAuthenticated());

        $db = $this->getResource('db');
        $id = $this->getScalarParam('id', 0);
        $drive = Zefram_Db::getTable('Drive_Model_DbTable_Drives', $db)->findRow($id);

        if (empty($drive)) {
            throw new App_Exception_NotFound('Dysk o podanym identyfikatorze nie został znaleziony.');
        }

        $this->_drive = $drive;
        $this->_form  = new Drive_Form_Drive(array('drive' => $drive));
    }

    public function _processForm()
    {
        $values = $this->_form->getValues();

        $user = App::get('user');

        $db = $this->getResource('db');
        $db->beginTransaction();

        try {
            $drive = $this->_drive;
            $drive->setFromArray($values);
            $drive->modified_by = $user->id;
            $drive->save();
            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        return $this->_helper->dialog->completionUrl(array(
            'id' => $drive->id,
        ));
    }
}

