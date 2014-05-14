var Drive = {
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

            self._options = $.extend({}, options);

            // zainicjuj interpolatory stringow
            self._strInterp = new Viewtils.Interp;
            // TODO self._uriInterp = new Viewtils.Interp({esc: escape});

            // zainicjuj widok
            self._initView(selector);

            // zainicjuj widget informujacy o stanie zajetosci dysku
            self._initDiskUsage();

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
            self._dropTargets = [];

            // etykieta wyswietlana podczas przenoszenia katalogu lub pliku
            // z informacja o docelowej operacji
            self._grabTooltip = $('<div class="drive-grablabel"/>').css('display', 'none').appendTo('body');

            self._initWidthChecker();

            // dodaj obsluge klikniec w elementy posiadajace atrybut data-url
            self._view.element.on('click', '[data-url]', function() {
                document.location.href = this.getAttribute('data-url');
            });

            // ustaw referencje do tego obiektu w powiazanym elemencie drzewa
            self._view.element.data('DirBrowser', self);

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

        DirBrowser.prototype._initView = function (selector) { // {{{
            var element = this.$(selector).first(),
                view;

            element.append(this._renderTemplate('DirBrowser'));
            view = new Drive.View(element, [
                'title', 'messageArea', 'auxMenu', 'dirContents',
                'uploader', 'diskUsage'
            ]);

            this._view = view;
        } // }}}

        DirBrowser.prototype._initDiskUsage = function () { // {{{
            var str = Drive.Util.i18n('DirBrowser.diskUsage'),
                element = this._renderTemplate('DirBrowser.diskUsage', {str: str}),
                view = new Drive.View(element, [
                    'used', 'available'
                    // opcjonalne: 'percent', 'progressBar'
                ]),
                progressBar = view.hooks.progressBar;

            // szybsze niz .hide()
            element.css('display', 'none');

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
        } // }}}

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

            // pokaz, o ile to konieczne, element ukryty podczas inicjalizacji widoku
            if ('none' === element.css('display')) {
                element.css('display', '');
            }
        } // }}}

        DirBrowser.prototype._initUploader = function () { // {{{
            var self = this,
                uploader = new Drive.Uploader({
                    // na poczatku upload plikow jest nieaktywny, poniewaz url
                    // nie jest ustawiony
                    disabled: true
                });

            // umiesc wyrenderowany widok w miejscu wskazanym przez hook uploadQueue
            uploader.injectInto('uploader', self._view);
            uploader.bind('uploadsuccess', function (response) {
                self.addFile(response);
                self._currentDir.files.push(response);

                // zaktualizuj informacje o zajmowanym miejscu na dysku:
                // odpowiedz musi zawierac pola disk_usage i quota
                self._updateDiskUsage(response.disk_usage, response.quota);
            });

            self._uploader = uploader;
        } // }}}

        DirBrowser.prototype._initBreadcrumbs = function() { // {{{
            // wrap() tworzy kopie elementu danego jako otaczajacy, bez wzgledu
            // na to czy podano go jako string, czy jako element drzewa
            var $ = this.$,
                options = this._options.breadcrumbs,
                selector,
                element,
                current,
                currentClass,
                separator;

            // jezeli nie podano konfiguracji okruchow, nie inicjuj ich
            if (!options) {
                return;
            }

            // selector - element zawierajacy okruchy
            selector = 'string' === typeof options ? options : options.selector;

            // currentClass - klasa, ktora oznaczony jest element wskazujacy aktualna
            // pozycje w sladzie okruchow
            currentClass = options.currentClass || 'current';

            // separator - ciag znakow do separowania linkow w sladzie okruchow
            separator = options.separatorClass || '<span class="separator"></span>';

            current = $(selector).find('.' + currentClass);

            if (!current.size()) {
                throw new Error('Element with class \'' + currentClass + '\' not found');
            }

            var element = $('<span/>');

            element.insertBefore(current); // replaceWith usuwa obsluge zdarzen
            current.appendTo(element);

            this._breadcrumbs = {
                selector: selector,
                element: element,
                separator: separator,
                currentClass: currentClass
            };
        } // }}}

        DirBrowser.prototype._updateBreadcrumbs = function(dir) { // {{{
            var self = this,
                breadcrumbs = self._breadcrumbs,
                contents,
                separator;

            if (!breadcrumbs) {
                return;
            }

            function dirLink(dir) {
                var attrs = {
                        href: self._dirUrl(dir) //,
                        //'data-dir': dir.id
                    };

                if (dir.perms.write) {
                    attrs['data-drop-dir'] = dir.id;
                }

                return '<a' + Viewtils.attrs(attrs) + '>' + Viewtils.esc(dir.name) + '</a>';
            }

            contents = [];

            if (dir.parents) {
                for (i = dir.parents.length - 1; i >= 0; --i) {
                    contents.push(dirLink(dir.parents[i]));
                }
            }

            contents.push('<span class="' + breadcrumbs.currentClass + '">' + Viewtils.esc(dir.name) + '</span>');

            breadcrumbs
                .element
                .html(contents.join(' ' + breadcrumbs.separator + ' '))
                .find('[data-drop-dir]').each(function() {
                    self._dropTargets.push(this);
                });
        } // }}}

        DirBrowser.prototype._updateAuxmenu = function(dir) { // {{{
            var $ = this.$,
                self = this,
                menu = [];

            if (self._options.disableAuxmenu) {
                return;
            }

            if (dir.perms.write) {
                menu.push({
                    title: Drive.Util.i18n('DirBrowser.uploadFiles'),
                    click: function() {
                        self._uploader.showDropZone();
                        return false;
                    }
                });

                menu.push({
                    title: Drive.Util.i18n('DirBrowser.opCreateDir.opname'),
                    click: function() {
                        self.opCreateDir(dir);
                        return false;
                    }
                });
            }

            var ops = [];

            if (dir.perms.share) {
                ops.push({
                    title: Drive.Util.i18n('DirBrowser.opShareDir.opname'),
                    click: function() {
                        self.opShareDir(dir);
                        self._closeOpdd();
                        return false;
                    }
                });
            }

            if (dir.perms.rename) {
                ops.push({
                    title: Drive.Util.i18n('DirBrowser.opRenameDir.opname'),
                    click:function() {
                        self.opRenameDir(dir);
                        self._closeOpdd();
                        return false;
                    }
                });
            }

            ops.push({
                title: 'Właściwości',
                click: function() {
                    self.opDirDetails(dir);
                    self._closeOpdd();
                    return false;
                }
            });

            // nie mozna usunac biezacego katalogu

            if (ops.length) {
                menu.push({
                    title: Drive.Util.i18n('DirBrowser.dirActions'),
                    sub: ops
                });
            }

            var auxMenu = self._view.hooks.auxMenu.empty();

            $.each(menu, function(i, item) {
                if (i > 0) {
                    auxMenu.append(' | ');
                }

                if (item.sub) {
                    auxMenu.append(App.View.opdd(item.sub, {title: item.title, tip: true}));
                } else {
                    auxMenu.append(
                        $('<a href="#" class="oplink"/>')
                            .text('' + item.title)
                            .click(function(e) {
                                if (typeof item.click == 'function') {
                                    item.click.call(this, e);
                                }
                                return false;
                            })
                    );
                }
            });
        } // }}}

        DirBrowser.prototype._initWidthChecker = function() { // {{{
            // wykrywanie szerokosci kontenera na liste plikow
            var $ = this.$,
                self = this,
                isNarrow = false,
                narrowMaxWidth = 650;

            function widthChecker() {
                var container = self._view.element;

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
        } // }}}

        DirBrowser.prototype._dirUrl = function(dir) { // {{{
            return '#dir:' + dir.id;
        } // }}}

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
        } // }}}

        DirBrowser.prototype.loadDir = function (dirId, success) { // {{{
            var $ = this.$,
                url = Drive.Util.uri(this._uriTemplates.dir.view, {id: dirId});

            $('#drive-loading').text('Ładowanie zawartości katalogu...');

            App.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                complete: function () {
                    $('#drive-loading').text('');
                },
                error: function (response) {
                    $('#drive-loading').html('<div class="error">' + response.error + '</div>');
                },
                success: function (response) {
                    success.call(this, response.data);
                }
            });
        } // }}}

        DirBrowser.prototype.setDir = function (dir) { // {{{
            var self = this,
                title, url;

            self._currentDir = dir;
            self._dropTargets = [];

            self._updateBreadcrumbs(dir);
            self._updateAuxmenu(dir);

            // podepnij zmiane nazwy katalogu do tytulu strony
            title = self._view.hooks.title
                .text(dir.name)
                .unbind('click')
                .removeAttr('title')
                .addClass('disabled');

            if (dir.perms.rename) {
                title
                    .removeClass('disabled')
                    .attr('title', Drive.Util.i18n('DirBrowser.clickToRenameTooltip'))
                    .click(function() {
                        self.opRenameDir(dir);
                        return false;
                    })
            }

            // jezeli nie jest dostepny url do uploadu plikow wylacz uploadera
            if (dir.perms.write) {
                url = Drive.Util.uri(self._uriTemplates.file.upload, dir);
                self._uploader.disableUpload(false).setUploadUrl(url);
            } else {
                self._uploader.disableUpload();
            }

            // pokaz informacje o zajetosci dysku
            self._updateDiskUsage(dir.disk_usage, dir.quota);

            // pokaz zawartosc katalogu
            self._renderDirContents(dir);
        } // }}}

        DirBrowser.prototype.opCreateDir = function (parentDir) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.create, {parent: parentDir.id}),
                str = Drive.Util.i18n('DirBrowser.opCreateDir');

            App.traits.modalForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (response) {
                    if (response.dir) {
                        self.addSubdir(response.dir);
                        self._currentDir.subdirs.push(response.dir);
                    }
                }
            });
        } // }}}

        DirBrowser.prototype.opRenameDir = function(dir, complete) { // {{{
            var $ = this.$,
                self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.rename, dir),
                str = Drive.Util.i18n('DirBrowser.opRenameDir');

            App.traits.modalForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                load: function() {
                    var iframe = this;
                    setTimeout(function() {
                        $(iframe).contents().find('input[type="text"]').focus().select();
                    }, 10);
                },
                complete: function (response) {
                    var responseDir = response.dir;

                    Drive.Util.assert(responseDir.id == dir.id, 'Unexpected directory id in response');

                    // zaktualizuj nazwe katalogu wyswietlona w naglowku oraz w okruchach,
                    // o ile modyfikowany katalog jest katalogiem biezacym
                    if (self._currentDir && responseDir.id == self._currentDir.id) {
                        $('h1 .drive-dir-rename, #breadcrumbs .current').text(responseDir.name);
                    }

                    if (dir.element) {
                        var oldElement, newElement;

                        oldElement = dir.element;
                        $.extend(dir, responseDir);

                        newElement = self._renderSubdir(dir);

                        oldElement.replaceWith(newElement);

                        newElement.find('[data-drop-dir]').each(function() {
                            self._dropTargets.push(this);
                        });

                        self._removeDropTarget(oldElement);
                        self._dropTargets.push(view.el);

                        oldElement.remove();
                        dir.element = newElement;
                    }

                    if (typeof complete === 'function') {
                        complete(response);
                    }
                }
            });
        } // }}}

        DirBrowser.prototype.opMoveDir = function(dir, parentDirId) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.move);

            App.ajax({
                url: url,
                type: 'post',
                data: {id: dir.id, parent: parentDirId},
                dataType: 'json',
                success: function () {
                    if (dir.element) {
                        dir.element.remove();
                        self._removeDropTarget(dir.element);
                        delete dir.element;
                    }
                }
            });
        } // }}}

        DirBrowser.prototype.opShareDir = function(dir) { // {{{
            var $ = this.$,
                self = this,
                str = Drive.Util.i18n('DirBrowser.opShareDir'),
                url = Drive.Util.uri(this._uriTemplates.dir.share, dir);

            App.modal.open({
                width:  600,
                height: 360,
                title:  str.title,
                request: {
                    url:      url,
                    type:     'get',
                    dataType: 'json',
                    content: function(dialog, response) {
                        var data = response.data,
                            content = self._renderTemplate('DirBrowser.opShareDir', {str: str, data:data});

                        // wyswietlanie opisu zaznaczonego poziomu widocznosci katalogu
                        content.find('select[name="visibility"]').change(function() {
                            content.find('.vis-desc').hide();
                            content.find('#drive-dir-share-vis-desc-' + this.value).fadeIn('fast');
                        }).each(function() {
                            var visibility = data.visibility;

                            // jezeli katalog nie moze dziedziczyc widocznosci
                            // (znajduje sie w korzeniu drzewa katalogow) usun
                            // odpowiednia opcje z selecta
                            if (!data.can_inherit) {
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
                        };

                        function userBuilder(user) {
                            var vars = {
                                    user: user,
                                    str: str
                                },
                                element = self._renderTemplate('DirBrowser.opShareDir.user', vars);

                            element.bind('append exists', function(e) {
                                if (usersContainer.scrollTo) {
                                    usersContainer.scrollTo(this, 100);
                                }
                                highlightUser(this);
                            });

                            return element;
                        }

                        highlight.remove();

                        // zainicjuj widget listy uzytkownikow
                        new Drive.UserPicker(content.find('#drive-dir-share-acl'), userBuilder, {
                                url: App.url('core/users/search'),
                                users: data.shares
                            });

                        dialog.buttons([
                            {
                                id: 'submit',
                                label: str.submit,
                                click: function () {
                                    dialog.status(str.messageSending);
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

                        // podepnij zawartosc okna do drzewa dokumentu, przed
                        // inicjalizacja obslugi zdarzen
                        dialog.content(content).adjustHeight(true);

                        // dostosuj wielkosc okna dialogowego do zawartosci, w osobnym
                        // watku, w przeciwnym razie jego rozmiar nie zostanie poprawnie
                        // obliczony
           //            setTimeout(function() {
        //                    dialog.height(content.outerHeight(), true);

                            // zeby overflow:auto zadzialalo
          //                  content.height(content.height());
         //               }, 10);

                    }
                }
            });
        } // }}}

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
            if (!(currentDir.subdirs.length + currentDir.files.length)) {
                this._view.childViews.dirContents.element.addClass('no-items');
            }
        } // }}}

        DirBrowser.prototype.opRemoveDir = function(dir) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.dir.remove, dir),
                str = Drive.Util.i18n('DirBrowser.opRemoveDir');

            App.traits.modalForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (response) {
                    response = response || {error: 'Nieoczekiwana odpowiedz od serwera'};
                    if (!response.error) {
                        self._removeDir(dir);
                        self._updateDiskUsage(response.disk_usage, response.quota);
                    }
                }
            });
        } // }}}

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
                        return response.owner.id + ' (' + response.owner.name + ')';
                    },
                    prepare_data: function(context) {
                        return {id: dir.id};
                    },
                    after_save: function(response) {
                        Drive.Util.assert(response.id == dir.id, 'Unexpected directory id in response');

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

            App.modal.open({
                title: str.title,
                width: 440,
                content: function(dialog) {
                    content.appendTo(this);
                    dialog.adjustHeight();
                },
                buttons: [{
                    label: str.submit,
                    click: function() {
                        this.parentDialog.close();
                    }
                }]
            });
        } // }}}

        DirBrowser.prototype.opRenameFile = function(file) { // {{{
            var $ = this.$,
                self = this,
                url = Drive.Util.uri(self._uriTemplates.file.rename, file);

            App.traits.modalForm({
                width:  440,
                height: 120,
                url:    url,
                title:  'Zmiana nazwy pliku',
                submitLabel: 'Zastosuj',
                load: function() {
                    var iframe = this;
                    setTimeout(function() {
                        $(iframe).contents().find('input[type="text"]').first().each(function() {
                            var j = $(this),
                                val = j.val(),
                                pos = val.lastIndexOf('.');

                            // zaznacz nazwe pliku bez rozszerzenia
                            j.selection(0, pos == -1 ? val.length : pos);
                        });
                    }, 10);
                },
                complete: function (response) {
                    var responseFile = response.file;

                    Drive.Util.assert(responseFile.id == file.id, 'Unexpected file id in response');
                    $.extend(file, responseFile);

                    if (file.element) {
                        self._renderFile(file, true);
                    }
                }
            });
        } // }}}

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
        } // }}}

        DirBrowser.prototype.opMoveFile = function(file, dirId) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.file.move);

            App.ajax({
                url: url,
                type: 'post',
                data: {id: file.id, dir: dirId},
                dataType: 'json',
                success: function () {
                    self._removeFile(file);
                }
            });
        } // }}}

        DirBrowser.prototype.opRemoveFile = function(file) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.file.remove, file),
                str = Drive.Util.i18n('DirBrowser.opRemoveFile');

            App.traits.modalForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (response) {
                    response = response || {error: 'Nieoczekiwana odpowiedź od serwera'}
                    if (!response.error) {
                        self._removeFile(file);
                        self._updateDiskUsage(response.disk_usage, response.quota);
                    }
                }
            });
        } // }}}

        DirBrowser.prototype.opEditFile = function(file) { // {{{
            var self = this,
                url = Drive.Util.uri(self._uriTemplates.file.edit, file),
                str = Drive.Util.i18n('DirBrowser.opEditFile');

            App.traits.modalForm({
                width:       440,
                height:      120,
                url:         url,
                title:       str.title,
                submitLabel: str.submit,
                complete: function (response) {
                    response = response || {error: 'Nieoczekiwana odpowiedź od serwera'}
                    if (!response.error) {
                        App.flash(str.messageSuccess);
                    }
                }
            });
        } // }}}

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
                        return response.owner.id + ' (' + response.owner.name + ')';
                    },
                    prepare_data: function(context) {
                        return {id: file.id};
                    },
                    after_save: function(response) {
                        Drive.Util.assert(response.id == file.id, 'Unexpected file id in response');

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

            App.modal.open({
                title: str.title,
                width: 440,
                content: function(dialog) {
                    content.appendTo(this);
                    dialog.adjustHeight();
                },
                buttons: [{
                    label: str.submit,
                    click: function() {
                        this.parentDialog.close();
                    }
                }]
            });

        } // }}}

        DirBrowser.prototype.addSubdir = function(dir) { // {{{
            var element = this._renderSubdir(dir),
                dirContentsView = this._view.childViews.dirContents;

            element.appendTo(dirContentsView.hooks.subdirs);

            dirContentsView.element.removeClass('no-items');
            this.$(window).trigger('resize');
        } // }}}

        DirBrowser.prototype.addFile = function(file) { // {{{
            var element = this._renderFile(file),
                dirContentsView = this._view.childViews.dirContents;

            element.appendTo(dirContentsView.hooks.files);

            dirContentsView.element.removeClass('no-items');
            this.$(window).trigger('resize');
        } // }}}

        DirBrowser.prototype._closeOpdd = function() { // {{{
            this.$.fn.opdd.close();
        } // }}}

        DirBrowser.prototype._dirEntryOpdd = function(entry, items) { // {{{
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
        } // }}}

        DirBrowser.prototype._subdirOpdd = function(dir) { // {{{
            var self = this,
                opdd = self._dirEntryOpdd(dir, [
                    {
                        title: Drive.Util.i18n('DirBrowser.opShareDir.opname'),
                        disabled: !dir.perms.share,
                        click: function() {
                            self.opShareDir(dir);
                            self._closeOpdd();
                            return false;
                        }
                    },
                    {
                        title: Drive.Util.i18n('DirBrowser.opRenameDir.opname'),
                        disabled: !dir.perms.rename,
                        click: function() {
                            self.opRenameDir(dir);
                            self._closeOpdd();
                            return false;
                        }
                    },
                    {
                        title: Drive.Util.i18n('DirBrowser.opDirDetails.opname'),
                        click: function() {
                            self.opDirDetails(dir);
                            self._closeOpdd();
                            return false;
                        }
                    },
                    {
                        title: Drive.Util.i18n('DirBrowser.opRemoveDir.opname'),
                        disabled: !dir.perms.remove,
                        click: function() {
                            self.opRemoveDir(dir);
                            self._closeOpdd();
                            return false;
                        }
                    }
                ]);

            return opdd;
        } // }}}

        DirBrowser.prototype._fileOpdd = function(file) { // {{{
            var self = this,
                opdd = self._dirEntryOpdd(file, [
                    {
                        title: Drive.Util.i18n('DirBrowser.opOpenFile.opname'),
                        url: Drive.Util.uri(self._uriTemplates.file.view, file),
                        click: function() {
                            // zwrocenie false spowoduje, ze nie otworzy sie plik,
                            // trzeba puscic event i zamknac opdd w osobnym watku
                            setTimeout(function() {
                                self._closeOpdd();
                            }, 500);
                        }
                    },
                    {
                        title: Drive.Util.i18n('DirBrowser.opEditFile.opname'),
                        disabled: !file.perms.write,
                        click: function() {
                            self.opEditFile(file);
                            self._closeOpdd();
                            return false;
                        }
                    },
                    {
                        title: Drive.Util.i18n('DirBrowser.opRenameFile.opname'),
                        disabled: !file.perms.rename,
                        click: function() {
                            self.opRenameFile(file);
                            self._closeOpdd();
                            return false;
                        }
                    },
                    {
                        title: Drive.Util.i18n('DirBrowser.opFileDetails.opname'),
                        click: function() {
                            self.opFileDetails(file);
                            self._closeOpdd();
                            return false;
                        }
                    },
                    {
                        title: Drive.Util.i18n('DirBrowser.opRemoveFile.opname'),
                        disabled: !file.perms.remove,
                        click: function() {
                            self.opRemoveFile(file);
                            self._closeOpdd();
                            return false;
                        }
                    }
                ]);

            return opdd;
        } // }}}

        DirBrowser.prototype._removeDropTarget = function(element) { // {{{
            // element - element dokumentu reprezentujacy wpis w katalogu
            var $ = this.$,
                self = this;

            element.find('[data-drop-dir]').each(function() {
                var index = $.inArray(this, self._dropTargets);
                if (index != -1) {
                    self._dropTargets.splice(index, 1);
                }
            });
        } // }}}

        DirBrowser.prototype._getDropDirElement = function(position, dragDirId) { // {{{
            // teraz trzeba zlapac element na wspolrzednych x i y ktory ma
            // atrybut data-drop-dir. document.elementFromPoint znajduje
            // najplycej polozony element, nad ktorym jest kursor myszy, co
            // jest niewystarczajace.
            var $ = this.$,
                self = this,
                target = null;

            $.each(self._dropTargets, function() {
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
        } // }}}

        DirBrowser.prototype._addGrab = function(entry, isDir, element, callback) { // {{{
            var $ = this.$,
                self = this,
                str = Drive.Util.i18n('DirBrowser.grab'),
                prevTooltipText,
                dragDirId;

            // jezeli podany wpis jest katalogiem, przekaz jego id do funkcji
            // wyznaczajacej element docelowy upuszczenia (odpowiadajacy innemu
            // katalogowi)
            if (isDir) {
                dragDirId = entry.id;
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
                            target: target.attr('title') || target.text()
                        });
                    } else {
                        tooltipText = self._strInterp.interp(str.noDropDirTooltip, {
                            source: entry.name
                        });
                    }

                    // zaktualizuj tresc tylko jesli jest ona rozna od poprzedniej
                    if (tooltipText != prevTooltipText) {
                        self._grabTooltip.html(tooltipText)
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
        } // }}}

        DirBrowser.prototype._renderTemplate = function(id, vars) { // {{{
            return Drive.Util.render(id, vars || {}, this.$);
        } // }}}

        DirBrowser.prototype._renderHeader = function() { // {{{
            var str = Drive.Util.i18n('DirBrowser.dirContents');
            return this._renderTemplate('DirBrowser.dirContents.header', {str: str});
        } // }}}

        DirBrowser.prototype._renderUpdir = function (dir) { // {{{
            var self = this;
            var element = self._renderTemplate('DirBrowser.dirContents.updir', {dir: dir});
                hooks = Viewtils.hooks(element, {
                    required: ['name'],
                    wrapper: self.$
                });

            if (dir.perms.read) {
                // klikniecie w katalog laduje zawarte w nim pliki i podkatalogi
                hooks.name.attr('data-url', self._dirUrl(dir));
            }

            // Katalog nadrzedny nie moze byc przenoszony metoda przeciagnij-i-upusc.
            element.addClass('not-grabbable');

            // jezeli katalog jest dostepny do zapisu, zezwol na upuszczanie
            // na niego plikow lub katalogow.
            if (dir.perms.write) {
                hooks.name.attr('data-drop-dir', dir.id).each(function() {
                    self._dropTargets.push(this);
                });
            }

            return element;
        } // }}}

        DirBrowser.prototype._renderSubdir = function(dir, replace) { // {{{
            var self = this;

            var element = self._renderTemplate('DirBrowser.dirContents.subdir', {dir: dir}),
                hooks = Viewtils.hooks(element, {
                    required: ['grab', 'name', 'ops'],
                    wrapper: self.$
                });

            // view.attr('data-dir', dir.id);

            if (dir.perms.read) {
                // klikniecie w katalog laduje zawarte w nim pliki i podkatalogi
                hooks.name.attr('data-url', self._dirUrl(dir));
            }

            if (dir.perms.write) {
                // ustaw atrybut data-drop-dir wskazujacy, ze na ten katalog mozna
                // upuscic plik lub inny katalog
                hooks.name.attr('data-drop-dir', dir.id).each(function() {
                    self._dropTargets.push(this);
                });

                // ustaw obsluge metody przeciagnij-i-upusc dla tego katalogu
                self._addGrab(dir, true, hooks.grab, function(targetDirId) {
                    self.opMoveDir(dir, targetDirId);
                });
            }

            hooks.ops.append(self._subdirOpdd(dir));

            // zastap juz istniejacy element jeszcze raz wygenerowanym widokiem
            if (replace && dir.element) {
                var old = dir.element;

                self._removeDropTarget(old);

                old.replaceWith(element);
                old.remove();
            }

            // podepnij widok do katalogu
            dir.element = element;

            return element;
        } // }}}

        DirBrowser.prototype._renderFile = function(file, replace) { // {{{
            var self = this,
                element = self._renderTemplate('DirBrowser.dirContents.file', {file: file}),
                hooks = Viewtils.hooks(element, {
                    required: ['grab', 'name', 'ops'],
                    wrapper: self.$
                });

            // dodaj klase wskazujaca na konkretny typ pliku. W tym celu wyodrebnij
            // z nazwy pliku rozszerzenie, i o ile nie zawiera niebezpiecznych znakow
            // uzyj je.
            if (hooks.icon) {
                var ext = file.name.match(/(?=.)[-_a-z0-9]+$/i);
                if (ext) {
                    hooks.icon.addClass(ext);
                }
            }

            // skoro biezacy katalog jest czytelny, oznacza to, ze wszystkie pliki
            // w nim zawarte rowniez sa czytelne
            var url = Drive.Util.uri(self._uriTemplates.file.view, file);
            hooks.name.attr('data-url', url);

            // TODO isFileMovable? file.perms.move?
            if (self._currentDir.perms.write) {
                self._addGrab(file, false, hooks.grab, function(targetDirId) {
                    self.opMoveFile(file, targetDirId);
                });
            }

            hooks.ops.append(self._fileOpdd(file));

            // zastap juz istniejacy element jeszcze raz wygenerowanym widokiem
            if (replace && file.element) {
                var old = file.element

                old.replaceWith(element);
                old.remove();
            }

            // podepnij widok do pliku
            file.element = element;

            return element;
        } // }}}

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
        } // }}}
        return DirBrowser;
    })(),
    FileUpload: (function() {
        /**
         * @namespace
         * @version 2013-05-16 / 2013-01-22
         */
        var FileUpload = {};

        FileUpload.Utils = {
            stopEvent: function (event) { // {{{
                event.cancelBubble = true;
                event.returnValue = false;

                if (event.stopPropagation) {
                    event.stopPropagation();
                }

                if (event.preventDefault) {
                    event.preventDefault();
                }
            } // }}}
        };

        /**
         * @namespace
         */
        FileUpload.Transfer = {
            /**
             * @constructor
             * @param {HTMLInputElement} fileInput
             * @param {string} [url]
             * Event handlers:
             * .onabort
             * .oncomplete
             * .onerror
             */
            FileInputTransfer: function (fileInput, url) { // {{{
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

                this.isAborted = false;

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
                            self.onabort(self);
                        }
                    }
                } // }}}

                this.send = function () { // {{{
                    if (self.isAborted) {
                        return false;
                    }

                    var frameName = 'iframe-' + Math.random().toString().substr(2);

                    iframe = $('<iframe name="' + frameName + '" />')
                        .css('display', 'none')
                        .appendTo('body')
                        .each(function() {
                            this.onload = function () {
                                // make sure onload() is called at most once
                                this.onload = null;

                                if (!self.isAborted && typeof self.oncomplete === 'function') {
                                    var response = this.contentWindow.document.body.innerHTML;
                                    self.oncomplete(self, response);
                                }

                                // Remove IFRAME and FORM elements. Use a separate thread, so that
                                // this function is safe to use in these elements' event handlers.
                                // Without this, (at least) Firefox 12 throws an 0x80004002
                                // (NS_NOINTERFACE) error.
                                setTimeout(_cleanup, 10);
                            }
                            this.onerror = function () {
                                // make sure onerror() is called at most once
                                this.onerror = null;

                                if (!self.isAborted && typeof self.onerror === 'function') {
                                    self.onerror(self);
                                }

                                setTimeout(_cleanup, 10);
                            }
                        });

                    // simulate progress event
                    if (typeof self.onprogress === 'function') {
                        interval = setInterval(function () {
                            // progress value is undefined
                            self.onprogress(self);
                        }, 500);
                    }

                    form = $('<form method="post" enctype="multipart/form-data" />')
                        .attr('target', frameName)
                        .css('display', 'none')
                        .appendTo('body')
                        .append(fileInput)
                        .attr('action', url)
                        .submit();

                    return true;
                } // }}}
            }, // }}}
            /**
             * @constructor
             * @param {File} file
             * @param {string} [url]
             * send({complete: function, progress: function, name: string})
             * complete(responseText, file) in context of the XMLHttpRequest
             * progress(file) in context of the XMLHttpRequestUpload
             * options.name = 'file'
             * @param [options.complete] function (file, responseText, xhr)
             * @param [options.progress] function (file, value, xhr)
             */
            XHRTransfer: function (file, url, options) { // {{{
                var self = this,
                    xhr = new XMLHttpRequest,
                    complete, abort;

                options = options || {};

                this.isAborted = false;

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
                            self.onabort(self);
                        }
                    }
                } // }}}

                this.send = function () { // {{{
                    if (self.isAborted) {
                        return false;
                    }

                    var data = new FormData;

                    // do not send empty files or folders
                    if (file.size === 0) {
                        throw 'An empty file cannot be uploaded';
                    }

                    data.append(options.name || 'file', file);

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
                            self.oncomplete(self, this.responseText);
                        }
                    };

                    xhr.onerror = function () {
                        if (typeof self.onerror === 'function') {
                            self.onerror(self);
                        }
                    }

                    if (typeof self.onprogress === 'function' && xhr.upload) {
                        xhr.upload.addEventListener('progress', function (e) {
                            if (e.lengthComputable) {
                                self.onprogress(self, e.loaded / e.total);
                            }
                        }, false);
                    }

                    xhr.open('POST', url, true);
                    xhr.send(data);

                    return true;
                } // }}}
            } // }}}
        };

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
                            options.cleanup.call(self, item.transfer);
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
                        callback.apply(self, args);
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
                var transfer = item.transfer;

                transfer.onabort = (function (onAbort) {
                    return function () {
                        _abort(item);
                        _complete(item, onAbort, arguments);
                    }
                })(transfer.onabort);

                transfer.oncomplete = (function (onComplete) {
                    return function () {
                        _complete(item, onComplete, arguments);
                    }
                })(transfer.oncomplete);

                transfer.onprogress = (function (onProgress) {
                    if (typeof onProgress === 'function') {
                        return function () {
                            var args = Array.prototype.slice.apply(arguments);
                            onProgress.apply(self, args);
                        }
                    }
                    return null;
                })(transfer.onprogress);
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
                        options.start.call(self, item.transfer, ++position);
                    }

                    try {
                        item.transfer.send();
                    } catch (e) {
                        // skip to next item in queue
                        item.isCompleted = true;
                        items.nextIndex = null;
                        wait = false;

                        if (typeof options.error === 'function') {
                            options.error.call(self, item.transfer, e);
                        }
                    }
                }
            } // }}}

            this.enqueue = function (transfer) { // {{{
                var index = -1;

                if (transfer && typeof transfer === 'object') {
                    items.nextIndex = null;
                    index = items.freeIndex++;

                    items[index] = {
                        index: index,
                        transfer: transfer,
                        isCompleted: false
                    };

                    self.length = ++items.length;

                    if (typeof options.enqueue == 'function') {
                        options.enqueue.call(self, transfer, index);
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
                        var transfer = new FileUpload.Transfer.FileInputTransfer(this, self.url);

                        $.extend(transfer, {
                            onprogress: options.progress,
                            oncomplete: options.complete,
                            onabort:    options.abort,
                            onerror:    options.error
                        });

                        // this file input is now owned by Transfer object, create
                        // a replacement for it and append it to original form, so
                        // that more files can be selected
                        $(this.form ? this.form : this.parentNode).append(self.createFileInput());

                        queue.enqueue(transfer);

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
                        var transfer = new FileUpload.Transfer.XHRTransfer(files[i], self.url);

                        $.extend(transfer, {
                            onprogress: options.progress,
                            oncomplete: options.complete,
                            onabort:    options.abort,
                            onerror:    options.error
                        });

                        queue.enqueue(transfer);
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
                        FileUpload.Utils.stopEvent(e);

                        // send an artificial event upwards to notify that a drop
                        // event occured
                        setTimeout(function() {
                            input.trigger('drop');
                        }, 1);
                    }, false);

                    // ustawianie / usuwanie klasy .drop podczas zdarzen dragover,
                    // dragleave i drop wykonywane przez FileDrop ssie potwornie.
                    // Upuszczanie pliku na INPUT[type=file] nie dziala pod IE 7-9
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

                        FileUpload.Utils.stopEvent(e);
                    }, false);
                }).append(form));

                queue.run();
            } // }}}

            _init();
        } // }}}
        return FileUpload;
    })(),
    I18n: (function() {
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
    Templates: (function() {
        var Templates = {
            "Uploader": "<div id=\"drive-uploader\">\n<div id=\"drive-uploader-dialog\" data-hook=\"dialog-content\">\n<div id=\"drive-uploader-dropzone\" data-hook=\"drop-zone-pane\">\n<div class=\"uploader\" data-hook=\"drop-zone\">\n<div class=\"drop-here\" data-hook=\"drop-zone-text\"></div>\n</div>\n</div>\n<div id=\"drive-uploader-queue\" data-hook=\"queue-pane\">\n<table id=\"drive-uploader-queue-items\">\n<tbody data-hook=\"items\"></tbody>\n</table>\n<div class=\"no-items-message\">{{ str.noItems }}</div>\n</div>\n</div>\n<div id=\"drive-uploader-status\">\n<div id=\"drive-uploader-status-icon\"></div>\n<div id=\"drive-uploader-status-content\">\n<h3>\n<span class=\"name\" data-hook=\"item-name\"></span>\n<span class=\"size\" data-hook=\"item-size\"></span>\n</h3>\n<p data-hook=\"status-message\"></p>\n</div>\n<div id=\"drive-uploader-status-button\">\n<button class=\"seamless\" data-hook=\"open-button\">{{ str.openButtonText }}</button>\n</div>\n</div>\n</div>",
            "Uploader.queueItem": "<tr>\n<td class=\"col-filename\">\n<span class=\"filename\">{{ file.name }}</span>\n<span class=\"error-message\" data-hook=\"error-message\"></span>\n</td>\n<td class=\"col-size\">{{ file.size | Viewtils.fsize }}</td>\n<td class=\"col-progress\">\n<span class=\"progress-text\" data-hook=\"progress-text\"></span>\n<span class=\"progress-bar\"><span class=\"bar\" data-hook=\"progress-bar\"></span></span>\n</td>\n<td class=\"col-cancel\">\n<button class=\"seamless\" data-hook=\"cancel-button\" title=\"{{ str.cancelButtonTooltip }}\"></button>\n</td>\n</tr>",
            "DirBrowser": "<div data-hook=\"disk-usage\"></div>\n<h1 id=\"title\"><span class=\"drive-dir-renamable\" data-hook=\"title\"></span></h1>\n<div id=\"opnav\">\n<div id=\"drive-loading\" class=\"abs\" data-hook=\"message-area\"></div>\n<div id=\"drive-dir-menu\" data-hook=\"aux-menu\"></div>\n</div>\n<div data-hook=\"dir-contents\"></div>\n<div data-hook=\"uploader\"></div>",
            "DirBrowser.diskUsage": "<div id=\"drive-du\">\n<div class=\"pane\">\n<div class=\"progress-bar\">\n<div class=\"bar\" data-hook=\"progress-bar\" data-level-template=\"bar-{level}\"></div>\n</div>\n<dl class=\"used\">\n<dt>{{ str.used }}</dt>\n<dd>\n<span data-hook=\"used\">{{ used | Viewtils.fsize }}</span>\n<span class=\"percent\">(<span data-hook=\"percent\"></span>%)</span>\n</dd>\n</dl>\n<dl class=\"available\">\n<dt>{{ str.available }}</dt>\n<dd data-hook=\"available\"></dd>\n</dl>\n</div>\n</div>",
            "DirBrowser.dirContents": "<div id=\"drive-dir-contents\">\n<table>\n<thead data-hook=\"header\"></thead>\n<tbody data-hook=\"updir\"></tbody>\n<tbody data-hook=\"subdirs\"></tbody>\n<tbody data-hook=\"files\"></tbody>\n</table>\n<div class=\"no-items-message\">{{ str.noItems }}</div>\n</div>",
            "DirBrowser.dirContents.header": "<tr>\n<th class=\"col-grab\"></th>\n<th class=\"col-icon\"></th>\n<th class=\"col-name\">{{ str.name }}</th>\n<th class=\"col-owner\">{{ str.owner }}</th>\n<th class=\"col-size\">{{ str.size }}</th>\n<th class=\"col-mtime\">{{ str.mtime }}</th>\n<th class=\"col-ops\"></th>\n</tr>",
            "DirBrowser.dirContents.updir": "<tr>\n<td class=\"col-grab\"></td>\n<td class=\"col-icon\"></td>\n<td class=\"col-name\" colspan=\"5\">\n<span title=\"{{ dir.name }}\" class=\"dir\" data-hook=\"name\">..</span>\n</td>\n</tr>",
            "DirBrowser.dirContents.subdir": "<tr>\n<td class=\"col-grab\" data-hook=\"grab\"></td>\n<td class=\"col-icon\"><span class=\"drive-icon drive-icon-folder\"></span></td>\n<td class=\"col-name\">\n<span title=\"{{ dir.name }}\" data-hook=\"name\">{{ dir.name }}</span>\n</td>\n<td class=\"col-owner\">{{ dir.owner.name }}</td>\n<td class=\"col-size\"></td>\n<td class=\"col-mtime\">\n<div class=\"full\">{{ dir.mtime.short }}</div>\n<div class=\"date-only\">{{ dir.mtime.date }}</div>\n</td>\n<td class=\"col-ops\" data-hook=\"ops\"></td>\n</tr>",
            "DirBrowser.dirContents.file": "<tr>\n<td class=\"col-grab\" data-hook=\"grab\"></td>\n<td class=\"col-icon\"><span class=\"drive-icon drive-icon-{{ file.filter }}\" data-hook=\"icon\"></span></td>\n<td class=\"col-name\">\n<span title=\"{{ file.name }}\" data-hook=\"name\">{{ file.name }}</span>\n</td>\n<td class=\"col-owner\">{{ file.owner.name }}</td>\n<td class=\"col-size\">{{ file.size | Viewtils.fsize }}</td>\n<td class=\"col-mtime\">\n<div class=\"full\">{{ file.mtime.short }}</div>\n<div class=\"date-only\">{{ file.mtime.date }}</div>\n</td>\n<td class=\"col-ops\" data-hook=\"ops\"></td>\n</tr>",
            "DirBrowser.opShareDir": "<div id=\"drive-dir-share\">\n<form class=\"form\">\n<div id=\"drive-dir-share-vis\">\n<label for=\"drive-dir-share-visibility\">{{ str.visLabel }}</label>\n<table>\n<tr>\n<td>\n<select name=\"visibility\" id=\"drive-dir-share-visibility\">\n<option value=\"private\">{{ str.visOptPrivate }}</option>\n<option value=\"usersonly\">{{ str.visOptUsersonly }}</option>\n<option value=\"public\">{{ str.visOptPublic }}</option>\n<option value=\"inherited\">{{ str.visOptInherited }}</option>\n</select>\n</td>\n<td style=\"padding-left:6px\">\n<div id=\"drive-dir-share-vis-desc-private\" class=\"vis-desc\">{{ str.visDescPrivate }}</div>\n<div id=\"drive-dir-share-vis-desc-usersonly\" class=\"vis-desc\">{{ str.visDescUsersonly }}</div>\n<div id=\"drive-dir-share-vis-desc-public\" class=\"vis-desc\">{{ str.visDescPublic }}</div>\n<div id=\"drive-dir-share-vis-desc-inherited\" class=\"vis-desc\">{{ str.visDescInherited }}</div>\n</td>\n</tr>\n</table>\n</div>\n<div id=\"drive-dir-share-acl\">\n<label for=\"drive-dir-share-acl-search-user\">{{ str.aclLabel }}</label>\n<div id=\"drive-dir-share-acl-users\">\n<div class=\"highlight\"></div>\n<table>\n<tbody data-hook=\"user-list\">\n<tr data-hook=\"empty-list-message\">\n<td colspan=\"3\" class=\"no-users\">{{ str.aclNoUsers }}</td>\n</tr>\n</tbody>\n</table>\n</div>\n<div id=\"drive-dir-share-acl-search\">\n<table>\n<tr>\n<td>\n<input type=\"text\" id=\"drive-dir-share-acl-search-user\" data-hook=\"user-search\" placeholder=\"{{ str.userSearch }}\" />\n</td>\n<td>\n<button type=\"button\" class=\"btn btn-primary disabled\" data-hook=\"user-add\">{{ str.userAdd }}</button>\n</td>\n</tr>\n</table>\n<div class=\"hint\">{{ str.searchHint }}</div>\n</div>\n</div>\n</form>\n</div>",
            "DirBrowser.opShareDir.user": "<tr>\n<td class=\"user-name\">\n<div class=\"user-name-fn\">{{ user.first_name }} {{ user.last_name }}</div>\n<div class=\"user-name-un\">{{ user.username }}</div>\n</td>\n<td class=\"user-perms\">\n<select name=\"shares[{{ user.id }}]\">\n<option value=\"0\">{{ str.aclRead }}</option>\n<option value=\"1\"{{# user.can_write }}selected{{/ user.can_write }}>{{ str.aclReadWrite }}</option>\n</select>\n</td>\n<td class=\"user-delete\">\n<button type=\"button\" data-hook=\"user-delete\" title=\"{{ str.userDelete }}\">&times;</button>\n</td>\n</tr>",
            "DirBrowser.opDirDetails": "<div id=\"drive-dir-details\">\n<dl>\n<dt>{{ str.name }}</dt>\n<dd>{{ dir.name }}</dd>\n<dt>{{ str.owner }}</dt>\n<dd><span class=\"owner\">{{ dir.owner.id }} ({{ dir.owner.name }})</span></dd>\n<dt>{{ str.mtime }}</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">{{ dir.mtime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ dir.modified_by.name }}</span>\n</div>\n</dd>\n<dt>{{ str.ctime }}</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">{{ dir.ctime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ dir.created_by.name }}</span>\n</div>\n</dd>\n</dl>\n</div>",
            "DirBrowser.opFileDetails": "<div id=\"drive-file-details\">\n<dl>\n<dt>{{ str.name }}</dt>\n<dd>{{ file.name }}</dd>\n<dt>{{ str.owner }}</dt>\n<dd><span class=\"owner\">{{ file.owner.id }} ({{ file.owner.name }})</span></dd>\n<dt>{{ str.mtime }}</dt>\n<dd>\n<div class=\"mtime timelog\">\n<span class=\"time\">{{ file.mtime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ file.modified_by.name }}</span>\n</div>\n</dd>\n<dt>{{ str.ctime }}</dt>\n<dd>\n<div class=\"ctime timelog\">\n<span class=\"time\">{{ file.ctime.long }}</span>\n<span class=\"sep\">{{ str.timeSeparator }}</span>\n<span class=\"user\">{{ file.created_by.name }}</span>\n</div>\n</dd>\n<dt>ID</dt>\n<dd>{{ file.id }}</dd>\n<dt>{{ str.size }}</dt>\n<dd>{{ file.size | Viewtils.fsize }}</dd>\n<dt>{{ str.mimetype }}</dt>\n<dd>{{ file.mimetype }}</dd>\n<dt>{{ str.md5sum }}</dt>\n<dd>{{ file.md5sum }}</dd>\n<dt>{{ str.url }}</dt>\n<dd><code>{{ file.url }}</code></dd>\n</dl>\n</div>"
        };
        return Templates;
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
                        dialog.content(dialogContent);
                        dialogContent.show();
                        dialog.adjustHeight();
                    },
                    beforeclose: function () {
                        // przywroc dialogContent na miejsce zanim dialog usunie go
                        // z drzewa, ponadto uczyn go niewidocznym
                        dialogContent.hide();

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
                                text: str.cleanButtonText,
                                load: function () {
                                    this.setAttribute('title', str.cleanButtonTooltip);
                                },
                                click: function () {
                                    self.cleanQueue();
                                }
                            },
                            {
                                text: str.cancelButtonText,
                                type: 'cancel'
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
                    fileView.hooks.progressText.html(str.canceled);

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

                    fileView.hooks.progressText.html(str.uploading);

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

                view.hooks.statusMessage.html(message);
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

                view.hooks.statusMessage.html(message);
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
                        fileView.hooks.progressText.html(str.error);
                        fileView.hooks.errorMessage.text(response.error);
                    } else {
                        fileView.hooks.progressText.html(str.uploaded);
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
                view.hooks.statusMessage.html(
                    uploadQueue.hasErrors ? str.uploadError : str.uploadSuccess
                );

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

                            widget.title(pane.title).buttons(pane.buttons);
                            widget.adjustHeight();

                            dialog.previous = dialog.active;
                            dialog.active = name;

                            func = pane.load;
                        }
                    } else {
                        pane.element.show();

                        options = this.$.extend(null, dialog.options);
                        options.title = pane.title;
                        options.buttons = pane.buttons;

                        widget = App.modal.open(options);

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
                    dialog.widget = widget = null;
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

            hooks.dropZoneText.html(dropZoneText);

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
         * @param {function} userBuilder   funkcja tworzace element reprezentujacy
         *                                 uzytkownika na liscie
         * @param {object} [options]       ustawienia dodatkowe
         * @param {string} [options.url]   zrodlo danych do autouzupelniania
         * @param {Array}  [options.users] poczatkowa lista uzytkownikow
         * @constructor
         * @requires Viewtils
         * @version 2012-12-27
         */
        var UserPicker = function(selector, userBuilder, options) { // {{{
            var $ = window.jQuery,
                self = this,
                container = $(selector),
                hooks,
                users,
                selected,
                term;

            options = options || {};

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
                hooks.userSearch.autocomplete({
                    open: function(event, ui) {
                        closeTime = null;
                    },
                    close: function(event, ui) {
                        closeTime = event.timeStamp;
                    },
                    source: options.url || [],
                    select: function(event, ui) {
                        hooks.userAdd.removeClass('disabled');
                        selected = ui.item;
                        return false;
                    },
                    renderItem: function(item) {
                        var str = item.first_name + ' ' + item.last_name + ' (' + item.username + ')';
                        return str;
                    },
                    beforeSend: function(request) {
                        hooks.userAdd.addClass('disabled');
                        selected = null;

                        term = $.trim(request.term);
                        if (!term.match(/^\d+$/) && term.length < 2) {
                            return false;
                        }
                    }
                });

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
                            hooks.userAdd.addClass('disabled');
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

                    j.addClass('disabled');
                    hooks.userSearch.val('');
                });

                // dodaj uzytkownikow do listy, poczatkowe wypelnianie listy
                // nie wywoluje zdarzenia 'append'
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
             * @param {bool} [triggerAppend=true]
             */
            this.addUser = function(user, triggerAppend) {
                if (user.id in users.data) {
                    // uzytkownik o podanym id jest juz dodany do listy, wywolaj
                    // zdarzenie o tym informujace
                    users.data[user.id].element.trigger('exists');

                } else {
                    var element = $(userBuilder(user)),
                        elementHooks = Viewtils.hooks(element, {wrapper: $});

                    if (elementHooks.userDelete) {
                        elementHooks.userDelete.click(function() {
                            delete users.data[user.id];
                            --users.length;

                            // usun element z dokumentu i wywolaj zdarzenie informujace
                            // o usunieciu elementu. Event ma ustawione pole relatedNode
                            // wskazujace na rodzica, od ktorego zostal odlaczony.
                            // http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#event-type-DOMNodeRemoved
                            var parentNode = element.get(0).parentNode;

                            element.remove().trigger({
                                type: 'remove',
                                relatedNode: parentNode
                            });

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

                    users.data[user.id] = user;
                    ++users.length;

                    user.element = element;
                    hooks.userList.append(element);

                    // wywolaj zdarzenie append informujace element, ze zostal dodany
                    // do drzewa dokumentu
                    // http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#event-type-DOMNodeInsertedIntoDocument
                    if (triggerAppend !== false) {
                        element.trigger({
                            type: 'append',
                            relatedNode: hooks.userList.get(0)
                        });
                    }
                }
            }

            init();
        } // }}}
        return UserPicker;
    })(),
    Util: (function() {
        /**
         * @namespace
         * @version 2013-01-13
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
            return decodeURIComponent(unescape(Util.interp(template, vars, escape)));
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

            Util.assert(typeof template === 'string', 'Template not found: ' + id);

            if (typeof vars === 'function') {
                vars = null;
                wrapper = vars;
            }

            // Backwards compatibility with Mustache.js 0.4.x
            var fn = Mustache.render ? 'render' : 'to_html',
                out = Mustache[fn](template, vars || {});

            return typeof wrapper === 'function' ? wrapper(out) : out;
        } // }}}

        Util.i18n = function (key) { // {{{
            var keys = key.split('.'),
                context = Drive.I18n;

            while (keys.length) {
                var k = keys.shift();

                if (context[k]) {
                    context = context[k];
                } else {
                    break;
                }

                if (!keys.length) {
                    return context;
                }
            }

            return key;
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
    })()
};
