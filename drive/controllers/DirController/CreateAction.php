<?php

class Drive_DirController_CreateAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_parentDir;

    protected function _prepare() // {{{
    {
        $current_user = App::get('user');
        $this->assertAccess($current_user->isAuthenticated());

        $parent_id = $this->_getParam('dir_id');
        $parent_dir = $this->_helper->drive->fetchDir($parent_id);

        $this->assertAccess(
            $this->_helper->drive->isDirWritable($parent_dir),
            'Brak uprawnien do tworzenia nowych katalogów w tym katalogu.'
        );

        $elements = array(
            new Form_Element_Token('token'),
            'name' => array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'Nazwa katalogu',
                    'required'   => true,
                    'filters'    => array('StringTrim'),
                    'validators' => array(
                        new Drive_Validate_FileName,
                        new Drive_Validate_DirNotExists(array(
                            'adapter'  => App::get('db'),
                            'parentId' => $parent_dir->dir_id
                        )),
                    ),
                    'attribs'    => array(
                        'autocomplete' => 'off',
                    ),
                ),
            ),
        );

        if ($current_user->hasPerm('administrator')) {
            $elements['owner'] = array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'Właściciel',
                    'required'   => true,
                    'validators' => array(
                        new Core_Validate_UserId,
                    ),
                    'value'      => $current_user->id,
                    'attribs'    => array(
                        'data-label' => $current_user->first_name . ' ' . $current_user->last_name,
                    ),
                ),
            );
        }

        $this->_form = new Form(array('elements' => $elements));
        $this->_parentDir = $parent_dir;

        $this->_helper->layout->setLayout('dialog');
    } // }}}

    protected function _process() // {{{
    {
        $user = $this->getSecurity()->getUser();

        $values = $this->_form->getValues();
        $values['created_by'] = $user->getId();
        $values['modified_by'] = $user->getId();

        if (empty($values['owner'])) {
            $values['owner'] = $user->getId();
        }

        $db = App::get('db');

        $dirs = Zefram_Db::getTable('Drive_Model_DbTable_Dirs', $db);

        $db->beginTransaction();

        try {
            $dir = $dirs->createRow($values);
            $dir->drive_id = $this->_parentDir->drive_id;
            $dir->parent_id = $this->_parentDir->dir_ id;
            $dir->save();

            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        $result = $this->_helper->drive->getViewableData($dir, true);

        return $this->_helper->dialog->completionUrl(array(
            'dir' => $result,
        ));
    } // }}}
}
