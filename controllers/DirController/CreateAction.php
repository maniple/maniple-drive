<?php

class ManipleDrive_DirController_CreateAction extends Maniple_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = false;

    /**
     * @var ManipleDrive_Model_Dir
     */
    protected $_dir;

    protected function _prepare() // {{{
    {
        $security = $this->getSecurityContext();
        $this->assertAccess($security->isAuthenticated());

        $dir_id = $this->getScalarParam('dir_id');
        $dir = $this->getDriveHelper()->getRepository()->getDirOrThrow($dir_id);

        $this->assertAccess(
            $this->getDriveHelper()->isDirWritable($dir),
            $this->view->translate('You are not allowed to create new directories inside this directory.')
        );

        $elements = array(
            // new Form_Element_Token('token'),
            'name' => array(
                'type' => 'text',
                'options' => array(
                    'label'      => 'Directory name',
                    'required'   => true,
                    'filters'    => array('StringTrim'),
                    'validators' => array(
                        array(
                            new ManipleDrive_Validate_FileName(),
                            true
                        ),
                        array(
                            new ManipleDrive_Validate_DirNotExists(array(
                                'tableProvider' => $this->getDriveHelper()->getTableProvider(),
                                'parentId' => $dir->dir_id
                            )),
                            true
                        ),
                    ),
                    'attribs'    => array(
                        'autocomplete' => 'off',
                    ),
                ),
            ),
        );

        $this->_form = new Zefram_Form(array('elements' => $elements));
        $this->_dir = $dir;
    } // }}}

    protected function _process() // {{{
    {
        $user = $this->getSecurityContext()->getUser();
        $name = $this->_form->getValue('name');
        $data = array(
            'created_by' => $user->getId(),
            'owner' => $user->getId(),
        );
        $subdir = $this->_dir->createDir($name, $data);

        $result = $this->getDriveHelper()->getViewableData($subdir, true);

        $response = $this->_helper->ajaxResponse();
        $response->setData(array(
            'dir' => $result,
        ));
        $response->sendAndExit();
    } // }}}
}
