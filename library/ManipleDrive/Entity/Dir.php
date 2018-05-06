<?php

/**
 * @Entity
 * @Table(name="drive_dirs")
 */
class ManipleDrive_Entity_Dir
{
    /**
     * @Id
     * @Column(name="dir_id", type="integer")
     * @GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @Column(name="name", type="string", length=255)
     */
    protected $name;

    /**
     * @Column(name="internal_name", type="string", length=255)
     */
    protected $internalName;

}
