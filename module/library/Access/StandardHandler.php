<?php

class ManipleDrive_Access_StandardHandler implements ManipleDrive_Access_HandlerInterface
{
    /**
     * @var ManipleDrive_Access_Manager
     */
    protected $_accessManager;

    /**
     * @param ManipleDrive_Access_Manager $accessManager
     */
    public function __construct(ManipleDrive_Access_Manager $accessManager)
    {
        $this->_accessManager = $accessManager;
    }

    public function canHandleType($type)
    {
        return true;
    }

    public function getAccess(ManipleDrive_Model_EntryInterface $entry, $user)
    {
        if ($this->_accessManager->isSuperUser($user)) {
            // super user has the same access level as owner
            $owner = true;

        } else {
            // directory owner has read/write access
            // ownership is recursive, it means that child directory is owned
            // by all owners of parent directories on the path to the root dir
            $owner = false;

            if ($user) {
                $dirs = array($entry);
                while ($d = array_shift($dirs)) {
                    if ($d->getOwner() && (int) $d->getOwner() === (int) $user) {
                        $owner = true;
                        break;
                    }
                    $parent = $d->getParent();
                    if ($parent) {
                        $dirs[] = $parent;
                    }
                }
            }
        }

        // owner has all permissions
        if ($owner) {
            $access = ManipleDrive_Access_Access::ACCESS_READ
                    | ManipleDrive_Access_Access::ACCESS_WRITE
                    | ManipleDrive_Access_Access::ACCESS_SHARE;

            // root-level directories can be renamed and deleted only by super users
            if ($entry->getParent() || $this->_accessManager->isSuperUser($user)) {
                $access |= ManipleDrive_Access_Access::ACCESS_RENAME
                        | ManipleDrive_Access_Access::ACCESS_DELETE;
            }

            // BC
            if (@$entry->is_system ||
                @$entry->system_count ||
                (method_exists($entry, 'isInternal') && $entry->isInternal())
            ) {
                $access &= ~ManipleDrive_Access_Access::ACCESS_DELETE;
            }

            return $access;
        }

        if (!$entry instanceof ManipleDrive_Model_DirInterface) {
            $dir = $entry->getParent();
        } else {
            $dir = $entry;
        }

        // owner has access to all files in the subtree, this prevents from
        // situations when in shared directory other user created a private
        // directory
        $access = ManipleDrive_Access_Access::ACCESS_NONE;

        switch ($dir->getSharing()) {
            case ManipleDrive_Model_Sharing::SHARING_PRIVATE:
                break;

            case ManipleDrive_Model_Sharing::SHARING_USERS:
                // access for logged in users only
                if ($user) {
                    $access |= ManipleDrive_Access_Access::ACCESS_READ;
                }
                break;

            case ManipleDrive_Model_Sharing::SHARING_PUBLIC:
                $access |= ManipleDrive_Access_Access::ACCESS_READ;
                break;

            case ManipleDrive_Model_Sharing::SHARING_INHERITED:
            default:
                // inherited access from parent directory
                if ($dir->getParent()) {
                    $access |= $this->_accessManager->getAccess($dir->getParent(), $user);
                }
                break;
        }

        // check for access assigned explicitly via DirShares
        if ($user) {
            $access |= $this->_accessManager->getSharedAccess($dir, $user);
        }

        return $access;
    }
}