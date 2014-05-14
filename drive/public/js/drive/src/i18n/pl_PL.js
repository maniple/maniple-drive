var I18n = {
    Uploader: {
        noItems:                'Brak plików do przesłania',
        filename:               'Plik',
        size:                   'Rozmiar',
        progress:               'Postęp',
        waiting:                'Oczekiwanie',
        uploading:              'Przesyłanie...',
        uploaded:               'Przesłano',
        canceled:               'Anulowano',
        error:                  'Błąd',
        queuePaneTitle:         'Przesyłanie plików',
        openButtonText:         'Szczegóły',
        cleanButtonText:        'Wyczyść',
        cleanButtonTooltip:     'Usuwa z listy pliki, których przesyłanie zostało zakończone lub anulowane',
        cancelButtonText:       'Ukryj',
        cancelButtonTooltip:    'Kliknij aby anulować',
        uploadSuccess:          'Wszystkie pliki zostały pomyślnie przesłane',
        uploadError:            'Przesyłanie zakończone. Wystąpiły błędy',
        uploadProgress:         'Przesyłanie pliku {number} z {total} ... {percent}%',
        dropHere:               'Przeciągnij i upuść pliki tutaj.',
        dropHereOpera:          'Kliknij aby dodać pliki. <small>Użyj przeglądarki Firefox lub Chrome aby dodawać pliki metodą przeciągnij i upuść</small>',
        dropHereLegacy:         'Kliknij aby dodać plik. <small>Użyj przeglądarki Firefox lub Chrome aby wgrywać więcej niż jeden plik naraz i aby korzystać z metody przeciągnij i upuść.</small>',
        responseError:          'Nieoczekiwana odpowiedź od serwera',
        cancelUploadConfirm:    'Opuszczenie tej strony przerwie przesyłanie plików. Czy na pewno chcesz przejść do innej strony?',
    },
    DirBrowser: {
        noItems:                'Katalog jest pusty',
        dirActions:             'Akcje',
        eipHint:                'Kliknij aby edytować',
        clickToRenameTooltip:   'Kliknij aby zmienić nazwę katalogu',
        uploadFiles:            'Wgraj pliki',
        diskUsage: {
            used:               'Wykorzystanie dysku:',
            available:          'Dostępne miejsce:',
            unlimited:          'Bez ograniczeń',
        },
        grab: {
            tooltip:            'Przeciągnij aby przenieść do innego katalogu',
            dropDirTooltip:     'Przenieś <strong>{source}</strong> do <strong>{target}</strong>',
            noDropDirTooltip:   'Przenieś <strong>{source}</strong>'
        },
        dirContents: {
            name:               'Nazwa',
            owner:              'Właściciel',
            size:               'Rozmiar',
            mtime:              'Zmodyfikowany'
        },
        opCreateDir: {
            opname:             'Nowy katalog',
            title:              'Nowy katalog',
            submit:             'Zastosuj'
        },
        opRenameDir: {
            opname:             'Zmień nazwę',
            title:              'Zmiana nazwy katalogu',
            submit:             'Zastosuj'
        },
        opRemoveDir: {
            opname:             'Usuń',
            title:              'Usunięcie katalogu',
            submit:             'Wykonaj'
        },
        opDirDetails: {
            opname:             'Właściwości',
            title:              'Właściwości katalogu',
            submit:             'Gotowe',
            name:               'Nazwa',
            owner:              'Właściciel',
            mtime:              'Ostatnia modyfikacja',
            ctime:              'Utworzony',
            timeSeparator:      'przez'
        },
        opShareDir: {
            opname:             'Udostępnianie',
            title:              'Udostępnianie katalogu',
            submit:             'Zapisz',
            visLabel:           'Widoczność katalogu',
            visOptPrivate:      'Prywatny',
            visOptUsersonly:    'Tylko użytkownicy',
            visOptPublic:       'Publiczny',
            visOptInherited:    'Dziedziczony',
            visDescPrivate:     'Pliki znajdujące się w tym katalogu widoczne są jedynie dla mnie &ndash; właściciela katalogu, oraz wybranych użytkowników.',
            visDescUsersonly:   'Pliki znajdujące się w tym katalogu widoczne są tylko dla zalogowanych użytkowników.',
            visDescPublic:      'Pliki znajdujące się w tym katalogu widoczne są dla wszystkich osób znających ich adres.',
            visDescInherited:   'Dostęp do plików w tym katalogu jest taki sam jak dla plików w katalogu nadrzędnym.',
            aclLabel:           'Nadaj uprawnienia dostępu do tego katalogu wybranym użytkownikom',
            aclRead:            'Tylko odczyt',
            aclReadWrite:       'Odczyt i zapis',
            aclNoUsers:         'Nie wybrano użytkowników',
            userSearch:         'Szukaj użytkownika',
            userAdd:            'Dodaj',
            userDelete:         'Usuń',
            searchHint:         'Możesz wyszukać użytkownika wpisując jego imię i nazwisko, adres e-mail albo jego identyfikator w bazie danych.',
            messageSending:     'Wysyłanie danych...',
            messageError:       'Wystąpił nieoczekiwany błąd',
            messageSuccess:     'Ustawienia udostępniania zostały zapisane'
        },
        opOpenFile: {
            opname:             'Otwórz'
        },
        opEditFile: {
            opname:             'Edytuj',
            title:              'Edycja metadanych pliku',
            submit:             'Zapisz',
            messageSuccess:     'Metadane pliku zostały zapisane'
        },
        opRenameFile: {
            opname:             'Zmień nazwę'
        },
        opRemoveFile: {
            opname:             'Usuń',
            title:              'Usunięcie pliku',
            submit:             'Wykonaj'
        },
        opFileDetails: {
            opname:             'Właściwości',
            title:              'Właściwości pliku',
            submit:             'Gotowe',
            name:               'Nazwa',
            owner:              'Właściciel',
            mtime:              'Ostatnia modyfikacja',
            ctime:              'Utworzony',
            timeSeparator:      'przez',
            size:               'Rozmiar',
            mimetype:           'Typ MIME',
            md5sum:             'Suma kontrolna MD5',
            url:                'URL pliku'
        }
    }
}

