<?php

class ManipleDrive_DriveManager
{
    /**
     * @var ManipleDrive_Model_Repository
     */
    protected $_repository;

    /**
     * @var Maniple_Security_ContextInterface
     */
    protected $_securityContext;

    /**
     * @param  ManipleDrive_Model_Repository|Zefram_Db_Table_FactoryInterface $repository
     * @return void
     */
    public function __construct($repository, $securityContext) // {{{
    {
        if ($repository instanceof Zefram_Db_Table_FactoryInterface) {
            $repository = new ManipleDrive_Model_Repository($repository);
        }
        if (!$repository instanceof ManipleDrive_Model_Repository) {
            throw new InvalidArgumentException('Repository must be an instance of ManipleDrive_Model_Repository or a Zefram_Db_Table_FactoryInterface');
        }
        $this->_repository = $repository;
        $this->_securityContext = $securityContext;
    } // }}}

    /**
     * @param  ManipleDrive_Model_DirInterface|ManipleDrive_Model_File $dirEntry
     * @param  bool $systemContext OPTIONAL
     * @return bool
     * @throws InvalidArgumentException
     */
    public function isWritable($dirEntry, $systemContext = false)
    {
    }

    /**
     * @param  ManipleDrive_Model_DirInterface|ManipleDrive_Model_File $dirEntry
     * @param  bool $recursive OPTIONAL
     * @return ManipleDrive_Model_DirInterface|ManipleDrive_Model_File
     */
    public function copy($dirEntry, ManipleDrive_Model_DirInterface $targetDir, $recursive = true)
    {
        
    }
}
