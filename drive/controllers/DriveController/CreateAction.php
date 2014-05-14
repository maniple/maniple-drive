<?php

/**
 * Dodawanie nowego dysku wirtualnego.
 *
 * @version 2013-01-25
 * @author xemlock
 */
class Drive_DriveController_CreateAction extends Zefram_Controller_Action_Standalone_Form
{
    const PARAM_USER = 'o';

    protected $_diskUser;

    protected function _init()
    {
        $this->_helper->layout->setLayout('dialog');

        // jezeli nie podano id wlasciciela wyswietl formularz wyboru
        // uzytkownika, po przeslaniu ktorego nastapi przejscie do wlasciwego
        // formularza dodania dysku
        $owner = $this->getScalarParam(self::PARAM_USER);

        if ($owner) {
            // sprawdz czy podany id uzytkownika jest poprawne, oraz czy dysk
            // o podanym id nie istnieje (tzn. czy uzytkownik nie ma juz
            // aktywnego dysku)
            $db = $this->getResource('db');

            $user = $db->getTable('Model_Core_Users')->findRow($owner);
            if (empty($user)) {
                throw new App_Exception_InvalidArgument('Użytkownik o podanym identyfikatorze nie istnieje');
            }

            $this->_diskUser = $user->id;
            $form = new Drive_Form_Drive;

        } else {
            $form = new Form(array(
                'method' => 'GET',
                'elements' => array(
                    'o' => array(
                        'type' => 'text',
                        'options' => array(
                            'label' => 'Wybierz właściciela dysku',
                            'required' => true,
                            'validators' => array(
                                new Validate_UserId,
                            ),
                        ),
                    ),
                ),
            ));
        }

        $this->_form = $form;
    }

    protected function _processForm()
    {
        if ($this->_diskUser) {
            $values = $this->_form->getValues();

            $db = $this->getResource('db');
            $db->beginTransaction();

            try {
                $drive = $db->getTable('Drive_Model_DbTable_Drives')->createRow($values);
                $drive->owner = $this->_diskUser;
                $drive->setName($values['name']);
                $drive->created_by = $this->getResource('user')->id;
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
}
