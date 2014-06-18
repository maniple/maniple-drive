<?php

class Drive_DirBrowser
{
    /**
     * @var int
     */
    protected $_userId;

    public function __construct($driveHelper, $userId = null) // {{{
    {
        $this->_driveHelper = $driveHelper;

        if (null !== $userId) {
            $this->_userId = (int) $userId;
        }
    } // }}}

    /**
     * @param  string $path
     * @return array
     */
    public function browse($path, array $options = null) // {{{
    {
        $lookup = $this->dirLookup($path);
        $dir = array_pop($lookup);

        return $this->browseDir($dir, $lookup, $options);
    } // }}}

    /**
     * @param  Drive_Model_DirInterface $dir
     * @param  Drive_Model_DirInterface[] $parents
     * @return array
     */
    public function browseDir(Drive_Model_DirInterface $dir, array $parents = null, array $options = null) // {{{
    {
        return $this->_driveHelper->browseDir2($dir, $parents, $options);
    } // }}}

    /**
     * @param  string $path
     * @return Drive_Model_DirInterface[]
     * @throws Drive_Exception_NotFoundException
     */
    public function dirLookup($path) // {{{
    {
        $segments = explode('/', trim($path, '/'));
        $segment = array_shift($segments);

        // get root dir according to the first segment
        switch ($segment) {
            case 'shared':
                if ($this->_userId) {
                    $dir = new Drive_Model_PseudoDir_SharedEntries(
                        $this->_userId,
                        $this->_driveHelper->getTableProvider()
                    );
                }
                break;

            case 'public':
                $dir = new Drive_Model_PseudoDir_DrivesWithPublicEntries(
                    $this->_driveHelper->getTableProvider()
                );
                break;

            default:
                $tableProvider = $this->_driveHelper->getTableProvider();
                // fetch root directory of given ID
                $select = Zefram_Db_Select::factory($tableProvider->getAdapter());
                $select->from(
                    array('dirs' => $tableProvider->getTable('Drive_Model_DbTable_Dirs'))
                );
                $select->join(
                    array('drives' => $tableProvider->getTable('Drive_Model_DbTable_Drives')),
                    'drives.root_dir = dirs.dir_id',
                    array()
                );
                $select->where('dir_id = ?', (int) $segment);

                $dir = $tableProvider->getTable('Drive_Model_DbTable_Dirs')->fetchRow($select);
                break;
        }

        if (empty($dir)) {
            throw new Drive_Exception_NotFoundException('Path not found');
        }

        // move down the path to requested directory

        $lookup = array($dir);

        while ($segment = array_shift($segments)) {
            $dir = end($lookup)->getSubDir($segment);
            if (empty($dir)) {
                throw new Drive_Exception_NotFoundException('Path not found');
            }
            $lookup[] = $dir;
        }

        return $lookup;
    } // }}}
}
