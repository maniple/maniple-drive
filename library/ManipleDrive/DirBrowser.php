<?php

class ManipleDrive_DirBrowser
{
    /**
     * @var int
     */
    protected $_userId;

    /**
     * @var Zefram_Db
     */
    protected $_db;

    /**
     * @var ManipleDrive_Helper
     */
    protected $_driveHelper;

    public function __construct(ManipleDrive_Helper $driveHelper, $userId = null) // {{{
    {
        $this->_db = $driveHelper->getDb();
        $this->_driveHelper = $driveHelper;

        if (null !== $userId) {
            $this->_userId = (int) $userId;
        }
    } // }}}

    /**
     * @param  string $path
     * @param  array $options OPTIONAL
     * @return array
     */
    public function browse($path, array $options = null) // {{{
    {
        $lookup = $this->dirLookup($path);
        $dir = array_pop($lookup);

        return $this->browseDir($dir, $lookup, $options);
    } // }}}

    /**
     * @param  ManipleDrive_Model_DirInterface $dir
     * @param  ManipleDrive_Model_DirInterface[] $parents
     * @param  array $options
     * @return array
     */
    public function browseDir(ManipleDrive_Model_DirInterface $dir, array $parents = null, array $options = null) // {{{
    {
        return $this->_driveHelper->browseDir2($dir, $parents, $options);
    } // }}}

    /**
     * @param  string $path
     * @return ManipleDrive_Model_DirInterface[]
     * @throws ManipleDrive_Exception_NotFoundException
     */
    public function dirLookup($path) // {{{
    {
        $segments = explode('/', trim($path, '/'));
        $segment = array_shift($segments);

        // get root dir according to the first segment
        switch ($segment) {
            case 'shared':
                if ($this->_userId) {
                    $dir = new ManipleDrive_Model_PseudoDir_SharedEntries(
                        $this->_userId,
                        $this->_db
                    );
                }
                break;

            case 'public':
                $dir = new ManipleDrive_Model_PseudoDir_DrivesWithPublicEntries(
                    $this->_db
                );
                break;

            default:
                $dir = $this->_driveHelper->getRepository()->getDir($segment);
                break;
        }

        if (empty($dir)) {
            throw new ManipleDrive_Exception_NotFoundException('Path not found');
        }

        // move down the path to requested directory

        $lookup = array($dir);

        while ($segment = array_shift($segments)) {
            $dir = end($lookup)->getSubDir($segment);
            if (empty($dir)) {
                throw new ManipleDrive_Exception_NotFoundException('Path not found');
            }
            $lookup[] = $dir;
        }

        return $lookup;
    } // }}}
}
