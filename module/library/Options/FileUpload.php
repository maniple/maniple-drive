<?php

class ManipleDrive_Options_FileUpload
{
    /**
     * @var int
     */
    protected $_minSize = 100;

    /**
     * @var int
     */
    protected $_maxSize;

    /**
     * @var array
     */
    protected $_allowedMimeTypes;


    /**
     * @param array|Traversable $allowedMimeTypes
     * @return $this
     */
    public function setAllowedMimeTypes($allowedMimeTypes)
    {
        $_allowedMimeTypes = array();
        foreach ($allowedMimeTypes as $mimeType) {
            $_allowedMimeTypes[] = (string) $mimeType;
        }
        $this->_allowedMimeTypes = $_allowedMimeTypes;
        return $this;
    }

    /**
     * @return array
     */
    public function getAllowedMimeTypes()
    {
        return $this->_allowedMimeTypes;
    }

    /**
     * @param int $maxSize
     * @return $this
     * @throws InvalidArgumentException
     */
    public function setMaxSize($maxSize)
    {
        $maxSize = (int) $maxSize;
        if ($maxSize < 0) {
            throw new InvalidArgumentException('Invalid maximum file size value');
        }
        $this->_maxSize = $maxSize;
        return $this;
    }

    /**
     * @return int
     */
    public function getMaxSize()
    {
        return $this->_maxSize;
    }

    /**
     * @param int $minSize
     * @return $this
     * @throws InvalidArgumentException
     */
    public function setMinSize($minSize)
    {
        $minSize = (int) $minSize;
        if ($minSize < 0) {
            throw new InvalidArgumentException('Invalid minimum file size value');
        }
        $this->_minSize = $minSize;
        return $this;
    }

    /**
     * @return int
     */
    public function getMinSize()
    {
        return $this->_minSize;
    }
}