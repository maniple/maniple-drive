<?php

class ManipleDrive_Bootstrap extends Maniple_Application_Module_Bootstrap
{
    protected $_moduleDeps = array('maniple-core');

    public function getAssetsBaseDir()
    {
        return 'drive';
    }

    public function getRoutesConfig()
    {
        return require dirname(__FILE__) . '/configs/routes.config.php';
    }

    public function getResourcesConfig()
    {
        return array(
            'drive.helper' => array(
                'class' => 'ManipleDrive_Helper',
                'options' => array(
                    'view'            => 'resource:view',
                    'securityContext' => null,
                    'tableProvider'   => null,
                    'userMapper'      => null,
                    'userSearchRoute' => null,
                ),
            ),
            'drive.file_indexer' => array(
                'class' => 'ManipleDrive_FileIndexer',
                'options' => array(
                    'indexFactory' => array(
                        'class' => 'Maniple_Search_Lucene_IndexFactory',
                        'options' => array(
                            'storageDir' => APPLICATION_PATH . '/../variable/search',
                        ),
                    ),
                    'stemmer' => array(
                        'class' => 'Maniple_Search_Stemmer_PorterStemmer',
                    ),
                ),
            ),
        );
    }
}
