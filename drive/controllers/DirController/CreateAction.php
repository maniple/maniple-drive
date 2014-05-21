<?php

class Drive_DirController_CreateAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_parentDir;

    protected function _prepare() // {{{
    {
        $current_user = App::get('user');
        $this->assertAccess($current_user->isAuthenticated());

        $parent_id = (int) $this->getScalarParam('dir_id');
        $parent_dir = $this->getResource('drive.helper')->getDir($parent_id);

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

        $this->_form = new Form(array('elements' => $elements));
        $this->_parentDir = $parent_dir;

        $this->_helper->layout->setLayout('dialog');
    } // }}}

    protected function _process() // {{{
    {
        $user = $this->getSecurity()->getUser();

        $data = $this->_form->getValues();
        $data['created_by']  = $user->getId();
        $data['modified_by'] = $user->getId();
        $data['owner']       = $user->getId();
        $data['drive_id']    = $this->_parentDir->drive_id;
        $data['parent_id']   = $this->_parentDir->dir_id;

        $mapper = $this->getResource('drive.helper')->getMapper();

        $dir = $mapper->createDir($data);
        $dir = $mapper->saveDir($dir);

        $result = $this->_helper->drive->getViewableData($dir, true);

        return $this->_helper->dialog->completionUrl(array(
            'dir' => $result,
        ));
    } // }}}
}
