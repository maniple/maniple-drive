<?php

class ManipleDrive_BrowseController extends ManipleDrive_Controller_Action
{
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

    public function indexAction()
    {
        $this->view->uri_templates = array(
            'dir' => array(
                'read'   => $this->_helper->urlTemplate('drive.browse'),
                'create' => $this->_helper->urlTemplate('drive.dir', array('action' => 'create')),
                'remove' => $this->_helper->urlTemplate('drive.dir', array('action' => 'remove')),
                'rename' => $this->_helper->urlTemplate('drive.dir', array('action' => 'rename')),
                'share'  => $this->_helper->urlTemplate('drive.dir', array('action' => 'share')),
                'move'   => $this->_helper->urlTemplate('drive.dir', array('action' => 'move')),
                'chown'  => $this->_helper->urlTemplate('drive.dir', array('action' => 'chown')),
                'upload' => $this->_helper->urlTemplate('drive.dir', array('action' => 'upload')),
            ),
            'file' => array(
                'read'   => $this->_helper->urlTemplate('drive.file', array('action' => 'read')),
                'edit'   => $this->_helper->urlTemplate('drive.file', array('action' => 'edit')),
                'remove' => $this->_helper->urlTemplate('drive.file', array('action' => 'remove')),
                'rename' => $this->_helper->urlTemplate('drive.file', array('action' => 'rename')),
                'move'   => $this->_helper->urlTemplate('drive.file', array('action' => 'move')),
                'chown'  => $this->_helper->urlTemplate('drive.file', array('action' => 'chown')),
            ),
        );

        try {
            $locale = preg_replace('/\\..+$/', '', $this->getResource('locale'));
        } catch (Exception $e) {}
        if (empty($locale)) {
            $locale = 'en_GB';
        }
        $this->view->locale = $locale;

        $userSearchRoute = (string) $this->_driveHelper->getUserSearchRoute();
        if ($userSearchRoute) {
            $this->view->user_search_url = $this->view->url($userSearchRoute);
        }

        // dir instance can be passed via forward() calls
        $dir = $this->getParam('dir');
        $this->view->dir = $dir instanceof ManipleDrive_Model_DirInterface ? $dir : null;
    }

    public function browseAction()
    {
        $files_only = $this->getScalarParam('files-only');

        $filter = $this->getScalarParam('filter');
        $inverse_filter = false;

        if (0 === strncmp('!', $filter, 1)) {
            $inverse_filter = true;
            $filter = substr($filter, 1);
        }

        $options = array(
            'filesOnly'     => (bool) $files_only,
            'filter'        => $filter,
            'inverseFilter' => $inverse_filter,
        );

        $currentUser = $this->getSecurityContext()->getUser();
        $dirBrowser = new ManipleDrive_DirBrowser($this->_driveHelper, $currentUser ? $currentUser->getId() : null);

        $path = $this->getScalarParam('path');

        if (null === $path) {
            $this->assertAccess($this->getSecurityContext()->isAuthenticated());

            $drive = $this->_db->getTable(ManipleDrive_Model_DbTable_Drives::className)
                ->fetchRow(array('owner = ?' => $this->getSecurityContext()->getUser()->getId()), 'drive_id');
            if (empty($drive)) {
                throw new Exception('Drive was not found');
            }
            $dir = $drive->RootDir;
            if (empty($dir)) {
                throw new Exception('Dir not found');
            }
            $result = $dirBrowser->browseDir($dir, null, $options);
        } else {
            $result = $dirBrowser->browse($path, $options);
        }

        $response = $this->_helper->ajaxResponse();
        $response->setData($result);
        $response->sendAndExit();
    }
}
