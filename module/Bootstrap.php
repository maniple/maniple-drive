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
                    'index' => array(
                        'class' => 'Maniple_Search_Lucene_Index',
                        'args' => array(
                            'path' => APPLICATION_PATH . '/../variable/search/drive.file_index',
                            'analyzer' => array(
                                'class' => 'Zefram_Search_Lucene_Analysis_Analyzer',
                                'args' => array(
                                    'options' => array(
                                        'encoding' => 'UTF-8',
                                        'filters' => array(
                                            // 'lowerCase' => true,
                                            'stopWords' => '',
                                            'stemmer' => 'Maniple_Search_Stemmer_PorterStemmer',
                                        ),
                                    ),
                                ),
                            ),
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
