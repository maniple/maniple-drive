var I18n = {
    Uploader: {
        noItems:                'No files to upload',
        filename:               'File',
        size:                   'Size',
        progress:               'Progress',
        waiting:                'Waiting',
        uploading:              'Waiting...',
        uploaded:               'Uploaded',
        canceled:               'Canceled',
        error:                  'Error',
        queuePaneTitle:         'File upload',
        openButtonText:         'Details',
        cleanButtonText:        'Clean',
        cleanButtonTooltip:     'Clear uploaded or canceled uploads',
        cancelButtonText:       'Hide',
        cancelButtonTooltip:    'Click to cancel',
        uploadSuccess:          'All files have been successfully uploaded',
        uploadError:            'File upload complete. There were errors',
        uploadProgress:         'Uploading file {number} of {total} ... {percent}%',
        dropHere:               'Drag and drop files here <small>Or click to add files</small>',
        dropHereOpera:          'Click to add files <small>Use Firefox or Chrome browser to add files using drag and drop</small>',
        dropHereLegacy:         'Click to add file <small>Use Firefox or Chrome browser to add more than one file at once and to add files using drag and dro</small>',
        responseError:          'Unexpected response from server',
        cancelUploadConfirm:    'Leaving this page will abort any pending file uploads. Are you sure you want to leave this page?'
    },
    DirBrowser: {
        submitLabel:            'Submit',
        cancelLabel:            'Cancel',
        loadingDirContents:     'Loading dir contents...',
        noItems:                'Directory is empty',
        moreOps:                'More',
        eipHint:                'Click to edit',
        clickToRenameTooltip:   'Click to rename directory',
        uploadFiles:            'Upload files',
        diskUsage: {
            used:               'Disk usage:',
            available:          'Available space:',
            unlimited:          'Unlimited'
        },
        grab: {
            tooltip:            'Drag and drop to move to a different directory',
            dropDirTooltip:     'Move <strong>{source}</strong> to <strong>{target}</strong>',
            noDropDirTooltip:   'Move <strong>{source}</strong>'
        },
        dirContents: {
            name:               'Name',
            owner:              'Owner',
            size:               'Size',
            mtime:              'Modified',
            noAuthor:           'No author / source',
            noDescription:      'No description'
        },
        opOpenDir: {
            opname:             'Open'
        },
        opCreateDir: {
            opname:             'New directory',
            title:              'New directory',
            submit:             'Apply',
            nameLabel:          'Directory name'
        },
        opRenameDir: {
            opname:             'Rename',
            title:              'Rename directory',
            submit:             'Apply',
            nameLabel:          'New directory name'
        },
        opRemoveDir: {
            opname:             'Remove',
            title:              'Remove directory',
            submit:             'Apply'
        },
        opDirDetails: {
            opname:             'Details',
            title:              'Directory details',
            submit:             'Done',
            name:               'Name',
            owner:              'Owner',
            mtime:              'Last modified',
            ctime:              'Created',
            timeSeparator:      'by'
        },
        opShareDir: {
            opname:             'Sharing',
            title:              'Share directory',
            submit:             'Save',
            visLabel:           'Visibility',
            visOptPrivate:      'Private',
            visOptUsersonly:    'Users only',
            visOptPublic:       'Public',
            visOptInherited:    'Inherited',
            visDescPrivate:     'Files in this directory are accessible only to me &ndash; the owner of this directory, and to users of my choosing.',
            visDescUsersonly:   'Files in this directory are accessible only to registered users.',
            visDescPublic:      'Files in this directory are accessible to anybody who knows their address.',
            visDescInherited:   'Access to files in this directory is the same as to the files in the parent directory.',
            aclLabel:           'Grant access permissions to selected users',
            aclRead:            'Read only',
            aclReadWrite:       'Read and write',
            aclNoUsers:         'No users selected',
            userSearch:         'Search for user',
            userAdd:            'Add',
            userDelete:         'Remove',
            searchHint:         'You can search for user by his/her name(s), email address or identifier.',
            messageSending:     'Sending, please wait...',
            messageError:       'Unexpected error',
            messageSuccess:     'Sharing settings have been saved successfully'
        },
        opOpenFile: {
            opname:             'Open'
        },
        opEditFile: {
            opname:             'Edit',
            title:              'Edit file metadata',
            submit:             'Save',
            messageSuccess:     'File metadate have been saved successfully'
        },
        opRenameFile: {
            opname:             'Rename',
            title:              'Zmiana nazwy pliku',
            submit:             'Zastosuj',
            nameLabel:          'Nowa nazwa pliku'
        },
        opRemoveFile: {
            opname:             'Remove',
            title:              'File removal',
            submit:             'Apply'
        },
        opFileDetails: {
            opname:             'Properties',
            title:              'File properties',
            submit:             'Done',
            name:               'Name',
            owner:              'Owner',
            mtime:              'Last modified',
            ctime:              'Created',
            timeSeparator:      'by',
            size:               'Size',
            mimetype:           'MIME type',
            md5sum:             'MD5 checksum',
            url:                'File URL'
        }
    },
    Lightbox: {
        saveImage: 'Save image',
        loadingImage: 'Loading image...',
        imageFailedToLoad: 'Failed to load image.',
        next: 'Next',
        prev: 'Previous',
        close: 'Close',
        counter: '%curr% of %total%'
    }
}

