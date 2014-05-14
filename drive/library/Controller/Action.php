<?php

abstract class Drive_Controller_Action extends Maniple_Controller_Action
{
    public function getTable($table)
    {
        return $this->getResource('db.table_provider')->getTable($table);
    }

    public function getSecurity()
    {
        return $this->getResource('security');
    }
}
