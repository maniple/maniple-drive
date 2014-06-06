define(['jquery', 'vendor/maniple/modal', 'vendor/maniple/modal.ajaxform'], function ($, Dialog, ajaxForm) { var Drive = {
    I18n: (function() {
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
                    dropDirTooltip:     'Przenieś <strong>{source}</strong> do <strong>{target}</strong>',
                    noDropDirTooltip:   'Przenieś <strong>{source}</strong>'
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
                    aclNoUsers:         'Nie wybrano użytkowników',
                    userSearch:         'Szukaj użytkownika',
                    userAdd:            'Add',
                    userDelete:         'Remove',
                    searchHint:         'Możesz wyszukać użytkownika wpisując jego imię i nazwisko, adres e-mail albo jego identyfikator w bazie danych.',
                    messageSending:     'Wysyłanie danych...',
                    messageError:       'Wystąpił nieoczekiwany błąd',
                    messageSuccess:     'Ustawienia udostępniania zostały zapisane'
                },
                opOpenFile: {
                    opname:             'Open'
                },
                opEditFile: {
                    opname:             'Edit',
                    title:              'Edit file metadata',
                    submit:             'Save',
                    messageSuccess:     'Metadane pliku zostały zapisane'
                },
                opRenameFile: {
                    opname:             'Rename'
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
        return I18n;
    })(),
    DirBrowser: (function() {
        /* Guidelines:
         * .html() - tylko stringi pobrane z DirBrowser.str (takze interpolowane)
         * .text() - nazwy plikow, katalogow, dane pochodzace z odpowiedzi od serwera
         *
         * Uzywaj Drive.Util.i18n jezeli maja zostac wstawione napisy w kodzie
         * (nie w templejcie).
         * Przy leniwym obliczaniu odwoluj sie do stringa co najwyzej pierwzego
         * poziomu, tzn.:
         *     str = Drive.Util.i18n(...);
         *     str.x; // OK
         *     str.x.y; // ZLE!
         */

        /**
         * @constructor
         * @options
         * {object} uriTemplates
         * {boolean} [disableUpdir=false]
         * {string|object} [breadcrumbs=false]
         * {string|jQuery|Element} [breadcrumbs.selector]
         * {string} [breadcrumbs.separator="<span class=\"separator\"></span>"]
         * {string} [breadcrumbs.currentClass="current"]
         */
        function DirBrowser(selector, options) { // {{{
            var self = this,
                $ = window.jQuery;

            self.$ = $;

            self._element = $(selector).first();
            self._options = $.extend({}, options);

            // zainicjuj interpolatory stringow
            self._strInterp = new Viewtils.Interp();
            // TODO self._uriInterp = new Viewtils.Interp({esc: escape});

            // biezacy katalog
            self._currentDir = null;

            // slownik z templejtami adresow operacji na plikach i katalogach
            self._uriTemplates = self._options.uriTemplates;

            // zainicjuj menu pomocnicze, okruchy i widget przesylania plikow
            self._initBreadcrumbs();

            self._initUploader();

            // aktywny element katalogu (plik lub podkatalog)
            self._active = null;

            // kolekcja wszystkich elementow odpowiadajacych katalogom, na ktore
            // mozna upuscic pliki i inne katalogi
            self._dropTargets = {};

            // etykieta wyswietlana podczas przenoszenia katalogu lub pliku
            // z informacja o docelowej operacji
            self._grabTooltip = $('<div class="drive-grablabel"/>').css('display', 'none').appendTo('body');

            self._initWidthChecker();

            // click on elements with data-goto-url attribute triggers redirection
            // to url given in data-url attribute of first matching ancestor element
            self._element.on('click', '[data-goto-url]', function () {
                var url = $(this).closest('[data-url]').attr('data-url');
                if (url) {
                    setTimeout(function () {
                        document.location.href = url;
                    }, 10);
                }
            });

            // ustaw referencje do tego obiektu w powiazanym elemencie drzewa
            self._element.data('DirBrowser', self);

            self._element.empty().append(self._renderTemplate(
                'DirBrowser.loading',
                {str: Drive.Util.i18n('DirBrowser.loading')}
            ));

            // zainicjuj obsluge zmiany hasha w adresie
            $.History.bind(function (state) {
                state = String(state);
                if (state.match(/^dir:\d+$/)) {
                    self.loadDir(state.substr(4), function (dir) {
                        self.setDir(dir);
                    });
                }
            });
            $.History.start();

            // jezeli hash nie jest poprawnym identyfikatorem katalogu, uzyj
            // identyfikatora przekazanego do funkcji
            if (!document.location.hash.match(/^#dir:\d+$/) && self._options.dirId) {
                Drive.Util.gotoHash('dir:' + self._options.dirId);
            }
        } // }}}

        DirBrowser.prototype._initMainView = function (selector) { // {{{
            if (!this._view) {
                this._element.empty().append(this._renderTemplate('DirBrowser.main'));

                this._view = new Drive.View(this._element, [
                    'dirName', 'messageArea', 'auxMenu', 'dirContents',
                    'uploader', 'diskUsage'
                ]);

                // zainicjuj widget informujacy o stanie zajetosci dysku
                this._initDiskUsageView();

                // umiesc wyrenderowany widok w miejscu wskazanym przez hook uploadQueue
                this._uploader.injectInto('uploader', this._view);
            }
        }; // }}}

        DirBrowser.prototype._initDiskUsageView = function () { // {{{
            var str = Drive.Util.i18n('DirBrowser.diskUsage'),
                element = this._renderTemplate('DirBrowser.diskUsage', {str: str}),
                view = new Drive.View(element, [
                    'used', 'available'
                    // opcjonalne: 'percent', 'progressBar'
                ]),
                progressBar = view.hooks.progressBar;

            // szybsze niz .hide()
            // element.css('display', 'none');

            // zapamietaj poczatkowa klase paska postepu, zeby ulatwic pozniejsze
            // operacje na niej
            if (progressBar) {
                progressBar.data('DirBrowser.diskUsage', {
                    initClass: progressBar.attr('class'),
                    levelTemplate: String(progressBar.attr('data-level-template'))
                });
                progressBar.removeAttr('data-level-template');
            }

            this._view.inject('diskUsage', view);
        }; // }}}

        DirBrowser.prototype._updateDiskUsage = function (used, available) { // {{{
            var view = this._view.childViews.diskUsage,
                element = view.element,
                hooks = view.hooks,
                noLimitClass = 'no-limit',
                progressBar = hooks.progressBar,
                progressBarData, progressBarClass,
                level, levelTemplate,
                percent;

            // skonwertuj przekazane wartosci do liczb
            used = +used || 0;
            available = +available || 0;

            percent = available ? Math.round(100 * used / available) : 0;

            // jezeli nie podano rozmiaru dysku przyjmij, ze jest on nieograniczony
            // i zaznacz to ustawiajac odpowiednia klase na elemencie widoku
            if (!available) {
                element.addClass(noLimitClass);
                hooks.available.text(Drive.Util.i18n('DirBrowser.diskUsage.unlimited'));
            } else {
                element.removeClass(noLimitClass);
                hooks.available.text(Viewtils.fsize(available));
            }

            hooks.used.text(Viewtils.fsize(used));

            if (hooks.percent) {
                if (percent === 0 && used > 0) {
                    percent = '<1';
                }
                hooks.percent.text(percent);
            }

            if (progressBar) {
                // okresl tekstowa reprezentacje poziomu uzycia dysku i ustaw ja jako
                // klase paska postepu
                if (percent < 75) {
                    level = 'ok';
                } else if (percent < 95) {
                    level = 'warning';
                } else {
                    level = 'danger';
                }

                progressBarData = progressBar.data('DirBrowser.diskUsage');
                progressBarClass = progressBarData.initClass + ' ';
                levelTemplate = progressBarData.levelTemplate;

                if (levelTemplate.length) {
                    progressBarClass += this._strInterp.interp(levelTemplate, {level: level});
                } else {
                    progressBarClass += level;
                }

                progressBar.animate({width: percent + '%'}, 500, function () {
                    progressBar.attr('class', progressBarClass);
                });
            }
        }; // }}}

        DirBrowser.prototype._initUploader = function () { // {{{
            var self = this,
                uploader = new Drive.Uploader({
                    // na poczatku upload plikow jest nieaktywny, poniewaz url
                    // nie jest ustawiony
                    disabled: true
                });

            uploader.bind('uploadsuccess', function (response) {
                self.addFile(response);
                self._currentDir.files.push(response);

                // zaktualizuj informacje o zajmowanym miejscu na dysku:
                // odpowiedz musi zawierac pola disk_usage i quota
                self._updateDiskUsage(response.disk_usage, response.quota);
            });

            self._uploader = uploader;
        }; // }}}

        DirBrowser.prototype._initBreadcrumbs = function() { // {{{
            // wrap() tworzy kopie elementu danego jako otaczajacy, bez wzgledu
            // na to czy podano go jako string, czy jako element drzewa
            var $ = this.$,
                options = this._options.breadcrumbs,
                selector,
                container,
                currentClass,
                after,
                separator,
                itemTag;

            // jezeli nie podano konfiguracji okruchow, nie inicjuj ich
            if (!options) {
                return;
            }

            // selector - element zawierajacy okruchy
            selector = typeof options === 'string' ? options : options.selector;
            container = selector instanceof $ ? selector.first() : $(selector);

            // sciezka w gore dysku bedzie wyswietlana zamiast ostatniego
            // elementu w okruchach, lub na samym poczatku okruchow
            after = $(selector).children(':last-child').prev();

            // currentClass - klasa, ktora oznaczony jest element wskazujacy aktualna
            // pozycje w sladzie okruchow
            currentClass = options.currentClass || 'current';

            // itemTag - element zawierajacy odnosnik i separator
            itemTag = options.itemTag;

            // separator - ciag znakow do separowania linkow w sladzie okruchow,
            // jezeli nie podano go uzyj domyslnej wartosci SPAN.separator
            separator = options.separator;

            if (typeof separator === 'undefined') {
                separator = '<span class="separator"></span>';
            }

            this._breadcrumbs = {
                container:    container,
                after:        after,
                separator:    separator,
                currentClass: currentClass,
                itemTag:      itemTag
            };
        }; // }}}

        DirBrowser.prototype._updateBreadcrumbs = function(dir) { // {{{
            var self = this,
                breadcrumbs = self._breadcrumbs,
                item;

            if (!breadcrumbs) {
                return;
            }

            function dirLink(dir) {
                var attrs = {
                        href: self._dirUrl(dir) //,
                        //'data-dir': dir.dir_id
                    };

                if (dir.perms.write) {
                    attrs['data-drop-dir'] = dir.dir_id;
                }

                return '<a' + Viewtils.attrs(attrs) + '>' + Viewtils.esc(dir.name) + '</a>';
            }

            if (breadcrumbs.after.size()) {
                // insert links after 'after' element ...
                breadcrumbs.after.nextAll().remove();
            } else {
                // ... or at the beginning of breadcrumb container
                breadcrumbs.container.empty();
            }

            if (dir.parents) {
                for (i = dir.parents.length - 1; i >= 0; --i) {
                    item = dirLink(dir.parents[i]);
                    if (breadcrumbs.separator) {
                        item += ' ' + breadcrumbs.separator + ' ';
                    }
                    if (breadcrumbs.itemTag) {
                        item = $(item).wrap('<' + breadcrumbs.itemTag + '/>');
                    }
                    breadcrumbs.container.append(item);
                }
            }

            // current element, create SPAN, wrap it in itemTag if required,
            // add proper class
            item = $('<span>' + Viewtils.esc(dir.name) + '</span>');
            if (breadcrumbs.itemTag) {
                item = item.wrap('<' + breadcrumbs.itemTag + '/>');
            }
            if (breadcrumbs.currentClass) {
                item.addClass(breadcrumbs.currentClass);
            }
            breadcrumbs.container.append(item);

            breadcrumbs.container.find('[data-drop-dir]').each(function() {
                self._dropTargets[this.getAttribute('data-drop-dir')] = this;
            });
        }; // }}}

        DirBrowser.prototype._updateAuxmenu = function (dir) { // {{{
            var $ = this.$,
                self = this,
                ops,
                handlers;

            if (self._options.disableAuxmenu) {
                return;
            }

            ops = [];
            handlers = {};

            if (dir.perms.write) {
                ops.push({
                    op: 'uploadFiles',
                    title: Drive.Util.i18n('DirBrowser.uploadFiles')
                });
                handlers.uploadFiles = function() {
                    self._uploader.showDropZone();
                };

                ops.push({
                    op: 'createDir',
                    title: Drive.Util.i18n('DirBrowser.opCreateDir.opname')
                });
                handlers.createDir = function() {
                    self.opCreateDir(dir);
                };
            }

            if (dir.perms.share) {
                ops.push({
                    op: 'shareDir',
                    title: Drive.Util.i18n('DirBrowser.opShareDir.opname')
                });
                handlers.shareDir = function() {
                    self.opShareDir(dir);
                    self._closeOpdd();
                };
            }

            if (dir.perms.rename) {
                ops.push({
                    op: 'renameDir',
                    title: Drive.Util.i18n('DirBrowser.opRenameDir.opname')
                });
                handlers.renameDir = function () {
                    self.opRenameDir(dir);
                    self._closeOpdd();
                };
            }

            ops.push({
                op: 'dirDetails',
                title: Drive.Util.i18n('DirBrowser.opDirDetails.opname')
            });
            handlers.dirDetails = function() {
                self.opDirDetails(dir);
                self._closeOpdd();
            };

            // brak opRemoveDir bo nie mozna usunac biezacego katalogu

            var auxMenu = self._view.hooks.auxMenu.empty();

            auxMenu.off('click');
            auxMenu.on('click', '[data-op]', function () {
                var op = handlers[this.getAttribute('data-op')];
                if (op) {
                    op();
                }
                return false;
            });

            auxMenu.append(
                self._renderTemplate('DirBrowser.auxMenu', {
                    ops: ops.slice(0, 2),
                    moreOps: ops.slice(2),
                    str: {
                        moreOps: Drive.Util.i18n('DirBrowser.moreOps')
                    }
                })
            );
        }; // }}}

        DirBrowser.prototype._initWidthChecker = function() { // {{{
            // wykrywanie szerokosci kontenera na liste plikow
            var $ = this.$,
                self = this,
                isNarrow = false,
                narrowMaxWidth = 650;

            function widthChecker() {
                var container = self._element;

                if (container.width() <= narrowMaxWidth) {
                    if (!isNarrow) {
                        container.addClass('narrow');
                        isNarrow = true;
                    }
                } else {
                    if (isNarrow) {
                        container.removeClass('narrow');
                        isNarrow = false;
                    }
                }
            }

            widthChecker();
            $(window).resize(widthChecker);
        }; // }}}

        DirBrowser.prototype._dirUrl = function(dir) { // {{{
            return '#dir:' + dir.dir_id;
        }; // }}}

        DirBrowser.prototype._eip = function(selector, url, options) { // {{{
            var $ = this.$,
                opts = {
                    text_form: '<input type="text" id="#{id}" value="#{value}"/> <span class="required-indicator">*</span>',
                    form_buttons: '<div><div id="#{save_id}" class="btn-save"></div><div id="#{cancel_id}" class="btn-cancel"></div></div><div class="form-element-errors"></div>',
                    on_show: function() {
                        $(this).find('.form-element-errors').css('display', 'none');
                    },
                    on_error: function(response) {
                        $(this).find('.form-element-errors').text(response.error).fadeIn();
                    },
                    select_text: true,
                    hint_text: Drive.Util.i18n('DirBrowser.eipHint')
                };

            $.extend(options, opts);
            $(selector).eip(url, options);
        }; // }}}

        DirBrowser.prototype.loadDir = function (dirId, success) { // {{{
            var self = this,
                $ = this.$,
                url = Drive.Util.uri(this._uriTemplates.dir.read, {dir_id: dirId}),
                dirNameHook;

            if (self._view) {
                dirNameHook = self._view.hooks.dirName;
                var title = dirNameHook.attr('title');
                dirNameHook
                    .addClass('loading')
                    .attr('title', 'Ładowanie zawartości katalogu...');
            }

            App.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                complete: function () {
                    if (self._view) {
                        self._view.hooks.dirName.removeClass('loading');
                    }
                },
                error: function (response) {
                    if (self._view) {
                        self._view.hooks.dirName.attr('title', title);
                    }
                    $('#drive-loading').html('<div class="error">' + response.error + '</div>');
                },
                success: function (response) {
                    success.call(this, response.data);
                }
            });
        }; // }}}

        DirBrowser.prototype.setDir = function (dir) { // {{{
            var self = this,
                dirName, url;

            self._currentDir = dir;
            self._dropTargets = {};

            // zainicjuj glowny widok widgetu
            self._initMainView();

            self._updateBreadcrumbs(dir);
            self._updateAuxmenu(dir);

            // podepnij zmiane nazwy katalogu do tytulu strony
            dirName = self._view.hooks.dirName
                .text(dir.name)
                .unbind('click')
                .removeClass('renamable')
                .removeAttr('title');

            if (dir.perms.rename) {
                dirName
                    .addClass('renamable')
                    .attr('title', Drive.Util.i18n('DirBrowser.clickToRenameTooltip'))
                    .click(function() {
                        self.opRenameDir(dir);
                        return false;
                    });
            }

            // jezeli nie jest dostepny url do uploadu plikow wylacz uploadera
            if (dir.perms.write) {
                url = Drive.Util.uri(self._uriTemplates.dir.upload, dir);
                self._uploader.disableUpload(false).setUploadUrl(url);
            } else {
                self._uploader.disableUpload();
            }

            // pokaz informacje o zajetosci dysku
            self._updateDiskUsage(dir.disk_usage, dir.quota);

            // pokaz zawartosc katalogu
            self._renderDirContents(dir);
        }; // }}}

        DirBrowser.prototype.opCreateDir = function (parentDir) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.create, {dir_id: parentDir.dir_id}),
                str = Drive.Util.i18n('DirBrowser.opCreateDir');

            ajaxForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (dialog, response) {
                    var dir = response.data.dir;

                    self.addSubdir(dir);
                    self._currentDir.subdirs.push(dir);
                    dialog.close();
                }
            });
        }; // }}}

        DirBrowser.prototype.opRenameDir = function(dir, complete) { // {{{
            var $ = this.$,
                self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.rename, dir),
                str = Drive.Util.i18n('DirBrowser.opRenameDir');

            ajaxForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                load: function (dialog) {
                    setTimeout(function() {
                        dialog.getContentElement().find('input[type="text"]').focus().select();
                    }, 10);
                },
                complete: function (dialog, response) {
                    var responseDir = response.data.dir,
                        dirName = responseDir.name;

                    Drive.Util.assert(responseDir.dir_id == dir.dir_id, 'Unexpected directory ID in response');

                    // zaktualizuj nazwe katalogu wyswietlona w naglowku oraz w okruchach,
                    // o ile modyfikowany katalog jest katalogiem biezacym
                    if (self._currentDir && responseDir.dir_id == self._currentDir.dir_id) {
                        self._view.hooks.dirName.text(dirName);
                        if (self._breadcrumbs) {
                            self._breadcrumbs.container.find(':last-child').text(dirName);
                        }
                    }

                    if (dir.element) {
                        var oldElement, newElement;

                        oldElement = dir.element;
                        $.extend(dir, responseDir);

                        newElement = self._renderSubdir(dir);

                        oldElement.replaceWith(newElement);

                        // newElement.find('[data-drop-dir]').each(function() {
                        //    self._dropTargets.push(this);
                        // });

                        self._removeDropTarget(oldElement);
                        // self._dropTargets.push(view.el);

                        oldElement.remove();
                        dir.element = newElement;
                    }

                    if (typeof complete === 'function') {
                        complete(response);
                    }

                    dialog.close();
                }
            });
        }; // }}}

        DirBrowser.prototype.opMoveDir = function(dir, parentDirId) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.move, dir);

            if (dir.element) {
                dir.element.addClass('moving');
            }

            App.ajax({
                url: url,
                type: 'post',
                data: {parent_id: parentDirId},
                dataType: 'json',
                success: function () {
                    if (dir.element) {
                        dir.element.remove();
                        self._removeDropTarget(dir.element);
                        delete dir.element;
                    }
                },
                error: function () {
                    if (dir.element) {
                        dir.element.removeClass('moving');
                    }
                }
            });
        }; // }}}

        DirBrowser.prototype.opShareDir = function(dir) { // {{{
            var $ = this.$,
                self = this,
                str = Drive.Util.i18n('DirBrowser.opShareDir'),
                url = Drive.Util.uri(this._uriTemplates.dir.share, dir);

            (new Dialog({
                width:  600,
                height: 360,
                title:  str.title,
                buttons: [
                    {
                        label: 'Save',
                        action: function (dialog) {
                            dialog.setStatus(str.messageSending);
                            App.ajax({
                                url: url,
                                type: 'post',
                                data: dialog.getContentElement().find('form').serialize(),
                                dataType: 'json',
                                success: function (response) {
                                    // App.flash(str.messageSuccess, 'success');
                                    $.extend(dir, response.data);
                                    dialog.close();
                                },
                                error: function (response) {
                                    dialog.setStatus(response.message || str.messageError);
                                }
                            });
                        },
                        className: 'btn btn-primary'
                    },
                    {
                        label: 'Cancel',
                        action: 'close',
                        className: 'btn'
                    }
                ],
                submitLabel: str.submit,
                submitStatus: str.messageSending,
                content: function (dialog) {
                    var content = self._renderTemplate('DirBrowser.opShareDir', {str: str});

                    dialog.setContent(content);

                    // wyswietlanie opisu zaznaczonego poziomu widocznosci katalogu
                    content.find('select[name="visibility"]').change(function() {
                        content.find('.vis-desc').hide();
                        content.find('#drive-dir-share-vis-desc-' + this.value).fadeIn('fast');
                    }).each(function() {
                        var visibility = dir.visibility;

                        // jezeli katalog nie moze dziedziczyc widocznosci
                        // (znajduje sie w korzeniu drzewa katalogow) usun
                        // odpowiednia opcje z selecta
                        if (!dir.can_inherit_visibility) {
                            $.each(this.options, function(index, option) {
                                if (option.value == 'inherited') {
                                    $(option).remove();
                                }
                            });
                        }

                        // zaznacz biezaca widocznosc katalogu
                        $(this).val(visibility).change();
                    });

                    // pobierz kolor podswietlenia elementow reprezentujacych
                    // uzytkownika, usun element przechowujacy kolor
                    var usersContainer = content.find('#drive-dir-share-acl-users'),
                        highlight = usersContainer.find('.highlight'),
                        highlightColor = highlight.backgroundColor;

                    function highlightUser(element) {
                        $(element).effect('highlight', {color: highlightColor}, 1000);
                    }

                    function userBuilder(user) {
                        var vars = {
                                user: user,
                                str: str
                            },
                            element = self._renderTemplate('DirBrowser.opShareDir.user', vars);

                        element.bind('append', function (e) {
                            if (usersContainer.scrollTo) {
                                usersContainer.scrollTo(this, 100);
                            }
                        });
                        element.bind('exists', function (e) {
                            highlightUser(this);
                        });

                        return element;
                    }

                    highlight.remove();

                    // zainicjuj widget listy uzytkownikow
                    new Drive.UserPicker(content.find('#drive-dir-share-acl'), userBuilder, {
                            idColumn: 'user_id',
                            url: self._options.userSearchUrl,
                            users: dir.shares,
                            autocomplete: {
                                renderItem: function (user) {
                                    return self._renderTemplate('DirBrowser.opShareDir.userAutocomplete', {user: user});
                                },
                                renderValue: function (user) {
                                    return user.first_name + ' ' + user.last_name;
                                }
                            }
                        });

                    if (0) {
                    dialog.buttons([
                        {
                            id: 'submit',
                            label: str.submit,
                            action: function () {
                                dialog.setStatus(str.messageSending);
                                App.ajax({
                                    url: url,
                                    type: 'post',
                                    data: content.find('form').serialize(),
                                    dataType: 'json',
                                    success: function (response) {
                                        App.flash(str.messageSuccess, 'success');
                                        dialog.close();
                                    },
                                    error: function (response) {
                                        dialog.status(response.message || str.messageError);
                                    }
                                });
                            }
                        },
                    'cancel'
                    ]);
                    }

                    // podepnij zawartosc okna do drzewa dokumentu, przed
                    // inicjalizacja obslugi zdarzen
                    // dialog.content(content).adjustHeight(true);

                    // dostosuj wielkosc okna dialogowego do zawartosci, w osobnym
                    // watku, w przeciwnym razie jego rozmiar nie zostanie poprawnie
                    // obliczony

        //            setTimeout(function() {
        //                    dialog.height(content.outerHeight(), true);

                        // zeby overflow:auto zadzialalo
        //                  content.height(content.height());
        //               }, 10);
                }
            })).open();
        }; // }}}

        DirBrowser.prototype._removeDir = function (dir) { // {{{
            // remove dir element from dir contents listing
            if (dir.element) {
                dir.element.remove();
                this._removeDropTarget(dir.element);
                delete dir.element;
            }

            // remove dir from list
            var currentDir = this._currentDir,
                subdirs = currentDir.subdirs,
                index = $.inArray(dir, subdirs);

            if (index > -1) {
                currentDir.subdirs = subdirs.slice(0, index).concat(subdirs.slice(index + 1));
            }
            if (0 === (currentDir.subdirs.length + currentDir.files.length)) {
                this._view.childViews.dirContents.element.addClass('no-items');
            }
        }; // }}}

        DirBrowser.prototype.opRemoveDir = function (dir) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.remove, dir),
                str = Drive.Util.i18n('DirBrowser.opRemoveDir');

            ajaxForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (dialog, response) {
                    response = response || {error: 'Nieoczekiwana odpowiedz od serwera'};
                    if (!response.error) {
                        self._removeDir(dir);
                        self._updateDiskUsage(response.data.disk_usage, response.data.quota);

                        dialog.close();
                    }
                }
            });
        }; // }}}

        DirBrowser.prototype.opDirDetails = function(dir) { // {{{
            var self = this,
                str = Drive.Util.i18n('DirBrowser.opDirDetails');

            var content = self._renderTemplate('DirBrowser.opDirDetails', {
                    dir: dir,
                    str: str
                });

            if (dir.perms.chown) {
                var url = Drive.Util.uri(self._uriTemplates.dir.chown);
                self._eip(content.find('.owner'), url, {
                    name: 'owner',
                    prepare_value: function(value) {
                        return value.replace(/\s\(.*$/g, '');
                    },
                    process_value: function(value, response) {
                        return response.owner.user_id + ' (' + response.owner.name + ')';
                    },
                    prepare_data: function(context) {
                        return {dir_id: dir.dir_id};
                    },
                    after_save: function(response) {
                        Drive.Util.assert(response.dir_id == dir.dir_id, 'Unexpected directory ID in response');

                        dir.owner = response.owner;
                        dir.mtime = response.mtime;
                        dir.modified_by = response.modified_by;

                        content.find('.mtime .time').text(response.mtime['long']);
                        content.find('.mtime .user').text(response.modified_by.name);

                        if (dir.element) {
                            self._renderSubdir(dir, true);
                        }
                    }
                });
            }

            (new Dialog).open({
                title: str.title,
                width: 440,
                content: function (dialog) {
                    content.appendTo(this);
                    // dialog.adjustHeight();
                },
                buttons: [{
                    label: str.submit,
                    action: function (dialog) {
                        dialog.close();
                    }
                }]
            });
        }; // }}}

        DirBrowser.prototype.opRenameFile = function(file) { // {{{
            var $ = this.$,
                self = this,
                url = Drive.Util.uri(self._uriTemplates.file.rename, file);

            selection = function (element, start, end) { // {{{
                if (element instanceof $) {
                    element = element.get(0);
                }
                if (element) {
                    if (element.createTextRange) {
                        var range = element.createTextRange();
                        range.collapse(true);
                        range.moveStart('character', start);
                        range.moveEnd('character', end);
                        range.select();

                    } else if (element.setSelectionRange) {
                        element.setSelectionRange(start, end);

                    } else if (this.selectionStart) {
                        element.selectionStart = start;
                        element.selectionEnd = end;
                    }
                    element.focus();
                }
            } // }}}

            ajaxForm({
                width:  440,
                height: 120,
                url:    url,
                title:  'Zmiana nazwy pliku',
                submitLabel: 'Zastosuj',
                content: function (dialog, response) {
                    var content = $(response.data);

                    setTimeout(function() {
                        content.find('input[type="text"]').first().each(function() {
                            var j = $(this),
                                val = j.val(),
                                pos = val.lastIndexOf('.');

                            // zaznacz nazwe pliku bez rozszerzenia
                            selection(j, 0, pos == -1 ? val.length : pos);
                        });
                    }, 25);

                    dialog.setContent(content);
                    return content;
                },
                complete: function (dialog, response) {
                    var responseFile = response.data.file;

                    Drive.Util.assert(responseFile.file_id == file.file_id, 'Unexpected file id in response');
                    $.extend(file, responseFile);

                    if (file.element) {
                        self._renderFile(file, true);
                    }

                    dialog.close();
                }
            });
        }; // }}}

        DirBrowser.prototype._removeFile = function (file) { // {{{
            // remove file element from dir contents listing
            if (file.element) {
                file.element.remove();
                delete file.element;
            }

            // remove file from files array
            var currentDir = this._currentDir,
                files = currentDir.files,
                index = $.inArray(file, files);

            if (index > -1) {
                currentDir.files = files.slice(0, index).concat(files.slice(index + 1));
            }
            if (!(currentDir.subdirs.length + currentDir.files.length)) {
                this._view.childViews.dirContents.element.addClass('no-items');
            }
        }; // }}}

        DirBrowser.prototype.opMoveFile = function(file, dirId) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.file.move, file);

            if (file.element) {
                file.element.addClass('moving');
            }

            App.ajax({
                url: url,
                type: 'post',
                data: {dir_id: dirId},
                dataType: 'json',
                success: function () {
                    self._removeFile(file);
                },
                error: function () {
                    if (file.element) {
                        file.element.removeClass('moving');
                    }
                }
            });
        }; // }}}

        DirBrowser.prototype.opRemoveFile = function(file) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.file.remove, file),
                str = Drive.Util.i18n('DirBrowser.opRemoveFile');

            ajaxForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (dialog, response) {
                    response = response || {error: 'Nieoczekiwana odpowiedź od serwera'};
                    if (!response.error) {
                        self._removeFile(file);
                        self._updateDiskUsage(response.disk_usage, response.quota);
                        dialog.close();
                    }
                }
            });
        }; // }}}

        DirBrowser.prototype.opEditFile = function(file) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.file.edit, file),
                str = Drive.Util.i18n('DirBrowser.opEditFile');

            ajaxForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (dialog, response) {
                    response = response || {error: 'Nieoczekiwana odpowiedź od serwera'};
                    if (!response.error) {
                        App.flash(str.messageSuccess);
                        dialog.close();
                    }
                }
            });
        }; // }}}

        DirBrowser.prototype.opFileDetails = function(file) { // {{{
            var self = this,
                str = Drive.Util.i18n('DirBrowser.opFileDetails');

            var content = self._renderTemplate('DirBrowser.opFileDetails', {
                    file: file,
                    str: str
                });

            if (file.perms.chown) {
                var url = Drive.Util.uri(self._uriTemplates.file.chown);

                self._eip(content.find('.owner'), url, {
                    name: 'owner',
                    prepare_value: function(value) {
                        return value.replace(/\s\(.*$/g, '');
                    },
                    process_value: function(value, response) {
                        return response.owner.user_id + ' (' + response.owner.name + ')';
                    },
                    prepare_data: function(context) {
                        return {file_id: file.file_id};
                    },
                    after_save: function(response) {
                        Drive.Util.assert(response.file_id == file.file_id, 'Unexpected file id in response');

                        file.owner = response.owner;
                        file.mtime = response.mtime;
                        file.modified_by = response.modified_by;

                        content.find('.mtime .time').text(response.mtime['long']);
                        content.find('.mtime .user').text(response.modified_by.name);

                        if (file.element) {
                            self._renderFile(file, true);
                        }
                    }
                });
            }

            (new Dialog({
                title: str.title,
                width: 440,
                content: content,
                buttons: [{
                    label: str.submit,
                    action: function (dialog) {
                        dialog.close();
                    }
                }]
            })).open();

        }; // }}}

        DirBrowser.prototype.addSubdir = function(dir) { // {{{
            var element = this._renderSubdir(dir),
                dirContentsView = this._view.childViews.dirContents;

            element.appendTo(dirContentsView.hooks.subdirs);

            dirContentsView.element.removeClass('no-items');
            this.$(window).trigger('resize');
        }; // }}}

        DirBrowser.prototype.addFile = function(file) { // {{{
            var element = this._renderFile(file),
                dirContentsView = this._view.childViews.dirContents;

            element.appendTo(dirContentsView.hooks.files);

            dirContentsView.element.removeClass('no-items');
            this.$(window).trigger('resize');
        }; // }}}

        DirBrowser.prototype._closeOpdd = function() { // {{{
            this._element.find('[data-toggle="dropdown"]').each(function () {
                var el = $(this),
                    target = el.attr('data-target') || el.attr('href'),
                    parent;

                try {
                    target = String(target).match(/#([^\s]*)$/)[1];
                    parent = target && $(target);
                } catch (e) {
                }

                if (!parent || !parent.length) {
                    parent = el.parent();
                }

                parent.removeClass('open');
            });

            // deprecated
            // this.$.fn.opdd.close();
        }; // }}}

        DirBrowser.prototype._dirEntryOpdd = function(entry, items) { return; // {{{
            var opdd = App.View.opdd(items);

            opdd.bind('opdd-open', function() {
                if (self._active) {
                    self._active.removeClass('active');
                    self._active = null;
                }

                if (entry.element) {
                    entry.element.addClass('active');
                    self._active = entry.element;
                }

                return false;
            });

            opdd.bind('opdd-close', function() {
                if (entry.element) {
                    entry.element.removeClass('active');
                }
                self._active = null;

                return false;
            });

            return opdd;
        }; // }}}

        DirBrowser.prototype._subdirOps = function (dir) { // {{{
            var self = this,
                ops = {};

            ops.details = {
                op: 'details',
                title: Drive.Util.i18n('DirBrowser.opDirDetails.opname'),
                handler: function () {
                    self.opDirDetails(dir);
                    self._closeOpdd();
                    return false;
                }
            };

            if (dir.perms.share) {
                ops.share = {
                    op: 'share',
                    title: Drive.Util.i18n('DirBrowser.opShareDir.opname'),
                    handler: function () {
                        self.opShareDir(dir);
                        self._closeOpdd();
                        return false;
                    }
                };
            }

            if (dir.perms.rename) {
                ops.rename = {
                    op: 'rename',
                    title: Drive.Util.i18n('DirBrowser.opRenameDir.opname'),
                    handler: function () {
                        self.opRenameDir(dir);
                        self._closeOpdd();
                        return false;
                    }
                };
            }

            if (dir.perms.remove) {
                ops.remove = {
                    op: 'remove',
                    title: Drive.Util.i18n('DirBrowser.opRemoveDir.opname'),
                    handler: function () {
                        self.opRemoveDir(dir);
                        self._closeOpdd();
                        return false;
                    }
                };
            }

            return ops;
        }; // }}}

        DirBrowser.prototype._fileOps = function (file) { // {{{
            var self = this,
                ops = {};

            ops.open = {
                op: 'open',
                title: Drive.Util.i18n('DirBrowser.opOpenFile.opname'),
                handler: function () {
                    document.location.href = Drive.Util.uri(self._uriTemplates.file.read, file);

                    // zwrocenie false spowoduje, ze nie otworzy sie plik,
                    // trzeba puscic event i zamknac opdd w osobnym watku
                    setTimeout(function () {
                        self._closeOpdd();
                    }, 500);
                }
            };

            ops.details = {
                op: 'details',
                title: Drive.Util.i18n('DirBrowser.opFileDetails.opname'),
                handler: function() {
                    self.opFileDetails(file);
                    self._closeOpdd();
                    return false;
                }
            };

            if (file.perms.write) {
                ops.edit = {
                    op: 'edit',
                    title: Drive.Util.i18n('DirBrowser.opEditFile.opname'),
                    handler: function () {
                        self.opEditFile(file);
                        self._closeOpdd();
                        return false;
                    }
                };
            }

            if (file.perms.rename) {
                ops.rename = {
                    op: 'rename',
                    title: Drive.Util.i18n('DirBrowser.opRenameFile.opname'),
                    handler: function () {
                        self.opRenameFile(file);
                        self._closeOpdd();
                        return false;
                    }
                };
            }

            if (file.perms.remove) {
                ops.remove = {
                    op: 'remove',
                    title: Drive.Util.i18n('DirBrowser.opRemoveFile.opname'),
                    handler: function() {
                        self.opRemoveFile(file);
                        self._closeOpdd();
                        return false;
                    }
                };
            }

            return ops;
        }; // }}}

        DirBrowser.prototype._addDropTarget = function (dir, element) { // {{{
            var self = this;

            element.attr('data-drop-dir', dir.dir_id);
            element.attr('data-name', dir.name).each(function() {
                self._dropTargets[dir.dir_id] = this;
            });
        }; // }}}

        DirBrowser.prototype._removeDropTarget = function (element) { // {{{
            // element - element dokumentu reprezentujacy wpis w katalogu
            var $ = this.$,
                self = this;

            // addBack is available since jQuery 1.8
            element.find('[data-drop-dir]').addBack('[data-drop-dir]').each(function() {
                var key = this.getAttribute('data-drop-dir');
                if (self._dropTargets[key] === this) {
                    delete self._dropTargets[key];
                }
                return;
                var index = $.inArray(this, self._dropTargets);
                if (index != -1) {
                    self._dropTargets.splice(index, 1);
                }
            });
        }; // }}}

        DirBrowser.prototype._getDropDirElement = function(position, dragDirId) { // {{{
            // teraz trzeba zlapac element na wspolrzednych x i y ktory ma
            // atrybut data-drop-dir. document.elementFromPoint znajduje
            // najplycej polozony element, nad ktorym jest kursor myszy, co
            // jest niewystarczajace.
            var $ = this.$,
                self = this,
                target = null;

            $.each(self._dropTargets, function () {
                var $this = $(this),
                    o = $this.offset(),
                    x1 = o.left,
                    y1 = o.top,
                    x2 = x1 + $this.outerWidth(),
                    y2 = y1 + $this.outerHeight(),
                    x = position.x,
                    y = position.y;

                if (x1 <= x && x < x2 && y1 <= y && y < y2) {
                    var dropDirId = $this.attr('data-drop-dir');

                    if (dropDirId &&
                        (typeof dragDirId === 'undefined' || dropDirId != dragDirId))
                    {
                        target = $this;
                        return false;
                    }
                }
            });
            return target;
        }; // }}}

        DirBrowser.prototype._addGrab = function (entry, isDir, element, callback) { // {{{
            var $ = this.$,
                self = this,
                str = Drive.Util.i18n('DirBrowser.grab'),
                prevTooltipText,
                dragDirId;

            // jezeli podany wpis jest katalogiem, przekaz jego id do funkcji
            // wyznaczajacej element docelowy upuszczenia (odpowiadajacy innemu
            // katalogowi)
            if (isDir) {
                dragDirId = entry.dir_id;
            }

            element.grab({
                onstart: function() {
                    $('html').addClass('grabbing');

                    if (self._active) {
                        self._active.removeClass('active');
                        self._active = null;
                    }

                    if (entry.element) {
                        self._active = entry.element.addClass('active');
                    }

                    self._closeOpdd();
                    self._grabTooltip.hide();
                },
                onmove: function(e) {
                    var target = self._getDropDirElement(e.position, dragDirId),
                        tooltipText;

                    if (target) {
                        tooltipText = self._strInterp.interp(str.dropDirTooltip, {
                            source: entry.name,
                            target: target.attr('data-name') || target.text()
                        });
                    } else {
                        tooltipText = self._strInterp.interp(str.noDropDirTooltip, {
                            source: entry.name
                        });
                    }

                    // zaktualizuj tresc tylko jesli jest ona rozna od poprzedniej
                    if (tooltipText != prevTooltipText) {
                        self._grabTooltip.html(tooltipText);
                        prevTooltipText = tooltipText;
                    }

                    // przesuniecie wzgledem czubka kursora jest potrzebne, aby
                    // poprawnie dzialal hover na elementach katalogu
                    self._grabTooltip.css({
                        position: 'absolute',
                        left: e.position.x + 8,
                        top: e.position.y + 8
                    }).show();
                },
                onfinish: function(e) {
                    var target = self._getDropDirElement(e.position, dragDirId);

                    if (target) {
                        if (typeof callback == 'function') {
                            callback.call(this, target.attr('data-drop-dir'));
                        }
                    }

                    if (self._active) {
                        self._active.removeClass('active');
                        self._active = null;
                    }

                    $('html').removeClass('grabbing');

                    self._grabTooltip.hide();
                }
            });

            element.addClass('grabbable').attr('title', str.tooltipText);
        }; // }}}

        DirBrowser.prototype._renderTemplate = function (id, vars) { // {{{
            var $ = this.$;
            return Drive.Util.render(id, vars || {}, function (value) {
                return $('<div/>').append(value).contents();
            });
        }; // }}}

        DirBrowser.prototype._renderHeader = function() { // {{{
            var str = Drive.Util.i18n('DirBrowser.dirContents');
            return this._renderTemplate('DirBrowser.dirContents.header', {str: str});
        }; // }}}

        DirBrowser.prototype._renderUpdir = function (dir) { // {{{
            var self = this;
            var element = self._renderTemplate('DirBrowser.dirContents.updir', {dir: dir});
                hooks = Viewtils.hooks(element, {
                    required: ['name'],
                    wrapper: self.$
                });

            if (dir.perms.read) {
                // klikniecie w katalog laduje zawarte w nim pliki i podkatalogi
                element.attr('data-goto-url', '');
                element.attr('data-url', self._dirUrl(dir));
            }

            // Katalog nadrzedny nie moze byc przenoszony metoda przeciagnij-i-upusc.
            element.addClass('not-grabbable');

            // jezeli katalog jest dostepny do zapisu, zezwol na upuszczanie
            // na niego plikow lub katalogow.
            if (dir.perms.write) {
                // hooks.name.
                self._addDropTarget(dir, element);
            }

            return element;
        }; // }}}

        DirBrowser.prototype._renderSubdir = function (dir, replace) { // {{{
            var self = this;

            var ops = self._subdirOps(dir),
                element = self._renderTemplate('DirBrowser.dirContents.subdir', {dir: dir, ops: ops}),
                hooks = Viewtils.hooks(element, {
                    required: ['grab', 'icon', 'name'],
                    wrapper: self.$
                });

            if (dir.perms.read) {
                // klikniecie w katalog laduje zawarte w nim pliki i podkatalogi
                element.attr('data-url', self._dirUrl(dir));

                [hooks.icon, hooks.name].forEach(function (elem) {
                    elem.attr('data-goto-url', '');
                });
            }

            if (dir.perms.write) {
                // ustaw atrybut data-drop-dir wskazujacy, ze na ten katalog mozna
                // upuscic plik lub inny katalog
                self._addDropTarget(dir, element);

                // ustaw obsluge metody przeciagnij-i-upusc dla tego katalogu
                self._addGrab(dir, true, hooks.grab, function (targetDirId) {
                    self.opMoveDir(dir, targetDirId);
                });
            }

            // zastap juz istniejacy element jeszcze raz wygenerowanym widokiem
            if (replace && dir.element) {
                var old = dir.element;

                self._removeDropTarget(old);

                old.replaceWith(element);
                old.remove();
            }

            self._bindOpHandler(element, ops);

            // podepnij widok do katalogu
            dir.element = element;

            return element;
        }; // }}}

        DirBrowser.prototype._bindOpHandler = function (element, ops) { // {{{
            element.on('click', '[data-op]', function (e) {
                var op = ops[this.getAttribute('data-op')];
                if (op && typeof op.handler === 'function') {
                    return op.handler();
                }
            });
        }; // }}}

        DirBrowser.prototype._renderFile = function (file, replace) { // {{{
            var self = this,
                ops = self._fileOps(file),
                element = self._renderTemplate('DirBrowser.dirContents.file', {file: file, ops: ops}),
                hooks = Viewtils.hooks(element, {
                    required: ['grab', 'icon', 'name'],
                    wrapper: self.$
                }),
                url = Drive.Util.uri(self._uriTemplates.file.read, file),
                ext = file.name.match(/(?=.)([-_a-z0-9]+)$/i)[1];

            // skoro biezacy katalog jest czytelny, oznacza to, ze wszystkie pliki
            // w nim zawarte rowniez sa czytelne
            element.attr('data-url', url);

            [hooks.icon, hooks.name].forEach(function (elem) {
                elem.attr('data-goto-url', '');
            });

            // dodaj klase wskazujaca na konkretny typ pliku. W tym celu wyodrebnij
            // z nazwy pliku rozszerzenie, i o ile nie zawiera niebezpiecznych znakow
            // uzyj je.
            if (ext) {
                hooks.icon.addClass(ext.toLowerCase());
            }

            // TODO isFileMovable? file.perms.move?
            if (self._currentDir.perms.write) {
                self._addGrab(file, false, hooks.grab, function (targetDirId) {
                    self.opMoveFile(file, targetDirId);
                });
            }

            // zastap juz istniejacy element jeszcze raz wygenerowanym widokiem
            if (replace && file.element) {
                var old = file.element;

                old.replaceWith(element);
                old.remove();
            }

            self._bindOpHandler(element, ops);

            // podepnij widok do pliku
            file.element = element;

            return element;
        }; // }}}

        DirBrowser.prototype._renderDirContents = function (dir) { // {{{
            var $ = this.$,
                self = this,
                str = Drive.Util.i18n('DirBrowser'),
                element = self._renderTemplate('DirBrowser.dirContents', {str: str}),
                view = new Drive.View(element, ['header', 'updir', 'subdirs', 'files']);

            self._view.inject('dirContents', view);

            view.hooks.header.append(self._renderHeader());

            if (dir.parents.length) {
                view.hooks.updir.append(self._renderUpdir(dir.parents[0]));
            }

            if (dir.subdirs.length || dir.files.length) {
                // Puste TBODY jest jak najbardziej poprawne w HTML5:
                // http://www.w3.org/TR/html-markup/tbody.html
                $.each(dir.subdirs, function() { self.addSubdir(this); });
                $.each(dir.files, function() { self.addFile(this); });

                element.removeClass('no-items');
            } else {
                element.addClass('no-items');
            }

            self._active = null;

            //view.find('[data-drop-dir]').each(function() {
            //    self._dropTargets.push(this);
            //});
        }; // }}}
        return DirBrowser;
    })(),
    FileUpload: (function() {
        (function ($, window, undefined) {
        /**
         * @namespace
         * @version 2013-12-20
         */
        var FileUpload = {};

        FileUpload.stopEvent = function (event) { // {{{
            event.cancelBubble = true;
            event.returnValue = false;

            if (event.stopPropagation) {
                event.stopPropagation();
            }

            if (event.preventDefault) {
                event.preventDefault();
            }
        }; // }}}

        /**
         * @constructor
         * @param {HTMLInputElement} fileInput
         * @param {string} [url]
         * Event handlers:
         * .onabort
         * .oncomplete
         * .onerror
         */
        FileUpload.FileInputUpload = function (fileInput, url, options) { // {{{
            var self = this,
                iframe, form, interval;

            var _cleanup = function () {
                if (iframe) {
                    iframe.remove();
                    iframe = null;
                }
                if (form) {
                    form.remove();
                    form = null;
                }
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }

            if (typeof url === 'object') {
                options = url;
                url = undefined;
            }

            options = options || {};

            this.isAborted = false;

            this.url = url || options.url;
            this.data = options.data;

            this.size = '', // file size is not available
            this.name = (function (value) {
                var name = String(value).replace(/\\/g, '/'),
                    pos = name.lastIndexOf('/'); // C:\fakepath\...

                if (pos != -1) {
                    name = name.substr(pos + 1);
                }

                return name;
            })(fileInput.value);

            this.abort = function () { // {{{
                if (!self.isAborted) {
                    self.isAborted = true;

                    if (iframe) {
                        iframe.attr('src', 'javascript:false');
                    }

                    _cleanup();

                    if (typeof self.onabort === 'function') {
                        self.onabort.call(self);
                    }
                }
            } // }}}

            this.send = function () { // {{{
                var frameName;

                if (self.isAborted) {
                    return false;
                }

                frameName = 'iframe-' + Math.random().toString().substr(2);

                iframe = $('<iframe name="' + frameName + '" />')
                    .css('display', 'none')
                    .appendTo('body')
                    .each(function() {
                        this.onload = function () {
                            // make sure onload() is called at most once
                            this.onload = null;

                            if (!self.isAborted && typeof self.oncomplete === 'function') {
                                var body = this.contentWindow.document.body,
                                    response = body.innerHTML.replace(/^\s+|\s+$/g, '');

                                // IFRAME is expecting an HTML document. If response has
                                // non-text/html MIME Firefox and Chrome will wrap it in
                                // a PRE tag (the latter adds a style attribute)
                                if (response.substr(0, 5).match(/<pre[\s>]/i)) {
                                    response = response
                                        .replace(/^<pre[^>]*>|<\/pre>$/ig, '')
                                        .replace(/&lt;/g, '<')
                                        .replace(/&gt;/g, '>')
                                        .replace(/&amp;/g, '&');
                                }

                                self.oncomplete.call(self, response);
                            }

                            // Remove IFRAME and FORM elements. Use a separate thread,
                            // so that this function is safe to use in these elements'
                            // event handlers. Without this, (at least) Firefox 12
                            // throws an 0x80004002 (NS_NOINTERFACE) error.
                            setTimeout(_cleanup, 10);
                        }
                        this.onerror = function () {
                            // make sure onerror() is called at most once
                            this.onerror = null;

                            if (!self.isAborted && typeof self.onerror === 'function') {
                                self.onerror.call(self);
                            }

                            setTimeout(_cleanup, 10);
                        }
                    });

                // simulate progress event
                if (typeof self.onprogress === 'function') {
                    interval = setInterval(function () {
                        // progress value is undefined
                        self.onprogress.call(self);
                    }, 500);
                }

                // in order to send file in IE file input must be clicked by the user,
                // not triggered by JS. Otherwise 'SCRIPT5 Access is denied' error will
                // be thrown. Read more:
                // http://stackoverflow.com/questions/3935001/getting-access-is-denied-error-on-ie8
                // http://stackoverflow.com/questions/8838485/ie9-file-input-triggering-using-javascript
                form = $('<form method="post" enctype="multipart/form-data" />')
                    .attr('target', frameName)
                    .css('display', 'none')
                    .appendTo('body')
                    .append(fileInput)
                    .attr('action', self.url);

                if (this.data) {
                    for (key in this.data) {
                        if (this.data.hasOwnProperty(key)) {
                            $('<input type="text" />').attr({
                                name: key,
                                value: String(this.data[key])
                            }).appendTo(form);
                        }
                    }
                }

                form.submit();

                return true;
            } // }}}
        }; // }}}

        /**
         * @constructor
         * @param {File} file
         * @param {string} [url]
         * send({complete: function, progress: function, name: string})
         * complete(responseText, file) in context of the XMLHttpRequest
         * progress(file) in context of the XMLHttpRequestUpload
         * @param {string} [options.name='file']
         * @param {string} [options.url]
         * @param {object} [options.data]
         * @param {function} [options.complete] function (file, responseText, xhr)
         * @param {function} [options.progress] function (file, value, xhr)
         */
        FileUpload.XHRUpload = function (file, url, options) { // {{{
            var self = this,
                xhr, complete, abort;

            if (!(window.FileList && window.FormData)) {
                throw 'Your browser does not support HTML5 file upload features';
            }

            if (typeof url === 'object') {
                options = url;
                url = undefined;
            }

            xhr = new XMLHttpRequest;
            options = options || {};

            this.isAborted = false;
            this.url = url || options.url;
            this.data = options.data;

            this.name = file.fileName || file.name;
            this.size = file.fileSize || file.size;

            this.abort = function () { // {{{
                if (!self.isAborted) {
                    self.isAborted = true;

                    try {
                        xhr.abort();
                    } catch (e) {
                        // IE 7 throws an error when trying to abort
                    }

                    if (typeof self.onabort === 'function') {
                        self.onabort.call(self);
                    }
                }
            } // }}}

            this.send = function () { // {{{
                var data;

                if (self.isAborted) {
                    return false;
                }

                // do not send empty files or folders
                if (file.size === 0) {
                    throw 'An empty file cannot be uploaded';
                }

                data = new FormData;
                data.append(options.name || 'file', file);

                if (this.data) {
                    for (key in this.data) {
                        if (this.data.hasOwnProperty(key)) {
                            data.append(key, String(this.data[key]));
                        }
                    }
                }

                // In Mozilla Firefox if you call abort when the readyState is 1,
                // 2, or 3 then as a result of that call the onreadystatechange
                // event handler is fired with readyState 4, then readyState is
                // changed to 0.
                // Other implementations (Opera 8.5, IE 6 with Microsoft.XMLHTTP)
                // simply abort and set readyState to 0, not firing any
                // onreadystatechange handler.
                // Source: https://groups.google.com/forum/?fromgroups=#!topic/mozilla.dev.tech.xml/dCV-F7ZuaOg
                xhr.onreadystatechange = function () {
                    if (this.readyState == 4 && !self.isAborted && typeof self.oncomplete === 'function') {
                        self.oncomplete.call(self, this.responseText);
                    }
                };

                xhr.onerror = function () {
                    if (typeof self.onerror === 'function') {
                        self.onerror.call(self);
                    }
                }

                if (typeof self.onprogress === 'function' && xhr.upload) {
                    xhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            self.onprogress.call(self, e.loaded / e.total);
                        }
                    }, false);
                }

                xhr.open('POST', self.url, true);
                xhr.send(data);

                return true;
            } // }}}
        }; // }}}

        /**
         * @constructor
         * @param {object} options
         * @param {number}   [options.tick=500]
         * @param {string}   [options.name] - przekazane do Transfer, wywolane w kontekscie tej kolejki
         * @param {function} [options.cleanup] - usuniecie zakonczonego transferu z kolejki
         * @param {function} [options.enqueue]
         * @param {function} [options.start]
         * @param {function} [options.queueComplete]
         */
        FileUpload.TransferQueue = function (options) { // {{{
            var defaultOptions = {
                tick: 500
            };

            options = $.extend({}, defaultOptions, options);

            var self = this,
                wait = false,
                tick = null,
                items = {
                    length: 0,
                    currentIndex: -1,
                    freeIndex: 0,
                    startIndex: 0,
                    nextIndex: null
                },
                position = 0,
                _complete, _abort;

            // number of already completed transfer items and not aborted
            // pending transfer items
            this.length = 0;

            _abort = function (item) {
                // do not abort already completed or aborted transfer items.
                // Items with id lower than currentIndex are considered already
                // completed.
                if (items.currentIndex <= item.index) {
                    delete items[item.index];
                    self.length = --items.length;

                    // when aborting current transfer decrease position by 1,
                    // so that next element receive the same position
                    if (items.currentIndex == item.index) {
                        --position;
                    }
                }
            }

            this.cleanup = function () {
                // remove all completed items from queue
                var i, item,
                    removed = 0,
                    startIndex = items.startIndex,
                    currentIndex = items.currentIndex,
                    currentItem = items[currentIndex];

                for (i = startIndex; i <= currentIndex; ++i) {
                    var item = items[i];
                    if (item && (i < currentIndex || item.isCompleted)) {
                        ++removed;
                        delete items[i];

                        if (typeof options.cleanup === 'function') {
                            options.cleanup.call(self, item.upload);
                        }
                    }
                }

                // update item numbering:
                // - set position to 0 if there is no currentItem or currentItem was
                //   processed before cleanup occured; after cleanup currentItem will
                //   be removed, and the next item (which will be a new currentItem)
                //   will have position set to 1
                // - set position to 1 if the processing of currentItem was finished
                //   after cleanup; currentItem will still be in the transfer queue,
                //   therefore position of the next item will be set to 2
                position = !currentItem || currentItem.isCompleted ? 0 : 1;

                // set start index to current index (all items at previous
                // indexes were removed)
                items.startIndex = Math.max(startIndex, currentIndex);

                // force re-calculation of nextIndex
                items.nextIndex = null;

                // update length of items collection
                items.length -= removed;
                self.length = items.length;
            }

            this.hasNext = function () {
                return self.__nextIndex() != -1;
            }

            self.__nextIndex = function () {
                var nextIndex = items.nextIndex;

                if (null === nextIndex) {
                    nextIndex = -1;

                    for (var i = items.currentIndex + 1, n = items.freeIndex; i < n; ++i) {
                        // some indexes in items collection may be invalid due to
                        // cleanup routine
                        if (items[i]) {
                            nextIndex = i;
                            break;
                        }
                    }

                    items.nextIndex = nextIndex;
                }

                return nextIndex;
            }

            _complete = function (item, callback, args) {
                var err;

                // force re-calculation of nextIndex, resume worker
                item.isCompleted = true;
                items.nextIndex = null;
                wait = false;

                // call complete callback
                if (typeof callback === 'function') {
                    try {
                        callback.apply(self, [item].concat(args));
                    } catch (err) {}
                }

                // notify if there are no more files to upload
                if (self.__nextIndex() == -1 && typeof options.queueComplete === 'function') {
                    options.queueComplete.call(self);
                }

                // rethrow error
                if (err) {
                    throw err;
                }
            }

            function prepareItem (item) {
                var upload = item.upload;

                upload.onabort = (function (onAbort) {
                    return function () {
                        _abort(item);
                        var args = Array.prototype.slice.apply(arguments);
                        _complete(item, onAbort, args);
                    }
                })(upload.onabort);

                upload.oncomplete = (function (onComplete) {
                    return function () {
                        var args = Array.prototype.slice.apply(arguments);
                        _complete(item, onComplete, args);
                    }
                })(upload.oncomplete);

                upload.onprogress = (function (onProgress) {
                    if (typeof onProgress === 'function') {
                        return function () {
                            var args = Array.prototype.slice.apply(arguments);
                            onProgress.apply(self, args);
                        }
                    }
                    return null;
                })(upload.onprogress);
            }

            self.__worker = function () { // {{{
                var index, item;

                if (!wait) {
                    index = self.__nextIndex();

                    if (index == -1) {
                        // transfer queue is empty
                        return;
                    }

                    item = items[index];
                    items.currentIndex = index;

                    wait = true;

                    prepareItem(item);

                    if (typeof options.start === 'function') {
                        options.start.call(self, item.upload, ++position);
                    }

                    try {
                        item.upload.send();
                    } catch (e) {
                        // skip to next item in queue
                        item.isCompleted = true;
                        items.nextIndex = null;
                        wait = false;

                        if (typeof options.error === 'function') {
                            options.error.call(self, item.upload, e);
                        }
                    }
                }
            } // }}}

            this.enqueue = function (upload) { // {{{
                var index = -1;

                if (upload && typeof upload === 'object') {
                    items.nextIndex = null;
                    index = items.freeIndex++;

                    items[index] = {
                        index: index,
                        upload: upload,
                        isCompleted: false
                    };

                    self.length = ++items.length;

                    if (typeof options.enqueue == 'function') {
                        options.enqueue.call(self, upload, index);
                    }
                }
                return index;
            } // }}}

            this.run = function () { // {{{
                if (null === tick) {
                    wait = false;
                    tick = setInterval(self.__worker, 500);
                }
            } // }}}

            this.stop = function() { // {{{
                if (null === tick) {
                    return;
                }

                clearInterval(id);
                tick = null;
            } // }}}
        } // }}}

        /**
         * Multiple file uploader for browsers without File API support
         * (Internet Explorer up to version 9)
         *
         * @constructor
         * @param {string|jQuery|element} selector
         * @param {string} url
         * @param {object} options
         * @param {string} [options.name='file']
         * @param {function} [options.enqueue]
         * @param {function} [options.start]
         * @param {function} [options.complete]
         * @param {function} [options.enqueueComplete]
         */
        FileUpload.LegacyUploader = function (selector, options) { // {{{
            options = options || {};

            var self = this,
                element = $(selector),
                queue = new FileUpload.TransferQueue(options);

            this.url = options.url;
            this.disabled = false;

            this.isDnDSupported = function () { // {{{
                return false;
            } // }}}

            this.queueSize = function () { // {{{
                return queue.length;
            } // }}}

            this.hasPendingUploads = function () { // {{{
                return queue.hasNext();
            } // }}}

            this.cleanQueue = function () { // {{{
                return queue.cleanup();
            } // }}}

            this.createFileInput = function () { // {{{
                var name = options.name ? options.name : 'file',
                    input = $('<input type="file" name="' + name + '"/>');

                input.bind('change', function() {
                    if (!self.disabled) {
                        var upload = new FileUpload.Transfer.FileInputUpload(this, self.url);

                        $.extend(upload, {
                            onprogress: options.progress,
                            oncomplete: options.complete,
                            onabort:    options.abort,
                            onerror:    options.error
                        });

                        // this file input is now owned by Transfer object, create
                        // a replacement for it and append it to original form, so
                        // that more files can be selected
                        $(this.form ? this.form : this.parentNode).append(self.createFileInput());

                        queue.enqueue(upload);

                        if (typeof options.enqueueComplete === 'function') {
                            options.enqueueComplete.call(self, 1);
                        }
                    }
                    return false;
                });

                input.bind('dragover drop', function() {
                    return false;
                });

                return input;
            } // }}}

            function _init() { // {{{
                $('<div class="file-input-wrapper"/>').append(
                    $('<form />').append(self.createFileInput())
                ).appendTo(element);

                queue.run();
            } // }}}

            _init();
        } // }}}

        FileUpload.Uploader = function (selector, options) { // {{{
            if (!(window.FileList && window.FormData)) {
                throw 'Your browser does not support HTML5 file upload features';
            }

            var self = this,
                element = $(selector),
                queue = new FileUpload.TransferQueue(options),
                // Opera (current version is 12.02) still does not support dropping
                // files onto file input. Proposals were made on official Opera forum
                // since Oct 2007, but to no avail.
                // See http://my.opera.com/community/forums/topic.dml?id=207628
                dnd = !window.opera;

            this.url = options.url;
            this.disabled = false;

            this.isDnDSupported = function () { // {{{
                return dnd;
            } // }}}

            this.queueSize = function () { // {{{
                return queue.length;
            } // }}}

            this.hasPendingUploads = function () { // {{{
                return queue.hasNext();
            } // }}}

            this.cleanQueue = function () { // {{{
                return queue.cleanup();
            } // }}}

            this.enqueueFiles = function (files) { // {{{
                if (!self.disabled && files.length) {
                    for (var i = 0, n = files.length; i < n; ++i) {
                        var upload = new FileUpload.XHRUpload(files[i], self.url);

                        $.extend(upload, {
                            onprogress: options.progress,
                            oncomplete: options.complete,
                            onabort:    options.abort,
                            onerror:    options.error
                        });

                        queue.enqueue(upload);
                    }
                    if (typeof options.enqueueComplete === 'function') {
                        options.enqueueComplete.call(self, files.length);
                    }
                }
            } // }}}

            function _init() { // {{{
                var form = $('<form />'),
                    input = $('<input type="file" multiple/>').appendTo(form);

                input.bind('change', function(e) {
                    if (this.files) {
                        self.enqueueFiles(this.files);
                    }
                    return false;
                });


                if (dnd) {
                    // need to access dataTransfer object, which is inaccessible if
                    // using jQuery events (at least on 1.5.1)
                    input[0].addEventListener('drop', function(e) {
                        if (e.dataTransfer && e.dataTransfer.files) {
                            self.enqueueFiles(e.dataTransfer.files);
                        }

                        // cancel event propagation, to prevent browser from opening
                        // dropped files
                        FileUpload.stopEvent(e);

                        // send an artificial event upwards to notify that a drop
                        // event occured
                        setTimeout(function() {
                            input.trigger('drop');
                        }, 1);
                    }, false);

                    // dropping file on INPUT[type=file] does not work in IE 7-9
                    element.bind('dragover', function() {
                        element.addClass('dragover');
                    });
                    element.bind('dragleave drop', function() {
                        element.removeClass('dragover');
                    });
                }

                element.append($('<div class="file-input-wrapper" />').each(function() {
                    this.addEventListener('dragover', function(e) {
                        if (e.dataTransfer) {
                            element.addClass('dragover');
                            e.dataTransfer.dropEffect = 'copy';
                            e.dataTransfer.effectAllowed = 'all';
                        }

                        FileUpload.stopEvent(e);
                    }, false);
                }).append(form));

                queue.run();
            } // }}}

            _init();
        } // }}}

            return window.FileUpload = FileUpload;

        }(window.jQuery, window));
        return FileUpload;
    })(),
    I18n: (function() {
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
                    dropDirTooltip:     'Przenieś <strong>{source}</strong> do <strong>{target}</strong>',
                    noDropDirTooltip:   'Przenieś <strong>{source}</strong>'
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
                    aclNoUsers:         'Nie wybrano użytkowników',
                    userSearch:         'Szukaj użytkownika',
                    userAdd:            'Add',
                    userDelete:         'Remove',
                    searchHint:         'Możesz wyszukać użytkownika wpisując jego imię i nazwisko, adres e-mail albo jego identyfikator w bazie danych.',
                    messageSending:     'Wysyłanie danych...',
                    messageError:       'Wystąpił nieoczekiwany błąd',
                    messageSuccess:     'Ustawienia udostępniania zostały zapisane'
                },
                opOpenFile: {
                    opname:             'Open'
                },
                opEditFile: {
                    opname:             'Edit',
                    title:              'Edit file metadata',
                    submit:             'Save',
                    messageSuccess:     'Metadane pliku zostały zapisane'
                },
                opRenameFile: {
                    opname:             'Rename'
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
        return I18n;
    })(),
    StickToBottom: (function() {
        /**
         * Makes the selected element sticked to the bottom of the browser's window in
         * a situation in which it would, due to page scrolling, disappear from view.
         *
         * @param {string|DOMElement|jQuery} selector
         * @constructor
         * @version 2013-06-24 / 2013-01-15
         */
        function StickToBottom(selector) {
            var self = this,
                $ = window.jQuery;

            // extract the first element from set, do not use .first() as it
            // is not available in jQuery versions prior to 1.4
            if (selector instanceof $) {
                self._target = $(selector.get(0));
            } else {
                self._target = $($(selector).get(0));
            }

            if (!self._target.parent().length) {
                throw new Error("Target element is detached from DOM tree");
            }

            self._target.each(function() {
                // copy original inline css properties to be restored when
                // jumping back into page flow
                var style = this.style;

                self._position = style.position;
                self._width = style.width;
            });

            self._anchor = $('<div class="stick-to-bottom-anchor"/>');
            self._anchor.insertBefore(self._target).css('width', self._width);

            self._window = $(window).bind('resize scroll', function() {
                self.updatePosition();
            });

            self._target.data('StickToBottom', self);
            self._disabled = false;

            self.updatePosition();
        }

        StickToBottom.prototype.updatePosition = function() {
            var target = this._target,
                anchor = this._anchor;

            if (this._disabled) {
                return;
            }

            if (!target.is(':visible')) {
                anchor.height(0);
                return;
            }

            var win = this._window,
                height = target.outerHeight(),
                // Fixed: margin-top support
                marginTop = parseInt(target.css('marginTop')) || 0;

            if (anchor.offset().top + height - win.scrollTop() + marginTop > win.height()) {
                // by setting position:fixed element jumps out of page flow,
                // therefore its width must be adjusted to be the same as the
                // width within the original page flow.

                // Fixed: outerWidth() instead of width()
                target.outerWidth(anchor.width());

                // attach target to bottom of the viewport
                target.css({position: 'fixed', bottom: 0});

                // make the height of anchor element equal to the height of target
                // element to avoid scrollbar discontinuity. Anchor element is
                // outside of the viewport, so it can be shown safely.
                anchor.height(height);

            } else {
                // restore original position and width properties
                target.css({
                    position: this._position,
                    width: this._width
                });
                anchor.height(0);
            }
        }

        StickToBottom.prototype.enable = function() {
            this._disabled = false;
            this.updatePosition();
        }

        StickToBottom.prototype.disable = function() {
            this._disabled = true;
            this._target.css({
                position: this._position,
                width: this._width
            });
            this._anchor.height(0);
        }
        return StickToBottom;
    })(),
    Uploader: (function() {
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
        return Uploader;
    })(),
    UserPicker: (function() {
        /**
         * Widget wyboru uzytkownikow i okreslenia dla kazdego z nich praw dostepu.
         *
         * Element wskazany selektorem musi zawierac elementy zawierajace atrybut
         * data-hook o wartosciach 'userSearch', 'userAdd', 'userList', wskazujace
         * odpowiednio na pole tekstowe do wpisywania nazwy uzytkownika, przycisk
         * dodajacy uzytkownika do listy, liste wybranych uzytkownikow. Opcjonalny
         * jest element o atrybucie data-hook 'emptyListMessage' reprezentujacy
         * element listy niepowiazany z zadnym uzytkownikiem, sluzacy jedynie do
         * wyswietlenia komunikatu o pustej liscie wybranych uzytkownikow.
         *
         * Dodanie uzytkownika do listy wybranych wywoluje zdarzenie 'append'
         * z wartoscia pola relatedNode wskazujaca na bezposredniego rodzica
         * w drzewie dokumentu. Proba dodania uzytkownika, ktory jest juz na liscie
         * wywoluje zdarzenie 'exists'. Usuniecie uzytkownika wywoluje zdarzenie
         * 'remove' z wartoscia pola relatedNode wskazujacego na bezposredniego
         * rodzica usuwanego elementu.
         *
         * @param {string|jQuery|Element} selector
         * @param {function} itemBuilder   funkcja tworzace element reprezentujacy
         *                                 uzytkownika na liscie
         * @param {object} [options]       ustawienia dodatkowe
         * @param {string} [options.url]   zrodlo danych do autouzupelniania
         * @param {int}    [options.limit] limit liczby elementow
         * @param {Array}  [options.users] poczatkowa lista uzytkownikow
         * @constructor
         * @requires Viewtils
         * @version 2014-04-17 / 2013-07-20 / 2012-12-27
         */
        var UserPicker = function(selector, itemBuilder, options) { // {{{
            var $ = window.jQuery,
                self = this,
                container = $(selector),
                hooks,
                users,
                selected,
                term;

            options = $.extend(true, {}, UserPicker.defaults, options);

            function init() {
                users = {length: 0, data: {}};
                hooks = Viewtils.hooks(container, {
                    required: ['userSearch', 'userAdd', 'userList'],
                    wrapper: $
                });

                // czas zamkniecia listy autouzupelniania
                var closeTime;

                // zainicjuj autouzupelnianie pola do wpisywania danych uzytkownika,
                // przycisk dodajacy uzytkownika do listy wybranych jest odblokowywany
                // po wybraniu uzytkownika, po dodaniu uzytkownika jest blokowany,
                // wartosc pola do wpisywania jest czyszczona
                hooks.userSearch.autocomplete($.extend({}, options.autocomplete, {
                    open: function(event, ui) {
                        closeTime = null;
                    },
                    close: function(event, ui) {
                        closeTime = event.timeStamp;
                    },
                    source: options.url || [],
                    select: function(event, ui) {
                        hooks.userAdd.removeClass('disabled').prop('disabled', false);
                        selected = ui.item;
                        return false;
                    },
                    beforeSend: function(request) {
                        hooks.userAdd.addClass('disabled').prop('disabled', true);
                        selected = null;

                        term = $.trim(request.term);
                        if (!term.match(/^\d+$/) && term.length < 2) {
                            return false;
                        }
                    }
                }));

                // zablokuj zdarzenie keydown jezeli wcisnieto Enter, aby zablokowac
                // przesylanie formularza. Jezeli wybrano uzytkownika, a lista
                // sugestii zostala zamknieta, wcisniecie Enter dodaje uzytkownika
                // do listy wybranych
                hooks.userSearch.keydown(function(e) {
                    if (e.keyCode == 13) { // Enter
                        // Trzeba zbadac, czy to zdarzenie odpowiada za jednoczesny
                        // wybor uzytkownika z listy sugestii i jej zamkniecie (A),
                        // czy za dodanie uprzenio wybranego z listy sugestii
                        // uzytkownika wyswietlonego w polu tekstowym do listy
                        // wybranych uzytkownikow, w momencie gdy lista sugestii
                        // jest zamknieta (B).
                        // Trudnosc polega na tym, ze wraz ze zdarzeniem
                        // autocompleteclose, wywolanym przez wcisniecie klawisza
                        // Enter, puszczane jest rowniez zdarzenie keydown.
                        // Aby rozroznic sytuacje A od B badany zostaje czas
                        // wystapienia zdarzenia. Jezeli zdarzenie keydown wystapilo
                        // nie wczesniej niz 75ms od zamkniecia listy sugestii uznaj,
                        // ze jest to zdarzenie dodajace uzytkownika do listy
                        // wybranych (B).
                        if (selected && closeTime && (e.timeStamp - closeTime >= 75)) {
                            self.addUser(selected);
                            selected = null;

                            this.value = '';
                            hooks.userAdd.addClass('disabled').prop('disabled', true);
                        }
                        return false;
                    }
                });

                // dodaj aktualnie wybranego uzytkownika do listy
                hooks.userAdd.click(function() {
                    var j = $(this);

                    if (j.hasClass('disabled')) {
                        return;
                    }

                    if (selected) {
                        self.addUser(selected);
                        selected = null;
                    }

                    j.addClass('disabled').prop('disabled', true);
                    hooks.userSearch.val('');
                });

                // na poczatku przycisk dodawania jest zablokowany
                hooks.userAdd.addClass('disabled').prop('disabled', true);

                // dodaj uzytkownikow do listy, poczatkowe wypelnianie listy
                if (options.users) {
                    $.each(options.users, function(key, user) {
                        self.addUser(user, false);
                    });
                }
            }

            /**
             * Jezeli uzytkownik nie znajduje na liscie wybranych uzytkownikow,
             * tworzy reprezentujacy go element i zapisuje go w polu .element.
             * Jezeli uzytkownik byl juz dodany reprezentujacy go element zostaje
             * podswietlony.
             * @param {object} user
             */
            this.addUser = function(user, _isInitialValue) {
                var element,
                    elementHtml,
                    elementHooks;

                if (user[options.idColumn] in users.data) {
                    // uzytkownik o podanym id jest juz dodany do listy, wywolaj
                    // zdarzenie o tym informujace
                    users.data[user[options.idColumn]].element.trigger('exists');

                } else {
                    if (options.limit > 0 && users.length == options.limit) {
                        return false;
                    }

                    elementHtml = itemBuilder(user);

                    // jezeli itemBuilder zwroci false, oznacza to, ze element nie
                    // moze zostac dodany.
                    if (false === elementHtml) {
                        return false;
                    }

                    element = $(elementHtml);
                    elementHooks = Viewtils.hooks(element, {wrapper: $});

                    if (elementHooks.userDelete) {
                        elementHooks.userDelete.click(function() {
                            delete users.data[user[options.idColumn]];
                            --users.length;

                            hooks.userSearch.removeClass('disabled').prop('disabled', false);

                            // usun element z dokumentu i wywolaj zdarzenie informujace
                            // o usunieciu elementu. Event ma ustawione pole relatedNode
                            // wskazujace na rodzica, od ktorego zostal odlaczony.
                            // http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#event-type-DOMNodeRemoved
                            var parentNode = element.get(0).parentNode;

                            element.trigger({
                                type: 'beforeRemove'
                            });
                            element.remove().trigger({
                                type: 'remove',
                                relatedNode: parentNode
                            });
                            container.trigger('itemRemove', [user, element]);

                            // usun referencje do elementu aby ulatwic odsmiecanie
                            element = null;

                            delete user.element;
                            user = null;

                            if (!users.length && hooks.emptyListMessage) {
                                hooks.emptyListMessage.appendTo(hooks.userList);
                            }
                        });
                    }

                    if (!users.length && hooks.emptyListMessage) {
                        hooks.emptyListMessage.remove();
                    }

                    users.data[user[options.idColumn]] = user;
                    ++users.length;

                    user.element = element;
                    hooks.userList.append(element);

                    // wywolaj zdarzenie append informujace element, ze zostal dodany
                    // do drzewa dokumentu
                    // http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#event-type-DOMNodeInsertedIntoDocument
                    element.trigger({
                        type: 'append',
                        relatedNode: hooks.userList.get(0),
                        isInitialValue: _isInitialValue
                    });

                    container.trigger('itemAdd', [user, element, _isInitialValue]);

                    if (options.limit == users.length) {
                        hooks.userSearch.addClass('disabled').prop('disabled', true);
                    }
                }
            }

            init();
        } // }}}

        UserPicker.defaults = {
            idColumn: 'id',
            autocomplete: {}
        };
        return UserPicker;
    })(),
    Util: (function() {
        /**
         * @namespace
         * @version 2014-05-24 / 2013-01-13
         */
        var Util = {}

        Util.interp = function (template, vars, esc) { // {{{
            // string interpolation, compatible with URI-Template (RFC 6570) delimiters
            vars = vars || {};
            return String(template).replace(/\{([_0-9a-z]+)\}/ig, function (match, key) {
                return esc ? esc(vars[key]) : vars[key];
            });
        } // }}}

        Util.uri = function (template, vars) { // {{{
            vars = vars || {};
            return String(template).replace(/:([_0-9a-z]+)/ig, function (match, key) {
                return escape(vars[key]);
            });
        } // }}}

        Util.gotoHash = function (hash) { // {{{
            var p = document.location.href.lastIndexOf('#'),
                h = p == -1 ? document.location.href : document.location.href.substr(0, p);
            document.location.href = h + (hash.charAt(0) != '#' ? '#' : '') + hash;
        } // }}}

        Util.assert = function (cond, message) { // {{{
            if (!cond) {
                alert(message);
                throw message;
            }
        } // }}}

        Util.render = function (id, vars, wrapper) { // {{{
            var template = Drive.Templates[id];

            Util.assert(typeof template === 'function', 'Template not found: ' + id);

            if (typeof vars === 'function') {
                vars = null;
                wrapper = vars;
            }

            Handlebars.registerHelper('fileSize', function (text) {
                return Viewtils.fsize(text);
            });

            // Backwards compatibility with Mustache.js 0.4.x
            //var fn = Mustache.render ? 'render' : 'to_html',
            //    out = Mustache[fn](template, vars || {});
            // Mustache sucks
            var out = template(vars);

            return typeof wrapper === 'function' ? wrapper(out) : out;
        } // }}}

        Util.i18n = function (key) { // {{{
            var keys = key.split('.'),
                context = Drive.I18n;

            function helper(str) {
                if (typeof str === 'string') {
                    return new Handlebars.SafeString(str);
                } else if (typeof str === 'object' && str !== null) {
                    var output = {};
                    $.each(str, function (k, v) {
                        output[k] = helper(v);
                    });
                    return output;
                }
                return str;
            }

            while (keys.length) {
                var k = keys.shift();

                if (context[k]) {
                    context = context[k];
                } else {
                    break;
                }

                if (!keys.length) {
                    return helper(context);
                }
            }

            return key;
        } // }}}

        Util.dropdown = function(items, options) { // {{{
            var container,
                ul,
                id;

            options = $.extend({}, options);

            id = options.id || ('dropdown-' + String(Math.random()).substr(2));

            container = $('<div class="dropdown"><a href="#' + id + '" data-toggle="dropdown">' + Viewtils.esc(options.title || '') + ' <span class="caret"></span></a></div>');
            container.attr('id', id);

            if (options.containerClass) {
                container.addClass(options.containerClass);
            }

            ul = $('<ul class="dropdown-menu"/>').appendTo(container);
            ul.on('focus', 'a.disabled', function () {
                this.blur();
            });
            ul.on('click', 'a.disabled', function () {
                return false;
            });

            if (options.menuClass) {
                ul.addClass(options.menuClass);
            }

            // due to its more specific name, Bootstrap 3 dropdown menu alignment class
            // is used (.dropdown-menu-right instead of more general .pull-right)
            if (options.right) {
                ul.addClass('dropdown-menu-right');
            }
            if (options.tip) {
                ul.addClass('has-tip');
            }

            $.each(items, function (key, item) {
                if (item) {
                    var a = $('<a href="#!"/>').text('' + item.title);

                    if (item.disabled) {
                        a.addClass('disabled');
                    } else {
                        if (item.url) {
                            a.attr('href', item.url);
                        }

                        if (typeof item.click === 'function') {
                            a.click(item.click);
                        }
                    }

                    $('<li/>').append(a).appendTo(ul);
                }
            });

            return container;
        } // }}}
        return Util;
    })(),
    View: (function() {
        /**
         * @constructor
         */
        var View = function (element, requiredHooks) { // {{{
            this.element = element;
            this.hooks = this.extractHooks(element, requiredHooks);
            this.childViews = {};
        } // }}}

        /**
         * @param {string} parentHook
         * @param {View} view
         */
        View.prototype.inject = function (parentHook, view) { // {{{
            if (this.hooks[parentHook]) {
                if (view.element.length != 1) {
                    throw parentHook + ": Injected view must contain only a single tree of elements";
                }

                this.childViews[parentHook] = view;
                this.hooks[parentHook].replaceWith(view.element);
                this.hooks[parentHook] = view.element;

                return this;
            }

            throw "Parent hook '" + parentHook + "' is not defined";
        } // }}}

        View.prototype.extractHooks = function (element, required) { // {{{
            return Viewtils.hooks(element, {
                required: required,
                wrapper: window.jQuery
            });
        } // }}}
        return View;
    })(),
    Templates: (function() {
        var Templates = {
            "Uploader": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


          buffer += "<div id=\"drive-uploader\">\n<div id=\"drive-uploader-dialog\" data-hook=\"dialog-content\">\n<div id=\"drive-uploader-dropzone\" data-hook=\"drop-zone-pane\">\n<div class=\"uploader\" data-hook=\"drop-zone\">\n<div class=\"drop-here\" data-hook=\"drop-zone-text\"></div>\n</div>\n</div>\n<div id=\"drive-uploader-queue\" data-hook=\"queue-pane\">\n<table id=\"drive-uploader-queue-items\">\n<tbody data-hook=\"items\"></tbody>\n</table>\n<div class=\"no-items-message\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.noItems)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n</div>\n</div>\n<div id=\"drive-uploader-status\">\n<div id=\"drive-uploader-status-icon\"></div>\n<div id=\"drive-uploader-status-content\">\n<h3>\n<span class=\"name\" data-hook=\"item-name\"></span>\n<span class=\"size\" data-hook=\"item-size\"></span>\n</h3>\n<p data-hook=\"status-message\"></p>\n</div>\n<div id=\"drive-uploader-status-button\">\n<button class=\"seamless\" data-hook=\"open-button\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.openButtonText)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</button>\n</div>\n</div>\n</div>";
          return buffer;
          }

        ),
            "Uploader.queueItem": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


          buffer += "<tr>\n<td class=\"col-filename\">\n<span class=\"filename\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"error-message\" data-hook=\"error-message\"></span>\n</td>\n<td class=\"col-size\">"
            + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options) : helperMissing.call(depth0, "fileSize", ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options)))
            + "</td>\n<td class=\"col-progress\">\n<span class=\"progress-text\" data-hook=\"progress-text\"></span>\n<span class=\"progress-bar\"><span class=\"bar\" data-hook=\"progress-bar\"></span></span>\n</td>\n<td class=\"col-cancel\">\n<button class=\"seamless\" data-hook=\"cancel-button\" title=\""
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.cancelButtonTooltip)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\"></button>\n</td>\n</tr>";
          return buffer;
          }

        ),
            "DirBrowser.loading": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};



          return "Loading directory contents...";
          }

        ),
            "DirBrowser.main": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};



          return "<div data-hook=\"disk-usage\"></div>\n<h1 id=\"drive-dir-name\" data-hook=\"dir-name\"></h1>\n<div id=\"opnav\">\n<div id=\"drive-loading\" data-hook=\"message-area\"></div>\n<div id=\"drive-dir-menu\" data-hook=\"aux-menu\"></div>\n</div>\n<div data-hook=\"dir-contents\"></div>\n<div data-hook=\"uploader\"></div>";
          }

        ),
            "DirBrowser.diskUsage": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


          buffer += "<div id=\"drive-du\">\n<div class=\"pane\">\n<div class=\"progress-bar\">\n<div class=\"bar\" data-hook=\"progress-bar\" data-level-template=\"bar-{level}\"></div>\n</div>\n<dl class=\"used\">\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.used)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>\n<span data-hook=\"used\">"
            + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.used), options) : helperMissing.call(depth0, "fileSize", (depth0 && depth0.used), options)))
            + "</span>\n<span class=\"percent\">(<span data-hook=\"percent\"></span>%)</span>\n</dd>\n</dl>\n<dl class=\"available\">\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.available)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd data-hook=\"available\"></dd>\n</dl>\n</div>\n</div>";
          return buffer;
          }

        ),
            "DirBrowser.auxMenu": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

        function program1(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\">";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program3(depth0,data) {

          var buffer = "", stack1, helper, options;
          buffer += "\n<li id=\"drive-more-ops\" class=\"dropdown\">\n<a href=\"#drive-more-ops\" data-toggle=\"dropdown\">\n"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.moreOps)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + " <span class=\"caret\"></span>\n</a>\n<ul class=\"dropdown-menu dropdown-menu-right has-tip\">\n";
          options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
          if (helper = helpers.moreOps) { stack1 = helper.call(depth0, options); }
          else { helper = (depth0 && depth0.moreOps); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
          if (!helpers.moreOps) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n</ul>\n</li>\n";
          return buffer;
          }

          buffer += "<ul>\n";
          options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
          if (helper = helpers.ops) { stack1 = helper.call(depth0, options); }
          else { helper = (depth0 && depth0.ops); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
          if (!helpers.ops) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.moreOps)),stack1 == null || stack1 === false ? stack1 : stack1.length), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n</ul>";
          return buffer;
          }

        ),
            "DirBrowser.dirContents": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


          buffer += "<div id=\"drive-dir-contents\">\n<table>\n<thead data-hook=\"header\"></thead>\n<tbody data-hook=\"updir\"></tbody>\n<tbody data-hook=\"subdirs\"></tbody>\n<tbody data-hook=\"files\"></tbody>\n</table>\n<div class=\"no-items-message\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.noItems)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n</div>";
          return buffer;
          }

        ),
            "DirBrowser.dirContents.header": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


          buffer += "<tr>\n<th class=\"col-grab\"></th>\n<th class=\"col-icon\"></th>\n<th class=\"col-name\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</th>\n<th class=\"col-owner\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</th>\n<th class=\"col-size\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.size)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</th>\n<th class=\"col-mtime\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</th>\n<th class=\"col-ops\"></th>\n</tr>";
          return buffer;
          }

        ),
            "DirBrowser.dirContents.updir": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


          buffer += "<tr>\n<td class=\"col-grab\"></td>\n<td class=\"col-icon\"></td>\n<td class=\"col-name\" colspan=\"5\">\n<span title=\""
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\" class=\"dir\" data-hook=\"name\">..</span>\n</td>\n</tr>";
          return buffer;
          }

        ),
            "DirBrowser.dirContents.subdir": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

        function program1(depth0,data) {

          var buffer = "", stack1;
          buffer += "\n<div class=\"dropdown\">\n<div data-toggle=\"dropdown\" class=\"dropdown-toggle\"><span class=\"caret\"></span></div>\n<ul class=\"dropdown-menu dropdown-menu-right has-tip\">\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.share)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.rename)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.details)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.remove)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n</ul>\n</div>\n";
          return buffer;
          }
        function program2(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-share-alt\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program4(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-font\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program6(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-list\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program8(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li class=\"divider\"></li>\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-trash-o\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

          buffer += "<tr>\n<td class=\"col-grab\" data-hook=\"grab\"></td>\n<td class=\"col-icon\"><span class=\"drive-icon drive-icon-folder\" data-hook=\"icon\"></span></td>\n<td class=\"col-name\">\n<span title=\""
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\" data-hook=\"name\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n</td>\n<td class=\"col-owner\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</td>\n<td class=\"col-size\"></td>\n<td class=\"col-mtime\">\n<div class=\"full\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['short'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n<div class=\"date-only\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1.date)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n</td>\n<td class=\"col-ops\">\n";
          stack1 = helpers['if'].call(depth0, (depth0 && depth0.ops), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n</td>\n</tr>";
          return buffer;
          }

        ),
            "DirBrowser.dirContents.file": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

        function program1(depth0,data) {

          var buffer = "", stack1;
          buffer += "\n<div class=\"dropdown\">\n<div data-toggle=\"dropdown\" class=\"dropdown-toggle\"><span class=\"caret\"></span></div>\n<ul class=\"dropdown-menu dropdown-menu-right has-tip\">\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.open)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.edit)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.rename)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.details)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.ops)),stack1 == null || stack1 === false ? stack1 : stack1.remove)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n</ul>\n</div>\n";
          return buffer;
          }
        function program2(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-download\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program4(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-pencil\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program6(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-font\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program8(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-list\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

        function program10(depth0,data) {

          var buffer = "", stack1, helper;
          buffer += "\n<li class=\"divider\"></li>\n<li><a href=\"#!\" data-op=\"";
          if (helper = helpers.op) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.op); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "\"><i class=\"fa fa-trash-o\"></i> ";
          if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
          else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
          buffer += escapeExpression(stack1)
            + "</a></li>\n";
          return buffer;
          }

          buffer += "<tr>\n<td class=\"col-grab\" data-hook=\"grab\"></td>\n<td class=\"col-icon\"><span class=\"drive-icon drive-icon-"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.filter)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\" data-hook=\"icon\"></span></td>\n<td class=\"col-name\">\n<span title=\""
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\" data-hook=\"name\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n</td>\n<td class=\"col-owner\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</td>\n<td class=\"col-size\">"
            + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options) : helperMissing.call(depth0, "fileSize", ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options)))
            + "</td>\n<td class=\"col-mtime\">\n<div class=\"full\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['short'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n<div class=\"date-only\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1.date)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n</td>\n<td class=\"col-ops\">\n";
          stack1 = helpers['if'].call(depth0, (depth0 && depth0.ops), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += "\n</td>\n</tr>";
          return buffer;
          }

        ),
            "DirBrowser.opShareDir": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


          buffer += "<div id=\"drive-dir-share\">\n<form class=\"form\">\n<div id=\"drive-dir-share-vis\">\n<label for=\"drive-dir-share-visibility\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visLabel)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</label>\n<table>\n<tr>\n<td>\n<select name=\"visibility\" id=\"drive-dir-share-visibility\">\n<option value=\"private\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptPrivate)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</option>\n<option value=\"usersonly\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptUsersonly)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</option>\n<option value=\"public\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptPublic)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</option>\n<option value=\"inherited\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visOptInherited)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</option>\n</select>\n</td>\n<td style=\"padding-left:6px\">\n<div id=\"drive-dir-share-vis-desc-private\" class=\"vis-desc\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescPrivate)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n<div id=\"drive-dir-share-vis-desc-usersonly\" class=\"vis-desc\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescUsersonly)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n<div id=\"drive-dir-share-vis-desc-public\" class=\"vis-desc\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescPublic)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n<div id=\"drive-dir-share-vis-desc-inherited\" class=\"vis-desc\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.visDescInherited)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n</td>\n</tr>\n</table>\n</div>\n<div id=\"drive-dir-share-acl\">\n<label for=\"drive-dir-share-acl-search-user\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.aclLabel)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</label>\n<div id=\"drive-dir-share-acl-users\">\n<div class=\"highlight\"></div>\n<table>\n<tbody data-hook=\"user-list\">\n<tr data-hook=\"empty-list-message\">\n<td colspan=\"3\" class=\"no-users\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.aclNoUsers)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</td>\n</tr>\n</tbody>\n</table>\n</div>\n<div id=\"drive-dir-share-acl-search\">\n<table>\n<tr>\n<td>\n<input type=\"text\" id=\"drive-dir-share-acl-search-user\" data-hook=\"user-search\" placeholder=\""
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.userSearch)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\" />\n</td>\n<td>\n<button type=\"button\" class=\"btn btn-primary disabled\" data-hook=\"user-add\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.userAdd)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</button>\n</td>\n</tr>\n</table>\n<div class=\"hint\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.searchHint)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n</div>\n</div>\n</form>\n</div>";
          return buffer;
          }

        ),
            "DirBrowser.opShareDir.user": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

        function program1(depth0,data) {


          return "selected";
          }

          buffer += "<tr>\n<td class=\"user-name\">\n<div class=\"user-name-fn\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.first_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + " "
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.last_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n<div class=\"user-name-un\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.username)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</div>\n</td>\n<td class=\"user-perms\">\n<select name=\"shares["
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.user_id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "]\">\n<option value=\"0\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.aclRead)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</option>\n<option value=\"1\"";
          stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.can_write)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}));
          if(stack1 || stack1 === 0) { buffer += stack1; }
          buffer += ">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.aclReadWrite)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</option>\n</select>\n</td>\n<td class=\"user-delete\">\n<button type=\"button\" data-hook=\"user-delete\" title=\""
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.userDelete)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\">&times;</button>\n</td>\n</tr>";
          return buffer;
          }

        ),
            "DirBrowser.opShareDir.userAutocomplete": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

        function program1(depth0,data) {

          var buffer = "", stack1;
          buffer += " ("
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.username)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + ")";
          return buffer;
          }

          buffer += escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.first_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + " "
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.last_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "\n";
          stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.user)),stack1 == null || stack1 === false ? stack1 : stack1.username), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
          if(stack1 || stack1 === 0) { buffer += stack1; }
          return buffer;
          }

        ),
            "DirBrowser.opDirDetails": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


          buffer += "<div id=\"drive-dir-details\">\n<dl>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd><span class=\"owner\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + " ("
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + ")</span></dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"sep\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"user\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.modified_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n</div>\n</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"sep\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"user\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.dir)),stack1 == null || stack1 === false ? stack1 : stack1.created_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n</div>\n</dd>\n</dl>\n</div>";
          return buffer;
          }

        ),
            "DirBrowser.opFileDetails": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
          this.compilerInfo = [4,'>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
          var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


          buffer += "<div id=\"drive-file-details\">\n<dl>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd><span class=\"owner\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + " ("
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.owner)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + ")</span></dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mtime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"sep\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"user\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.modified_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n</div>\n</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.ctime)),stack1 == null || stack1 === false ? stack1 : stack1['long'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"sep\">"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.timeSeparator)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n<span class=\"user\">"
            + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.created_by)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</span>\n</div>\n</dd>\n<dt>ID</dt>\n<dd>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.size)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>"
            + escapeExpression((helper = helpers.fileSize || (depth0 && depth0.fileSize),options={hash:{},data:data},helper ? helper.call(depth0, ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options) : helperMissing.call(depth0, "fileSize", ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.size), options)))
            + "</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.mimetype)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.mimetype)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.md5sum)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.md5sum)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dd>\n<dt>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.str)),stack1 == null || stack1 === false ? stack1 : stack1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</dt>\n<dd><code>"
            + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.file)),stack1 == null || stack1 === false ? stack1 : stack1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
            + "</code></dd>\n</dl>\n</div>";
          return buffer;
          }

        )
        };
        return Templates;
    })()
}; return Drive; });
