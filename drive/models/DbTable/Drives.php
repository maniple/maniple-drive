<?php

class Drive_Model_DbTable_Drives extends Zefram_Db_Table
{
    protected $_name = 'drives';
    protected $_rowClass = 'Drive_Model_Drive';
    protected $_referenceMap = array(
        'RootDir' => array(
            'columns'       => 'root_dir',
            'refTableClass' => 'Drive_Model_DbTable_Dirs',
            'refColumns'    => 'dir_id',
        ),
        'Dir' => array(
            'columns'       => 'root_dir',
            'refTableClass' => 'Drive_Model_DbTable_Dirs',
            'refColumns'    => 'dir_id',
        ),
        'Owner' => array(
            'columns'       => 'owner',
            'refTableClass' => 'Model_Core_Users',
            'refColumns'    => 'user_id',
        ),
        'Creator' => array(
            'columns'       => 'created_by',
            'refTableClass' => 'Model_Core_Users',
            'refColumns'    => 'user_id',
        ),
    );

    /**
     * @param string|Drive_Model_File $file
     * @param bool $check
     * @return false|string
     */
    public function getFilePath($file, $check = true) // {{{
    {
        if ($file instanceof Drive_Model_File) {
            $md5 = (string) $file->md5sum;
        } else {
            $md5 = (string) $file;
        }

        if (32 != strlen($md5) || !ctype_xdigit($md5)) {
            return false;
        }

        $path = Drive_FileStorage::requireStorageDir('drive') . substr($md5, 0, 2)
              . '/' . substr($md5, 2);

        if ($check && !is_file($path)) {
            return false;
        }

        return $path;
    } // }}}

    /**
     * @param string $md5
     * @return bool
     */
    public function prepareFilePath($md5) // {{{
    {
        // roznica w stosunku do getFilePath() jest taka, ze utworzony zostaje
        // katalog nazwany pierwszymi dwoma literami sumy MD5
        $path = Drive_FileStorage::requireStorageDir('drive/' . substr($md5, 0, 2))
              . substr($md5, 2);

        return $path;
    } // }}}

    /**
     * FIXME chyba fetchFileByPath
     * Znajdz plik opisywany sciezka znajdujacy sie w obrebie
     * podanego dysku.
     *
     * @param int $drive_id
     * @param string $path
     * @return Drive_Model_File
     */
    public function fetchByPath($drive, $path, $block_size = 5)
    {
        if (!$drive instanceof Drive_Model_Drive) {
            if (!($drive = $this->findRow((int) $drive))) {
                return false;
            }
        }

        $db = $this->getAdapter();

        $parts  = explode('/', trim(str_replace('\\', '/', $path), '/'));
        $result = false;

        if (count($parts)) {
            $dirs = $this->getTable('Drive_Model_DbTable_Dirs')->getQuotedName();

            // lista identyfikatorow napotkanych katalogow
            $id_path = array();

            // ostatni element sciezki moze byc plikiem, wiec analizujemy
            // wszystkie elementy sciezki z wyjatkiem ostatniego
            $last_part = $db->quote(array_pop($parts));

            // analizujemy blokami robiac INNER JOINa - tak najszybciej
            // wylapiemy niepoprawne nazwy katalogow
            // d0 jest startowym katalogiem sciezki w bloku, katalog startowy
            // w pierwszym bloku ma byc korzeniem dysku
            $d0_parent_id = $db->quote($drive->root_dir);

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

            $result = $this->getTable('Drive_Model_DbTable_Files')
                ->fetchRow("name = $last_part AND dir_id = $d0_parent_id");
        }

        return $result;
    }
}
