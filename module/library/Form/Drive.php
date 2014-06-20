<?php

class Drive_Form_Drive extends Zefram_Form
{
    protected $_drive;

    public function __construct(array $options = array())
    {
        $tableProvider = null;
        if (isset($options['tableProvider'])) {
            $tableProvider = $options['tableProvider'];
            unset($options['tableProvider']);
        }

        $userMapper = null;
        if (isset($options['userMapper'])) {
            $userMapper = $options['userMapper'];
            unset($options['userMapper']);
        }

        $options['elements'] = array(
                'name' => array(
                    'type' => 'text',
                    'options' => array(
                        'label'       => 'Nazwa',
                        'required'    => true,
                        'validators'  => array(
                            new Drive_Validate_FileName,
                            new Drive_Validate_DirNotExists(array(
                                // uzyj domyslnego adaptera
                                'tableProvider' => $tableProvider,
                                'parentId' => null,
                                'messages' => array(
                                    Drive_Validate_DirNotExists::DIR_EXISTS => 'Dysk o podanej nazwie już istnieje',
                                ),
                            )),
                        ),
                        'filters'     => array('StringTrim'),
                    ),
                ),
                'quota' => array(
                    'type' => 'text',
                    'options' => array(
                        'label'      => 'Rozmiar dysku (MiB)',
                        'validators' => array('Digits'),
                    ),
                ),
                'owner' => array(
                    'type' => 'text',
                        'options' => array(
                            'label' => 'Wybierz właściciela dysku',
                            'required' => true,
                            'validators' => array(
                                array(
                                    new Core_Validate_UserId(array(
                                        'userMapper' => $userMapper,
                                    )),
                                    true,
                                ),
                            ),
                        ),
                ),
                'description' => array(
                    'type' => 'textarea',
                    'options' => array(
                        'label'       => 'Opis',
                        'rows'        => 3,
                        'filters'     => array('StringTrim'),
                        'description' => 'Opcjonalny opis przeznaczenia dysku.',
                    ),
                ),
        );

        parent::__construct($options);
    }

    public function getValues()
    {
        $values = parent::getValues();
        $values['quota'] = $this->getValue('quota');
        return $values;
    }

    public function getValue($name)
    {
        if ('quota' == $name) {
            // przelicz ograniczenie na rozmiar dysku z MiB na bajty
            return 1048576 * $this->getElement('quota')->getValue();
        }

        return parent::getValue($name);
    }

    public function getDrive()
    {
        return $this->_drive;
    }

    public function setDrive(Drive_Model_Drive $drive)
    {
        $defaults = $drive->toArray();
        $defaults['name'] = $drive->getName();

        $this->setDefaults($defaults);

        // ograniczenie rozmiaru dysku jest prezentowane w formularzu
        // w MiB, zapisywane do bazy w bajtach, stad koniecznosc konwersji
        $this->setDefault('quota', intval($drive->quota / 1048576));

        $this->getElement('name')
             ->getValidator('Drive_Validate_DirNotExists')
             ->setAllowed($drive->getName());

        $this->_drive = $drive;
    }
}
