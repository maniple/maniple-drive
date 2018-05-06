<?php

class ManipleDrive_FileIndexer_NullIndex implements Maniple_Search_WritableIndexInterface
{
    public function search($query, $limit = null, $offset = null)
    {
        return (object) array(
            'hitCount'      => 0,
            'totalHitCount' => 0,
            'hits'          => array(),
        );
    }

    public function getFieldQuery($field, $value = null)
    {
        return null;
    }

    public function insert(Maniple_Search_DocumentInterface $document)
    {
        return $this;
    }

    public function delete(Maniple_Search_FieldInterface $field)
    {
        return $this;
    }

    public function rebuild()
    {
        return $this;
    }
}
