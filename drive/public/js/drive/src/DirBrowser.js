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

