<?php

/**
 * @deprecated
 * @method ManipleDrive_Model_Drive findRow(mixed $id)
 * @method ManipleDrive_Model_Drive createRow(array $data = array(), string $defaultSource = null)
 */
class ManipleDrive_Model_DbTable_Drives extends Zefram_Db_Table
{
    const className = __CLASS__;

    protected $_name = ManipleDrive_Model_TableNames::TABLE_DRIVES;

    protected $_rowClass = ManipleDrive_Model_Drive::className;

    protected $_referenceMap = array(
        'RootDir' => array(
            'columns'       => 'root_dir',
            'refTableClass' => ManipleDrive_Model_DbTable_Dirs::className,
            'refColumns'    => 'dir_id',
        ),
        'Dir' => array(
            'columns'       => 'root_dir',
            'refTableClass' => ManipleDrive_Model_DbTable_Dirs::className,
            'refColumns'    => 'dir_id',
        ),
        'Owner' => array(
            'columns'       => 'owner',
            'refTableClass' => ManipleUser_Model_DbTable_Users::className,
            'refColumns'    => 'user_id',
        ),
        'Creator' => array(
            'columns'       => 'created_by',
            'refTableClass' => ManipleUser_Model_DbTable_Users::className,
            'refColumns'    => 'user_id',
        ),
    );

    /**
     * @return ManipleDrive_DriveManager
     */
    protected function _getDriveManager()
    {
        return Zend_Controller_Front::getInstance()->getParam('bootstrap')->getResource(ManipleDrive_DriveManager::className);
    }

    /**
     * @param string|ManipleDrive_Model_File $file
     * @param bool $check
     * @return false|string
     * @deprecated
     */
    public function getFilePath($file, $check = true)
    {
        return $this->_getDriveManager()->getFilePath($file, $check);
    }

    /**
     * @param string $md5
     * @return bool
     * @deprecated
     */
    public function prepareFilePath($md5)
    {
        return $this->_getDriveManager()->prepareFilePath($md5);
    }

    /**
     * FIXME chyba fetchFileByPath
     * Znajdz plik opisywany sciezka znajdujacy sie w obrebie
     * podanego dysku.
     *
     * @param int $drive_id
     * @param string $path
     * @return ManipleDrive_Model_File
     */
    public function fetchByPath($drive, $path, $block_size = 5)
    {
        if ($drive instanceof ManipleDrive_Model_Dir) {
            $dir = $drive;
        } elseif (!$drive instanceof ManipleDrive_Model_Drive) {
            if (!($drive = $this->findRow((int) $drive))) {
                return false;
            }

            $dir = $drive->RootDir;
        }

        $db = $this->getAdapter();

        $parts  = explode('/', trim(str_replace('\\', '/', $path), '/'));
        $result = false;

        if (count($parts)) {
            $dirs = $this->_getTableFromString(ManipleDrive_Model_DbTable_Dirs::className)->getQuotedName();

            // lista identyfikatorow napotkanych katalogow
            $id_path = array();

            // ostatni element sciezki moze byc plikiem, wiec analizujemy
            // wszystkie elementy sciezki z wyjatkiem ostatniego
            $last_part = $db->quote(array_pop($parts));

            // analizujemy blokami robiac INNER JOINa - tak najszybciej
            // wylapiemy niepoprawne nazwy katalogow
            // d0 jest startowym katalogiem sciezki w bloku, katalog startowy
            // w pierwszym bloku ma byc korzeniem dysku
            $d0_parent_id = $db->quote($dir->getId());

            while (count($parts)) {
                $block  = array_splice($parts, 0, $block_size);
                $nblock = count($block);

                // przygotuj poczatek zapytania i liste kolumn do pobrania -
                // identyfikatorow kolejnych katalogow
                $query = '';
                for ($i = 0; $i < $nblock; ++$i) {
                    $query .= (empty($query) ? 'SELECT' : ',') . " d$i.dir_id AS id_$i";
                }
                $query .= " FROM $dirs d0";

                // alias poprzedniej tabeli, warunki dla pierwszej tabeli beda
                // w klauzuli WHERE na koncu zapytania
                $prev = 'd0';
                for ($i = 1; $i < $nblock; ++$i) {
                    // alias aktualnej tabeli
                    $curr = 'd' . $i;
                    $query .= " JOIN $dirs $curr ON $curr.parent_id = $prev.dir_id"
                            . " AND $curr.name = {$db->quote($block[$i])}";
                    $prev = $curr;
                }

                $query .= " WHERE d0.name = {$db->quote($block[0])}"
                        . " AND d0.parent_id = $d0_parent_id";

                // echo '<pre>' . $query . '</pre>';

                // spodziewany jest co najwyzej jeden wiersz, ze wzgledu na
                // UNIQUE (parent_id, name)
                if (!($row = $db->fetchRow($query))) {
                    // podano niepoprawna sciezke
                    return false;
                }

                // zapisz identyfikatory kolejnych katalogow w sciezce
                for ($i = 0; $i < $nblock; ++$i) {
                    $id_path[] = $row['id_' . $i];
                }

                // zapamietaj id ostatniego katalogu sciezki, bedzie on uzyty
                // jako id katalogu nadrzednego (parent_id) w pierwszym
                // katalogu nastepnego bloku. Od razu zapamietana jest wartosc
                // w postaci nadajacej sie do bezposredniego umieszczenia
                // w zapytaniu.
                $d0_parent_id = $db->quote($id_path[count($id_path) - 1]);
            }

            // po przetworzeniu tablicy parts d0_parent_id zawiera
            // identyfikator katalogu, w ktorym znajduje sie ostatni element
            // podanej sciezki (plik lub katalog).

            $result = $this->_getTableFromString(ManipleDrive_Model_DbTable_Files::className)
                ->fetchRow("name = $last_part AND dir_id = $d0_parent_id");
        }

        return $result;
    }
}
