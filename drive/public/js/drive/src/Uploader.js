/**
 * @constructor
 * @version 2013-05-16
 */
var Uploader = function (options) { // {{{
    var $ = window.jQuery;

    this.$ = $;
    this._options = $.extend({}, options);

    this._uploadQueueSize = 0;
    this._uploadTransfered = 0;

    this._i18n      = Drive.Util.i18n('Uploader');
    this._strInterp = new Viewtils.Interp;
    this._listeners = {};

    this._initView();
    this._initDialog();
    this._initQueue();
    this._initQueueScroll();
    this._initDropZone();
} // }}}

Uploader.prototype.bind = function (event, listener) { // {{{
    if (typeof listener === 'function') {
        if (typeof this._listeners[event] === 'undefined') {
            this._listeners[event] = [];
        }
        this._listeners[event].push(listener);
    }
    return this;
} // }}}

Uploader.prototype.trigger = function (event, data) { // {{{
    var listeners = this._listeners[event];
    if (listeners) {
        for (var i = 0, n = listeners.length; i < n; ++i) {
            listeners[i](data);
        }
    }
    return this;
} // }}}

Uploader.prototype.getElement = function () { // {{{
    return this._view.element;
} // }}}

Uploader.prototype.injectInto = function (hook, view) { // {{{
    view.inject(hook, this._view);
    return this;
} // }}}

Uploader.prototype._initView = function () { // {{{
    var self = this,
        str = self._i18n,
        element = Drive.Util.render('Uploader', {str: str}, self.$),
        view = new Drive.View(element, [
            'dialogContent.dropZonePane.dropZone.dropZoneText',
            'dialogContent.queuePane.items',
            'statusMessage',
            'openButton'
            // opcjonalne: itemName, itemSize
        ]);

    // ukryj element przechowujacy kolejke przesylania plikow, zostanie
    // on pokazany wraz z pojawieniem sie pierwszego pliku do przeslania
    element.hide();

    // podepnij do przycisku otwierajacego okienko modalne
    view.hooks.openButton.click(function () {
        self._showDialogPane('queue');
        return false;
    });

    self._view = view;
} // }}}

Uploader.prototype._initDialog = function () { // {{{
    // zapamietaj poprzedniego brata elementu wskazanego przez hook
    // dialogContent, bedacego trescia okna zawierajacego kolejke przesylanych
    // plikow. Elementy te sa potrzebne aby poprawnie przywrocic na miejsce
    // element dialogContgent po odpieciu go od okienka modalnego.
    var $ = this.$,
        self = this,
        str = self._i18n,
        hooks = self._view.hooks,
        dialogContent = hooks.dialogContent,
        dialogContentPrev = dialogContent.get(0).previousSibling,
        dialogContentParent = dialogContent.parent();

    // ukryj element z trescia okna modalnego
    dialogContent.hide();

    // dodaj wykrywanie czy na tym elemencie znajduje sie kursor, jezeli tak
    // tak lista przesylania plikow nie bedzie automatycznie przewijana
    dialogContent.bind('mouseenter', function () {
        dialogContent.addClass(':hover');
    }).bind('mouseleave', function () {
        dialogContent.removeClass(':hover');
    });

    // zaznacz na karcie kolejki przesylania plikow, ze kolejka jest pusta
    hooks.queuePane.addClass('no-items');

    self._dialog = {
        // widget okienka, niepuste jezeli okno jest otwarte
        widget: null,
        // nazwa aktywnej zakladki
        active: null,
        // nazwa poprzednio aktywnej zakladki w tej sesji okna
        previous: null,
        // wspolne ustawienia okienka
        options: {
            width: 600,
            content: function (dialog) {
                dialog.setContent(dialogContent);
                dialogContent.show();
                // dialog.adjustHeight();
            },
            beforeClose: function (dialog) {
                // przywroc dialogContent na miejsce zanim dialog usunie go
                // z drzewa, ponadto uczyn go niewidocznym
                // dialogContent.hide();

                if (dialogContentPrev) {
                    dialogContent.insertBefore(dialogContentPrev);
                } else {
                    dialogContent.prependTo(dialogContentParent);
                }

                // ukryj pasek statusu jezeli kolejka nie zawiera elementow
                if (self.isQueueEmpty()) {
                    self.show(false);
                }

                self._onDialogClose();
            }
        },
        // karty okienka, ukryj ich tresc
        panes: {
            dropZone: {
                title:   '',
                element: hooks.dropZonePane.hide(),
                buttons: []
            },
            queue: {
                title:   str.queuePaneTitle,
                element: hooks.queuePane.hide(),
                buttons: [
                    {
                        label: str.cleanButtonText,
                        load: function () {
                            this.setAttribute('title', str.cleanButtonTooltip);
                        },
                        action: function () {
                            self.cleanQueue();
                        }
                    },
                    {
                        label: str.cancelButtonText,
                        action: 'close'
                    }
                ]
            }
        }
    }
} // }}}

Uploader.prototype._initQueue = function () { // {{{
    var self = this,
        str = self._i18n,
        view = self._view,
        items = view.hooks.items,
        queuePane = view.hooks.queuePane,
        uploadQueue = {
            // klasa ustawiana na elemencie dokumentu odpowiadajacym aktualnie
            // przesylanemu plikowi
            uploadingClass: 'uploading',
            // zamknij okienko dialogowe po dodaniu plikow do kolejki
            closeDialogAfterEnqueue: true,
            // czy podczas przesylania plikow wystapily bledy
            hasErrors: false,
            // liste anulowanych transferow plikow, poniewaz dla nich nie
            // zostanie wywolana obsluga zdarzenia cleanup. Jest tak dlatego,
            // ze wywolanie queue.abort() usuwa od razu transfer z kolejki.
            canceledFiles: [],
            // element drzewa dokumentu odpowiadajacy aktualnie przesylanemu
            // plikowi w kolejce
            activeElement: null
        },
        handlers = {},
        // jezeli przegladarka nie przekazuje rozmiaru pliku, zliczaj pliki,
        // tzn. kazdy plik ma rozmiar 1
        fileSize = function (file) {
            return typeof file.size === 'number' ? file.size : 1;
        };

    handlers.enqueue = function (file, index) {
        var queue = this,
            element = Drive.Util.render('Uploader.queueItem', {
                file: file,
                str: str
            }, self.$),
            fileView = new Drive.View(element,
                ['progressText', 'progressBar', 'errorMessage', 'cancelButton']
                // optional hooks: progressValue
            ),
            size = fileSize(file);

        self._uploadQueueSize += size;

        fileView.hooks.cancelButton
            .click(function () {
                // anulowanie tylko gdy plik nie zostal jeszcze przeslany,
                // ani nie zostal uprzednio anulowany
                if (!file.processed) {
                    file.abort();
                }
            });

        file.processed = false;
        file.view = fileView;

        // usun klase .no-items informujaca o pustej kolejce
        if (queuePane.hasClass('no-items')) {
            queuePane.removeClass('no-items');
        }

        items.append(element);
        self.show();
    }

    handlers.enqueueComplete = function () {
        // po zakonczeniu dodawania plikow ukryj okienko z uploaderem,
        // chyba ze uprzednio otwarta byla karta z kolejka uploadu,
        // wtedy ja pokaz
        if (self._dialog.previous === 'queue') {
            self._showDialogPane('queue');
        } else if (self._dialog.widget && uploadQueue.closeDialogAfterEnqueue) {
            self._dialog.widget.close();
        }
    }

    handlers.abort = function (file) {
        var fileView = file.view,
            size = fileSize(file);

        self._uploadQueueSize -= size;

        file.processed = true;
        uploadQueue.canceledFiles.push(file);

        if (fileView) {
            fileView.hooks.progressText.html(String(str.canceled));

            // usun przycisk anulujacy przesylanie pliku
            fileView.element.removeClass(uploadQueue.uploadingClass);
            fileView.hooks.cancelButton.remove();
        }
    }

    handlers.start = function (file, position) {
        var fileView = file.view,
            element,
            totalPercent, message;

        // zapamietaj pozycje tego pliku w kolejce
        file.position = position;

        if (fileView) {
            element = fileView.element.addClass(uploadQueue.uploadingClass);

            fileView.hooks.progressText.html(String(str.uploading));

            // nie ustawiaj minimalnej szerokosci paska postepu, jezeli na
            // starcie ma miec zerowa szerokosc musi byc to osiagniete za
            // pomoca CSS
            // fileView.hooks.progressBar.css('width', 0);

            if (fileView.hooks.progressValue) {
                fileView.hooks.progressValue.text(0);
            }

            uploadQueue.activeElement = element;
        }

        // zaktualizuj uchwyty z ogolna informacja o wykonywanym transferze
        // znajdujace sie w glownym widoku kolejki
        if (view.hooks.itemName) {
            view.hooks.itemName.text(file.name);
        }
        if (view.hooks.itemSize) {
            view.hooks.itemSize.text(file.size ? Viewtils.fsize(file.size) : '');
        }

        totalPercent = 100 * self._uploadTransfered / self._uploadQueueSize;
        message = self._strInterp.interp(str.uploadProgress, {
            number:  position,
            total:   self._uploader.queueSize(),
            percent: Math.round(totalPercent)
        });

        view.hooks.statusMessage.html(String(message));
    }

    handlers.progress = function (file, value) {
        var fileView = file.view,
            transfered = self._uploadTransfered,
            size, percent, totalPercent,
            message;

        // LegacyUploader nie udostepnia informacji o calkowitej/wyslanej
        // liczbie bajtow
        if (typeof value === 'number') {
            percent = Math.round(100 * value),
            size = fileSize(file);

            if (fileView) {
                fileView.hooks.progressBar.css('width', percent + '%');
                if (fileView.hooks.progressValue) {
                    fileView.hooks.progressValue.text(percent);
                }
            }

            // nie aktualizuj na biezaco liczby przeslanych bajtow, poniewaz
            // utrudni to obliczenia, liczba przeslanych bajtow zostanie
            // zaktualizowana zaraz po zakonczeniu przesylania
            transfered += value * size;
        }

        totalPercent = 100 * transfered / self._uploadQueueSize;
        message = self._strInterp.interp(str.uploadProgress, {
            number:  file.position,
            total:   self._uploader.queueSize(),
            percent: Math.round(totalPercent)
        });

        view.hooks.statusMessage.html(String(message));
    }

    handlers.complete = function (file, response) {
        var fileView = file.view,
            size = fileSize(file),
            result;

        file.processed = true;

        // jezeli odpowiedz nie jest obiektem, wykonaj konwersje 
        if (typeof response === 'string') {
            try {
                response = self.$.parseJSON(response);
            } catch (e) {}
        }

        if (!response) {
            // abortowanie transferu zwykle konczy sie pusta odpowiedzia
            // od serwera, jezeli tak uznaj pusta odpowiedz za poprawna
            response = {error: str.responseError};
        }

        // zaktualizuj widok pliku
        if (fileView) {
            fileView.element.removeClass(uploadQueue.uploadingClass);
            fileView.hooks.cancelButton.remove();

            if (response.error) {
                fileView.element.addClass('upload-error');
                fileView.hooks.progressText.html(String(str.error));
                fileView.hooks.errorMessage.text(String(response.error));
            } else {
                fileView.hooks.progressText.html(String(str.uploaded));
                fileView.hooks.progressBar.css('width', '100%');
                if (fileView.hooks.progressValue) {
                    fileView.hooks.progressValue.text(100);
                }
            }
        }

        if (response.error) {
            uploadQueue.hasErrors = true;
        } else {
            // zaktualizuj transfer jezeli nie wystapily bledy i przesylanie
            // pliku nie zostalo anulowane
            self._uploadTransfered += size;
            self.trigger('uploadsuccess', response);
        }
    }

    handlers.error = function (file, error) {
        handlers.complete.call(this, file, {error: error});
    }

    handlers.cleanup = function (file) {
        var fileView = file.view;
        if (fileView) {
            fileView.element.remove();
            delete file.view;

            if (self.isQueueEmpty()) {
                queuePane.addClass('no-items');
            }
        }
    }

    handlers.queueComplete = function () {
        // zaznacz, ze w kolejce nie ma juz aktywnego elementu
        uploadQueue.activeElement = null;

        // jezeli w kolejce nie ma juz wiecej plikow, ustaw komunikat
        // o zakonczeniu przesylania
        view.hooks.statusMessage.html(String(
            uploadQueue.hasErrors ? str.uploadError : str.uploadSuccess
        ));

        self.trigger('queuecomplete');
    }

    uploadQueue.handlers = handlers;

    self._uploadQueue = uploadQueue;

    window.onbeforeunload = function (event) {        
        var message;

        if (self._uploader.hasPendingUploads()) {
            message = str.cancelUploadConfirm;

            event = event || window.event;
            if (event) {
                event.returnValue = message;
            }

            return message;
        }
    }
} // }}}

Uploader.prototype._initQueueScroll = function () // {{{
{
    // wyznacz kontener do przewijania listy, musi miec on wlasciwosc
    // overflow rozna od visible
    var self = this,
        uploadQueue = self._uploadQueue,
        hooks = self._view.hooks,
        lookup = hooks.items,
        scrollParent;

    while (lookup.length) {
        if (lookup.css('overflow') !== 'visible') {
            scrollParent = lookup;
            break;
        }
        lookup = lookup.parent();
    }

    if (scrollParent) {
        // zapamietaj aktualna wartosc przewiniecia kontenera, poniewaz
        // bedzie ona zerowana przy kazdym ukryciu okienka z kolejka
        // (ze wzgledu na przepinanie elementow dokumentu)
        scrollParent.bind('scroll', function () {
            uploadQueue.scrollTop = this.scrollTop;
        });

        uploadQueue.scrollParent = scrollParent;
        uploadQueue.scrollInterval = setInterval(function () {
            // przewin liste tylko jezeli kursor myszki znajduje sie
            // poza okienkiem dialogowym
            if (!hooks.dialogContent.hasClass(':hover')) {
                self._scrollQueue();
            }
        }, 500);

        // dodaj funkcje ktora po otwarciu karty z kolejka przesylania
        // wymusza przewiniecie listy do aktualnie przesylanego pliku
        self._dialog.panes.queue.load = function () {
            scrollParent.scrollTop(uploadQueue.scrollTop);
            self._scrollQueue();
        }
    }
} // }}}

Uploader.prototype._scrollQueue = function () { // {{{
    var items = this._view.hooks.items,
        uploadQueue = this._uploadQueue,
        scrollParent = uploadQueue.scrollParent,
        element = uploadQueue.activeElement;

    // nie wykonuj przewijania kolejki, jezeli wszystkie pliki zostaly
    // przeslane (niezaleznie czy wystapily bledy przesylania czy nie)
    if (scrollParent && scrollParent.is(':visible') && element) {
        // .position() zalezy od aktualnego scrollTop elementu,
        // os y rosnie w dol kontenera
        var y = element.offset().top - items.offset().top
              - scrollParent.outerHeight() / 2
              + element.outerHeight() / 2;

        // owin przewijanie w blok try-catch, ze wzgledu na to, ze
        // wyczyszczenie kolejki moze uniewaznic niektore wezly,
        // niewidoczny scrollParent rowniez powoduje wyjatek
        try {
            scrollParent.scrollTo(y, 500);
        } catch (e) {}
    }
} // }}}

Uploader.prototype._onDialogClose = function () { // {{{
    // zrob porzadki po zamknieciu okienka: usun nazwy aktywnej i poprzedniej
    // karty w okienku, ukryj element z trescia ostatniej aktywnej karty,
    // usun dowiazanie do okienka
    var dialog = this._dialog;

    if (dialog.active) {
        dialog.panes[dialog.active].element.hide();
    }

    dialog.widget = null;
    dialog.active = null;
    dialog.previous = null;
} // }}}

Uploader.prototype._showDialogPane = function (name, show) { // {{{
    var dialog = this._dialog,
        pane = dialog.panes[name],
        widget = dialog.widget,
        options, func;

    if (pane) {
        if (typeof show === 'undefined') {
            show = true;
        }

        if (show) {
            if (widget) {
                // jezeli okienko jest otwarte i aktywna karta jest rozna od
                // karty, ktora ma zostac pokazana, ukryj aktywna karte
                // i pokaz zadana karte
                if (dialog.active !== name) {
                    dialog.panes[dialog.active].element.hide();
                    pane.element.show();

                    widget.setTitle(pane.title);
                    widget.setButtons(pane.buttons);
                    // widget.adjustHeight();

                    dialog.previous = dialog.active;
                    dialog.active = name;

                    func = pane.load;
                }
            } else {
                pane.element.show();

                options = this.$.extend(null, dialog.options);
                options.title = pane.title;
                options.buttons = pane.buttons;

                widget = (new Dialog(options)).open();

                dialog.widget = widget;
                dialog.active = name;

                func = pane.load;
            }

            // funkcja nie zostanie wywolana jezeli probowano otworzyc
            // aktualnie otwarta karte
            if (typeof func === 'function') {
                func.call(pane);
            }

        } else if (widget) {
            // wywoluje onDialogClose za pomoca handlera beforeclose
            // podanego w opcjach okienka
            widget.close();
            widget = null;
        }
    }
} // }}}

Uploader.prototype.cleanQueue = function () { // {{{
    // usun najpierw anulowane pliki, one zostaly usuniete z kolejki
    // przesylania wczesniej, wiec ich cleanQueue() nie obejmie
    var uploadQueue = this._uploadQueue,
        canceledFiles = uploadQueue.canceledFiles;

    for (var i = 0, n = canceledFiles.length; i < n; ++i) {
        var file = canceledFiles[i],
            fileView = file.view;

        if (fileView) {
            fileView.element.remove();
            delete file.view;
        }
    }

    // zmniejsz rozmiar kolejki o liczbe przeslanych bajtow
    this._uploadQueueSize -= this._uploadTransfered;

    // wyszysc liczbe przeslanych bajtow, jezeli jakis plik jest
    // aktualnie przesylany liczba ta zostanie zaktualizowana po
    // zakonczeniu przesylania tego pliku
    this._uploadTransfered = 0;

    uploadQueue.hasErrors = false;
    uploadQueue.canceledFiles = [];

    this._uploader.cleanQueue();

    if (this.isQueueEmpty()) {
        this._view.hooks.queuePane.addClass('no-items');
    }

    // przewin do samego poczatku liste plikow, wewnatrz try-catch na wypadek,
    // gdyby okienko z kolejka w miedzyczasie stalo sie niewidoczne
    try {
        if (uploadQueue.scrollParent) {
            uploadQueue.scrollParent.scrollTo(0);
        }
    } catch (e) {}
} // }}}

Uploader.prototype.isQueueEmpty = function () { // {{{
    return 0 == this._view.hooks.items.find(':first-child').length;
} // }}}

Uploader.prototype._initDropZone = function () { // {{{
    var $ = this.$,
        self = this,
        str = self._i18n,
        hooks = self._view.hooks,
        uploadQueue = self._uploadQueue,
        uploader, dropZoneText;

    try {
        uploader = new Drive.FileUpload.Uploader(hooks.dropZone, uploadQueue.handlers);
        dropZoneText = window.opera
            ? str.dropHereOpera
            : str.dropHere;

        // pokazuj miejsce do upuszczenia plikow jezeli wykryto zdarzenie
        // dragover
        $(document).bind('dragover', function () {
            if (!self._uploader.disabled) {
                self._showDialogPane('dropZone');
            }
        });

    } catch (e) {
        uploader = new Drive.FileUpload.LegacyUploader(hooks.dropZone, uploadQueue.handlers);
        dropZoneText = str.dropHereLegacy;

        // dodaj dodatkowa klase ustawiana na elementach odpowiadajacych
        // przesylanym plikom, mowiaca o ograniczonej funkcjonalnosci
        // uploadera
        uploadQueue.uploadingClass += ' legacy-upload';
    }

    hooks.dropZoneText.html(String(dropZoneText));

    // zablokuj otworzenie upuszczonego pliku w przegladarce
    $(document).bind('dragleave dragend drop dragenter dragover dragstart drag', function() {
        return false;
    });

    // ustaw informacje ze upuszczanie pliku na element BODY nie jest dozwolone
    if (document.body.addEventListener) {
        document.body.addEventListener('dragover', function (e) {
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'none';
                e.dataTransfer.effectAllowed = 'none';
            }
        }, false);
    }

    self._uploader = uploader;

    // zainicjuj uploadera zgodnie z podana konfiguracja

    if (self._options.disabled) {
        self.disableUpload();
    }

    if (self._options.url) {
        self.setUploadUrl(self._options.url);
    }

    self.bind('uploadsuccess', self._options.uploadSuccess);
    self.bind('queuecomplete', self._options.queueComplete);
} // }}}

Uploader.prototype.show = function (show) { // {{{
    var element = this._view.element,
        visible = element.is(':visible');

    switch (true) {
        case typeof show === 'undefined':
            show = true;
            break;

        case show === 'toggle':
            show = !visible;
            break;
    }

    if (show) {
        if (!visible) {
            var stb = element.data('StickToBottom');

            // podepnij do widgetu zachowanie pilnujace, zeby pasek stanu
            // byl zawsze wyswietlany w obrebie okna przegladarki
            if (!stb) {
                stb = new Drive.StickToBottom(element);
            }

            element.animate({height: 'show'}, {
                step: function() {
                    if (stb) {
                        stb.updatePosition();
                    }
                }
            });
        }
    } else if (visible) {
        element.animate({height: 'toggle'});
    }
} // }}}

Uploader.prototype.setUploadUrl = function (url) { // {{{
    this._uploader.url = url;
    return this;
} // }}}

Uploader.prototype.disableUpload = function (disable) { // {{{
    if (typeof disable === 'undefined') {
        disable = true;
    }

    this._uploader.disabled = !!disable;
    return this;
} // }}}

Uploader.prototype.showDropZone = function (show) { // {{{
    return this._showDialogPane('dropZone', show);
} // }}}

Uploader.prototype.showQueue = function (show) { // {{{
    return this._showDialogPane('queue', show);
} // }}}

