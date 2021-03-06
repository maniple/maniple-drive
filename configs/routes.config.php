<?php return array(
    'drive.js_bundle' => array(
        'route' => '^drive/bundle.([_a-zA-Z]{2,5}).js$',
        'type'  => 'Zend_Controller_Router_Route_Regex',
        'map' => array(
            'locale' => 1,
        ),
        'reverse' => 'drive/bundle.%s.js',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'index',
            'action'     => 'js-bundle',
        ),
    ),
    'drive.dashboard' => array(
        'route' => 'drive',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'index',
            'action'     => 'dashboard',
        ),
    ),
    'drive.drives' => array(
        'route' => 'drive/drives',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'drive',
            'action'     => 'admin',
        ),
    ),
    'drive.drive' => array(
        'route' => 'drive/:drive_id/:action',
        'reqs' => array(
            'drive_id' => '\\d+',
        ),
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'drive',
            'action'     => null,
        ),
    ),
    'drive.drive.edit' => array(
        'route' => 'drive/:drive_id/edit',
        'reqs' => array(
            'drive_id' => '\\d+',
        ),
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'drive',
            'action'     => 'edit',
        ),
    ),
    'drive.browser' => array(
        'route' => '^drive/browser(\\#(.*))?$',
        'type'  => 'Zend_Controller_Router_Route_Regex',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'browse',
            'action'     => 'index',
        ),
        'map' => array(
            'path' => 2,
        ),
        'reverse' => 'drive/browser#%s',
    ),
    'drive.browse' => array(
        'route' => 'drive/browse',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'browse',
            'action'     => 'browse',
        ),
    ),
    'drive.dir' => array(
        'route' => 'drive/dir/:dir_id/:action',
        'reqs' => array(
            'dir_id' => '^(\\d+)|([a-zA-Z]+)|([a-zA-Z]:\\d+(:\\d+)?)$',
        ),
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'dir',
            'action'     => 'index',
            'dir_id'     => null,
        ),
    ),
    'drive.dir.create' => array(
        'route' => '^drive/dir/(?P<dir_id>\\d+)/create/(?P<path>.*)$',
        'type'  => 'Zend_Controller_Router_Route_Regex',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'dir',
            'action'     => 'create',
        ),
        'map' => array(
            'dir_id' => 1,
            'path'   => 2,
        ),
        'reverse' => 'drive/dir/%s/create/%s',
    ),
    'drive.file' => array(
        'route' => 'drive/file/:file_id/:action',
        'reqs' => array(
            'file_id' => '(\\d+)|([0-9A-Za-z]{32})',
        ),
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'file',
            'action'     => 'read',
        ),
    ),
    'drive.file.thumb' => array(
        'route' => 'drive/file/:file_id/thumb/:dims',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'file',
            'action'     => 'thumb',
            'dims'       => null,
        ),
    ),
    'drive.file.image' => array(
        'route' => 'drive/file/:file_id/image/:scale',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'index',
            'action'     => 'image',
            'scale'      => null,
        ),
    ),
    'drive.dir.zipped' => array(
        'route' => 'drive/dir/:dir_id/zipped',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'index',
            'action'     => 'dir-zipped',
        ),
    ),
/*
[drive_dir]
route = "drive/dir/:id"
reqs.id = "\d+"
defaults.module     = drive
defaults.controller = dir
defaults.action     = index

[drive_file]
route = "drive/file/:id"
reqs.id = "\d+|[0-9a-f]{32}"
defaults.module     = drive
defaults.controller = file
defaults.action     = index

[drive_file_upload]
route = "drive/file/upload/:dir"
defaults.module     = drive
defaults.controller = file
defaults.action     = upload
defaults.dir        =

[drive_file_image]
route = "drive/file/image/:file_id/:d"
defaults.module     = drive
defaults.controller = file
defaults.action     = image
defaults.file_id    =
defaults.d          =
; }}}*/
    'drive.files.search' => array(
        'route' => 'drive/files/search',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'file',
            'action'     => 'search',
        ),
    ),
    'drive.files.view_public' => array(
        'route' => '^!(?<path>([^/]+)(.*))$',
        'type'  => 'Zend_Controller_Router_Route_Regex',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'index',
            'action'     => 'file',
        ),
        'map' => array(
            'path'  => 1,
        ),
        'reverse' => '!%s',
    ),

    'drive.images.browse' => array(
        'route' => 'drive/images/browse/:dir_id',
        'defaults' => array(
            'module'     => 'maniple-drive',
            'controller' => 'image',
            'action'     => 'browse',
        ),
    ),
);
