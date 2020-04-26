<?php

class ManipleDrive_Menu_MenuBuilder implements Maniple_Menu_MenuBuilderInterface
{
    const className = __CLASS__;

    /**
     * @Inject
     * @var ManipleUser_Service_Security
     */
    protected $_securityContext;

    public function buildMenu(Maniple_Menu_Menu $menu)
    {
        if ($menu->getName() !== 'maniple.primary') {
            return;
        }

        if (!$this->_securityContext->isSuperUser()) {
            return;
        }

        $menu->addPage(array(
            'label' => 'Drive management',
            'route' => 'drive.drives',
            'type'  => 'mvc',
        ));
    }
}
