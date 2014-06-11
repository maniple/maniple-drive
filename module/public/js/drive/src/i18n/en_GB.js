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
        dropHere:               'Drag and drop files here.',
        dropHereOpera:          'Kliknij aby dodać pliki. <small>Użyj przeglądarki Firefox lub Chrome aby dodawać pliki metodą przeciągnij i upuść</small>',
        dropHereLegacy:         'Kliknij aby dodać plik. <small>Użyj przeglądarki Firefox lub Chrome aby wgrywać więcej niż jeden plik naraz i aby korzystać z metody przeciągnij i upuść.</small>',
        responseError:          'Unexpected response from server',
        cancelUploadConfirm:    'Opuszczenie tej strony przerwie przesyłanie plików. Czy na pewno chcesz przejść do innej strony?',
    },
    DirBrowser: {
        noItems:                'Directory is empty',
        moreOps:                'More',
        eipHint:                'Click to edit',
        clickToRenameTooltip:   'Click to rename directory',
        uploadFiles:            'Upload files',
        diskUsage: {
            used:               'Disk usage:',
            available:          'Available space:',
            unlimited:          'Unlimited',
        },
        grab: {
            tooltip:            'Przeciągnij aby przenieść do innego katalogu',
            dropDirTooltip:     'Move <strong>{source}</strong> to <strong>{target}</strong>',
            noDropDirTooltip:   'Move <strong>{source}</strong>'
        },
        dirContents: {
            name:               'Name',
            owner:              'Owner',
            size:               'Size',
            mtime:              'Modified'
        },
        opCreateDir: {
            opname:             'New directory',
            title:              'New directory',
            submit:             'Apply'
        },
        opRenameDir: {
            opname:             'Rename',
            title:              'Rename directory',
            submit:             'Apply'
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
            visDescPrivate:     'Pliki znajdujące się w tym katalogu widoczne są jedynie dla mnie &ndash; właściciela katalogu, oraz wybranych użytkowników.',
            visDescUsersonly:   'Pliki znajdujące się w tym katalogu widoczne są tylko dla zalogowanych użytkowników.',
            visDescPublic:      'Pliki znajdujące się w tym katalogu widoczne są dla wszystkich osób znających ich adres.',
            visDescInherited:   'Dostęp do plików w tym katalogu jest taki sam jak dla plików w katalogu nadrzędnym.',
            aclLabel:           'Nadaj uprawnienia dostępu do tego katalogu wybranym użytkownikom',
            aclRead:            'Read only',
            aclReadWrite:       'Read and write',
            aclNoUsers:         'No users selected',
            userSearch:         'Search for user',
            userAdd:            'Add',
            userDelete:         'Remove',
            searchHint:         'Możesz wyszukać użytkownika wpisując jego imię i nazwisko, adres e-mail albo jego identyfikator w bazie danych.',
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
            opname:             'Rename'
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
    }
}

