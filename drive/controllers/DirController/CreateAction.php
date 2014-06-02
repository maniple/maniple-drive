<?php

class Drive_DirController_CreateAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = true;

    protected $_parentDir;

    protected function _prepare() // {{{
    {
        $security = $this->getSecurityContext();
        $this->assertAccess($security->isAuthenticated());

        $parent_id = (int) $this->getScalarParam('dir_id');
        $parent_dir = $this->getDriveHelper()->getDir($parent_id);

        $this->assertAccess(
            $this->getDriveHelper()->isDirWritable($parent_dir),
            'Brak uprawnien do tworzenia nowych katalogów w tym katalogu.'
        );

        $elements = array(
            // new Form_Element_Token('token'),
            'name' => array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'Nazwa katalogu',
                    'required'   => true,
                    'filters'    => array('StringTrim'),
                    'validators' => array(
                        new Drive_Validate_FileName,
                        new Drive_Validate_DirNotExists(array(
                            'tableProvider' => $this->getDriveHelper()->getTableProvider(),
                            'parentId' => $parent_dir->dir_id
                        )),
                    ),
                    'attribs'    => array(
                        'autocomplete' => 'off',
                    ),
                ),
            ),
        );

        $this->_form = new Zefram_Form(array('elements' => $elements));
        $this->_parentDir = $parent_dir;

        $this->_helper->layout->setLayout('dialog');
    } // }}}

    protected function _process() // {{{
    {
        $user = $this->getSecurityContext()->getUser();

        $data = $this->_form->getValues();
        $data['created_by']  = $user->getId();
        $data['modified_by'] = $user->getId();
        $data['owner']       = $user->getId();
        $data['drive_id']    = $this->_parentDir->drive_id;
        $data['parent_id']   = $this->_parentDir->dir_id;

        $mapper = $this->getDriveHelper()->getMapper();

        $dir = $mapper->createDir($data);
        $dir = $mapper->saveDir($dir);

        $result = $this->getDriveHelper()->getViewableData($dir, true);

        $response = $this->_helper->ajaxResponse();
        $response->setData(array(
            'dir' => $result,
        ));
        $response->sendAndExit();
    } // }}}
}
