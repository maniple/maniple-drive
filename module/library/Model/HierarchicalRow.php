<?php

class ManipleDrive_Model_HierarchicalRow extends Zefram_Db_Table_Row
{
    const SQL_WILDCARD = '*';

    protected $_tableClass   = 'Zefram_Db_Table';
    protected $_parentColumn = 'parent_id';
    protected $_idColumn     = 'id';

    /**
     * @return int
     */
    public function countChildren($where = null) // {{{
    {
        $where  = $this->_childWhereCondition($where);
        $select = $this->getTable()
                 ->select(new Zend_Db_Expr('COUNT(*) AS cnt'))
                 ->where($where);
        $row = $select->fetchRow();

        return intval($row['cnt']);
    } // }}}

    /**
     * @return Zend_Db_Table_Rowset
     */
    public function fetchChildren($where = null, $order = null) // {{{
    {
        $where = $this->_childWhereCondition($where);
        return $this->getTable()->fetchAll($where, $order);
    } // }}}

    public function findChild($id)
    {
        $db = $this->getTable()->getAdapter();
        $where = $this->_childWhereCondition(array(
             $db->quoteIdentifier($this->_idColumn) . ' = ?' => (int) $id,
        ));
        return $this->getTable()->fetchRow($where);
    }

    /**
     * @return array
     */
    public function fetchChildrenAsArray($where = null, $order = null) // {{{
    {
        $where = $this->_childWhereCondition($where);
        return $this->getTable()->fetchAllAsArray($where, $order);
    } // }}}

    /**
     * @return array
     */
    protected function _childWhereCondition($where = null) // {{{
    {
        $db = $this->getTable()->getAdapter();
        $id = $this->{$this->_idColumn};

        $where = array_merge((array) $where, array(
            $db->quoteIdentifier($this->_parentColumn) . ' = ?' => $id,
            $db->quoteIdentifier($this->_idColumn) . ' <> ?' => $id,
        ));

        return $where;
    } // }}}

    /**
     * Fetches parent row from database.
     *
     * @throws App_Exception_DataIntegrityViolation  if parent row was not found
     * @return null|ManipleDrive_Model_HierarchicalRow             parent row
     */
    public function fetchParent() // {{{
    {
        $parent_id = $this->{$this->_parentColumn};

        if ($parent_id) {
            if ($parent_id == $this->{$this->_idColumn}) {
                throw new ManipleDrive_Model_HierarchicalRow_Exception('Circular record dependency');
            }

            $parent = $this->getTable()->findRow($parent_id);

            if (!$parent) {
                throw new ManipleDrive_Model_HierarchicalRow_Exception("Parent record not found ($parent_id)");
            }

            return $parent;
        }

        return null;
    } // }}}

    /**
     * @return Zend_Db_Table_Rowset
     */
    public function fetchParents() // {{{
    {
        $parents = array();
        $parent_id = $this->{$this->_parentColumn};

        if ($parent_id) {
            $table = $this->getTable();
            $queue = array($parent_id);

            while ($queue) {
                $parent_id = intval(array_shift($queue));
                if (isset($parents[$parent_id])) {
                    throw new ManipleDrive_Model_HierarchicalRow_Exception('Circular record dependency');
                }

                $row = $table->findRow($parent_id);
                if (!$row) {
                    throw new ManipleDrive_Model_HierarchicalRow_Exception("Parent record not found ($parent_id)");
                }

                // for cycle detection purpose index fetched rows by their id
                $parents[$row->{$this->_idColumn}] = $row;

                if ($row->{$this->_parentColumn}) {
                    $queue[] = $row->{$this->_parentColumn};
                }
            }
        }

        return $parents;
    } // }}}

    /**
     * Pobiera iz bazy liste wszystkich przodkow tego watku,
     * w kolejnosci od bezposredniego ojca do korzenia drzewa.
     *
     * @param string|array $columns     lista kolumn ktore maja byc pobrane
     * @param array
     */
    public function fetchParentsAsArray($columns = self::SQL_WILDCARD) // {{{
    {
        if ($columns != self::SQL_WILDCARD) {
            // wsrod kolumn wynikowych musza znalezc sie id i parent_id
            $columns = array_merge((array) $columns, array($this->_idColumn, $this->_parentColumn));
            $columns = array_flip(array_flip($columns));
        }

        $parents = array();
        $parent_id = $this->{$this->_parentColumn};

        if ($parent_id) {
            $table  = $this->getTable();
            $db     = $table->getAdapter();

            $select = $table
                      ->select($columns)
                      ->where($db->quoteIdentifier($this->_idColumn) . ' = ?');

            $queue  = array($parent_id);

            while ($queue) {
                $parent_id = intval(array_shift($queue));

                if (isset($parents[$parent_id])) {
                    throw new ManipleDrive_Model_HierarchicalRow_Exception('Circular record dependency');
                }

                $row = $db->fetchRow($select->bind($parent_id));
                if (!$row) {
                    throw new ManipleDrive_Model_HierarchicalRow_Exception("Parent record not found ($parent_id)");
                }

                $parents[$row[$this->_idColumn]] = $row;

                if ($row[$this->_parentColumn]) {
                    $queue[] = $row[$this->_parentColumn];
                }
            }
        }

        return $parents;
    } // }}}

    /**
     * @param null|int|ManipleDrive_Model_HierarchicalRow $parent
     */
    public function isValidParent($parent)
    {
        if (null === $parent) {
            return true;
        }

        if (!$parent instanceof self) {
            $parent = $this->getTable()->findRow($parent);
        }

        if (!$parent) {
            return false;
        }

        // rekord rodzic nie moze znajdowac sie w poddrzewie tego rekordu.
        // Sprawdzenie polega na przejsciu drzewa od nowego rodzica do
        // korzenia drzewa. Rekord rodzica jest niepoprawny, jezeli zostanie
        // znaleziony rekord o takim samym identyfikatorze jak ten rekord.
        $id = $this->{$this->_idColumn};
        do {
            if ($parent->{$this->_idColumn} == $id) {
                return false;
            }
            $parent = $parent->fetchParent();

        } while ($parent);

        return true;
    }

    public function save() // {{{
    {
        if (!$this->isValidParent($this->{$this->_parentColumn})) {
            throw new ManipleDrive_Model_HierarchicalRow_Exception('Invalid parent record specified');
        }

        return parent::save();
    } // }}}
}
