<?php

class Drive_DirController_CreateAction extends Zefram_Controller_Action_StandaloneForm
{
    protected $_ajaxFormHtml = false;

    protected $_dir;

    protected $_dirContext;

    protected function _prepare() // {{{
    {
        $security = $this->getSecurityContext();
        $this->assertAccess($security->isAuthenticated());

        $dir_context = Drive_DirBrowsingContext::createFromString($this->getScalarParam('dir_id'));
        $dir = $this->getDriveHelper()->getDir($dir_context->getDirId());

        $this->assertAccess(
            $this->getDriveHelper()->isDirWritable($dir),
            'You are not allowed to create new directories inside this directory.'
            // 'Brak uprawnien do tworzenia nowych katalogów w tym katalogu.'
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
                        new Drive_Validate_FileName,
                        new Drive_Validate_DirNotExists(array(
                            'tableProvider' => $this->getDriveHelper()->getTableProvider(),
                            'parentId' => $dir->dir_id
                        )),
                    ),
                    'attribs'    => array(
                        'autocomplete' => 'off',
                    ),
                ),
            ),
        );

        $this->_form = new Zefram_Form(array('elements' => $elements));
        $this->_dir = $dir;
        $this->_dirContext = $dir_context;
    } // }}}

    protected function _process() // {{{
    {
        $user = $this->getSecurityContext()->getUser();

        $data = $this->_form->getValues();
        $data['created_by']  = $user->getId();
        $data['modified_by'] = $user->getId();
        $data['owner']       = $user->getId();
        $data['drive_id']    = $this->_dir->drive_id;
        $data['parent_id']   = $this->_dir->dir_id;

        $mapper = $this->getDriveHelper()->getMapper();

        $subdir = $mapper->createDir($data);
        $subdir = $mapper->saveDir($subdir);

        $result = $this->getDriveHelper()->getViewableData($subdir, true);
        $result['dir_id'] = (string) $this->_dirContext->copy()->setDirId($subdir->dir_id);

        $response = $this->_helper->ajaxResponse();
        $response->setData(array(
            'dir' => $result,
        ));
        $response->sendAndExit();
    } // }}}
}
