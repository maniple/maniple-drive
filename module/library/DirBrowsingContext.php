<?php

/**
 * Objects of this class provide a way to pass directory ID along with its
 * browsing context: dir ID, pseudo-root and its mounting point.
 */
class ManipleDrive_DirBrowsingContext
{
    /**
     * @var string
     */
    protected $_dirId;

    /**
     * @var string
     */
    protected $_pseudoRoot;

    /**
     * @var string
     */
    protected $_mount;

    /**
     * Constructor.
     *
     * @param  string|ManipleDrive_DirBrowsingContext $dirId
     * @param  string|null $pseudoRoot
     * @param  string|null $mount
     */
    public function __construct($dirId, $pseudoRoot = null, $mount = null) // {{{
    {
        if ($dirId instanceof self) {
            $this->setFromContext($dirId);
        } else {
            $this->setDirId($dirId);
            $this->setPseudoRoot($pseudoRoot);
            $this->setMount($mount);
        }
    } // }}}

    /**
     * @param  string|null $dirId
     * @return ManipleDrive_DirBrowsingContext
     */
    public function setDirId($dirId) // {{{
    {
        $dirId = trim($dirId);
        if (!strlen($dirId)) {
            throw new InvalidArgumentException('Dir ID must not be empty');
        }
        $this->_dirId = $dirId;
        return $this;
    } // }}}

    /**
     * @return string|null
     */
    public function getDirId() // {{{
    {
        return $this->_dirId;
    } // }}}

    /**
     * @param  string|null $pseudoRoot
     * @return ManipleDrive_DirBrowsingContext
     */
    public function setPseudoRoot($pseudoRoot = null) // {{{
    {
        $pseudoRoot = trim($pseudoRoot);
        $this->_pseudoRoot = strlen($pseudoRoot) ? $pseudoRoot : null;        
        return $this;
    } // }}}

    /**
     * @return string|null
     */
    public function getPseudoRoot() // {{{
    {
        return $this->_pseudoRoot;
    } // }}}

    /**
     * @param  string|null $mount
     * @return ManipleDrive_DirBrowsingContext
     */
    public function setMount($mount = null) // {{{
    {
        $mount = trim($mount);
        $this->_mount = strlen($mount) ? $mount : null;
        return $this;
    } // }}}

    /**
     * @return string|null
     */
    public function getMount() // {{{
    {
        return $this->_mount;
    } // }}}

    /**
     * @param  ManipleDrive_DirBrowsingContext $context
     * @return ManipleDrive_DirBrowsingContext
     */
    public function setFromContext(ManipleDrive_DirBrowsingContext $context) // {{{
    {
        $this->setDirId($context->getDirId());
        $this->setPseudoRoot($context->setPseudoRoot());
        $this->setMount($context->getMount());
        return $this;
    } // }}}

    /**
     * Return textual representation of this descriptor.
     *
     * @return string
     */
    public function toString() // {{{
    {
        $parts = array($this->getDirId());

        if (null !== ($mount = $this->getMount())) {
            array_unshift($parts, $mount);
        }

        if (null !== ($pseudoRoot = $this->getPseudoRoot())) {
            array_unshift($parts, $pseudoRoot);
        }


        return implode(':', $parts);
    } // }}}

    /**
     * Proxy to {@link toString()}.
     *
     * @return string
     */
    public function __toString() // {{{
    {
        return $this->toString();
    } // }}}

    /**
     * Create a copy of this object.
     *
     * @return ManipleDrive_DirBrowsingContext
     */
    public function copy() // {{{
    {
        return clone $this;
    } // }}}

    /**
     * Proxy to {@link __construct()}.
     *
     * @return ManipleDrive_DirBrowsingContext
     */
    public static function create() // {{{
    {
        $args = func_get_args();

        switch (count($args)) {
            case 0:
                return new self();

            case 1:
                return new self($args[0]);

            case 2:
                return new self($args[0], $args[1]);

            default:
                return new self($args[0], $args[1], $args[2]);
        }
    } // }}}

    /**
     * @param  string $string
     * @return ManipleDrive_DirBrowsingContext
     */
    public static function createFromString($string) // {{{
    {
        $pseudoRoot = $mount = $dirId = null;
        $parts = explode(':', $string);

        switch (count($parts)) {
            case 1:
                list($dirId) = $parts;
                break;

            case 2:
                list($pseudoRoot, $dirId) = $parts;
                break;

            default:
                list($pseudoRoot, $mount, $dirId) = $parts;
                break;
        }

        return new self($dirId, $pseudoRoot, $mount);
    } // }}}
}
