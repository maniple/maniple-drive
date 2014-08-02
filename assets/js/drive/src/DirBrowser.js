/**
 * @version 2014-08-02
 * - dirNames option
 * - fixed breadrumbs (bug in wrapping in itemTag)
 */
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
 * {object} [dirNames] used to override original directory names. If set
 *           renaming directory with overriden name will be disabled
 * {string|object} [breadcrumbs=false]
 * {string|jQuery|Element} [breadcrumbs.selector]
 * {string} [breadcrumbs.separator="<span class=\"separator\"></span>"] 
 * {string} [breadcrumbs.currentClass="current"]
 */
function DirBrowser(selector, options) { // {{{
    var self = this,
        $ = window.jQuery;

    self.$ = $;

    self._events = {};

    self._element = $(selector).first();
    self._options = $.extend({dirNames: {}}, options);

    // zainicjuj interpolatory stringow
    self._strInterp = new Viewtils.Interp();
    // TODO self._uriInterp = new Viewtils.Interp({esc: escape});

    // biezacy katalog
    self._currentDir = null;

    // tryb wyswietlania (CSS)
    self._displayMode = null;

    // slownik z templejtami adresow operacji na plikach i katalogach
    self._uriTemplates = self._options.uriTemplates;

    // zainicjuj menu pomocnicze, okruchy i widget przesylania plikow
    self._initBreadcrumbs();

    self._initUploader();

    // aktywny element katalogu (plik lub podkatalog)
    self._active = null;

    // kolekcja wszystkich elementow odpowiadajacych katalogom, na ktore
    // mozna upuscic pliki i inne katalogi
    self._dropTargets = null;

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

    //self._element.empty().append(self._renderTemplate(
    //    'DirBrowser.loading',
    //    {str: Drive.Util.i18n('DirBrowser.loading')}
    //));

    // zainicjuj obsluge zmiany hasha w adresie
    $.History.bind(function (state) {
        var path;
        state = String(state);
        if (state.match(/^\/.+/)) {
            path = state.substr(1);
            self.loadDir(path, function (dir) {
                if (0 && window.history.replaceState) {
                    window.history.replaceState(
                        null,
                        null,
                        Drive.Util.uri(self._uriTemplates.dir.read, {path: dir.path})
                    );
                }
                self.setDir(dir);
            });
        }
    });
    $.History.start();

    if (self._options.displayMode) {
        self.setDisplayMode(self._options.displayMode);
    }

    if (self._options.dir) {
        self.setInitDir(self._options.dir);
    }
    return;
} // }}}

DirBrowser.prototype.setInitDir = function (dir) { // {{{
    if (document.location.hash.substr(0, 2) != '#/') {
        this.setDir(dir);
    }
    return this;
} // }}}

DirBrowser.prototype.on = function (type, handler) {
    if (typeof handler !== 'function') {
        throw new Error('Event handler must be a function');
    }
    if (!this._events[type]) {
        this._events[type] = [];
    }
    this._events[type].push(handler);
    return this;
};

DirBrowser.prototype.emit = function (type) {
    var self = this,
        handlers = self._events[type],
        args;
    if (handlers && handlers.length) {
        args = Array.prototype.slice.call(arguments, 1);
        handlers.forEach(function (handler) {
            handler.apply(self, args);
        });
    }
    return self;
};

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
    this.emit('diskUsageChanged', {
        diskSize:  +available > 0 ? +available : Infinity,
        freeBytes: +available > 0 ? (+available - +used) : Infinity,
        usedBytes: +used
    });

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
        item,
        label;

    if (!breadcrumbs) {
        return;
    }

    if (breadcrumbs.after.size()) {
        // insert links after 'after' element ...
        breadcrumbs.after.nextAll().remove();
    } else {
        // ... or at the beginning of breadcrumb container
        breadcrumbs.container.empty();
    }

    if (dir.parents) {
        dir.parents.forEach(function (parent) {
            var item = $('<a/>'),
                label = self._options.dirNames[parent.dir_id] || parent.name;

            item.attr('href', self._dirUrl(parent));
            item.text(String(label));

            if (parent.perms.write) {
                self._addDropTarget(parent, item);
            }

            if (breadcrumbs.separator) {
                item.after(' ' + breadcrumbs.separator + ' ');
            }

            if (breadcrumbs.itemTag) {
                item = $(item).wrap('<' + breadcrumbs.itemTag + '/>').parent();
            }

            breadcrumbs.container.append(item);
        });
    }

    // current element, create SPAN, wrap it in itemTag if required,
    // add proper class
    // .wrap() returns the original set of elements for chaining purposes,
    // hence call to .parent()
    label = self._options.dirNames[dir.dir_id] || dir.name;
    item = $('<span/>').text(String(label));
    if (breadcrumbs.itemTag) {
        item = item.wrap('<' + breadcrumbs.itemTag + '/>').parent();
    }
    if (breadcrumbs.currentClass) {
        item.addClass(breadcrumbs.currentClass);
    }
    breadcrumbs.container.append(item);
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

    if (dir.perms.share && !self._options.disableSharing) {
        ops.push({
            op: 'shareDir',
            title: Drive.Util.i18n('DirBrowser.opShareDir.opname')
        });
        handlers.shareDir = function() {
            self.opShareDir(dir);
            self._closeOpdd();
        };
    }

    if (dir.perms.rename && !self._options.dirNames[dir.dir_id]) {
        ops.push({
            op: 'renameDir',
            title: Drive.Util.i18n('DirBrowser.opRenameDir.opname')
        });
        handlers.renameDir = function () {
            self.opRenameDir(dir);
            self._closeOpdd();
        };
    }

    if(0)ops.push({
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

DirBrowser.prototype._dirUrl = function (dir) { // {{{
    return '#/' + String(dir.path).replace(/^\/+/, '');
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

DirBrowser.prototype.loadDir = function (path, success) { // {{{
    var self = this,
        $ = this.$,
        url = Drive.Util.uri(this._uriTemplates.dir.read, {path: ''}),
        dirNameHook;

    if (self._view) {
        dirNameHook = self._view.hooks.dirName;
        var title = dirNameHook.attr('title');
        dirNameHook
            .addClass('loading')
            .attr('title', String(Drive.Util.i18n('DirBrowser.loadingDirContents')));
    }

    Maniple.ajax({
        url: url,
        type: 'get',
        data: {path: path},
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
    self._dropTargets = [];

    // zainicjuj glowny widok widgetu
    self._initMainView();

    self._updateBreadcrumbs(dir);
    self._updateAuxmenu(dir);

    // podepnij zmiane nazwy katalogu do tytulu strony
    dirName = self._view.hooks.dirName
        .text(String(self._options.dirNames[dir.dir_id] || dir.name))
        .unbind('click')
        .removeClass('renamable')
        .removeAttr('title');

    if (dir.perms.rename && !self._options.dirNames[dir.dir_id]) {
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

    self.emit('dirChanged');
}; // }}}

DirBrowser.prototype.getDisplayMode = function () {
    if (this._displayMode === null) {
        if ($.cookie) {
            this.setDisplayMode($.cookie('DirBrowser.displayMode'));
        }
        if (this._displayMode === null) {
            this._displayMode = this._options.defaultDisplayMode || 'list';
        }
    }
    return this._displayMode;
};

DirBrowser.prototype.setDisplayMode = function (mode) {
    switch (mode) {
        case 'grid':
        case 'list':
        case 'media':
            this._displayMode = mode;
            $.cookie && $.cookie('DirBrowser.displayMode', mode);

            if (this._view) {
                this._view.hooks.dirContents
                    .removeClass('display-grid display-list display-media')
                    .addClass('display-' + mode);
            }

            this.emit('displayModeChanged', mode);
            break;

        default:
            window.console && console.warn('Unsupported display mode: ' + mode);
    }

    return this;
};

var _dialogForm = function (options) // {{{
{
    var dialog = (new Dialog({
        width:  options.width || 300,
        height: options.height || 260,
        title:  options.title,
        buttons: [
            {
                id: 'submit',
                label: options.submitLabel || Drive.Util.i18n('DirBrowser.submitLabel'),
                action: function (dialog) {
                    if (options.submitMessage) {
                        dialog.setStatus(options.submitMessage);
                    }

                    Maniple.ajax({
                        url: options.url,
                        type: 'post',
                        data: dialog.getContentElement().find('form').serialize(),
                        dataType: 'json',
                        success: function (response) {
                            options.success(dialog, response);
                        },
                        fail: function (response) {
                            var errors = response.data,
                                values = {},
                                content;

                            dialog.setStatus(response.message);

                            $.each(
                                dialog.getContentElement().find('form').serializeArray(),
                                function (key, value) {
                                    values[value.name] = value.value;
                                }
                            );

                            content = options.form(dialog, values, errors);
                            if (content) {
                                dialog.setContent(content);
                            }
                        },
                        error: function (response) {
                            dialog.setStatus(response.message);
                        }
                    });
                },
                className: 'btn btn-primary'
            },
            {
                id: 'cancel',
                label: options.cancelLabel || Drive.Util.i18n('DirBrowser.cancelLabel'),
                action: 'close',
                className: 'btn'
            }
        ],
        content: function (dialog) {
            var content = options.form(dialog);
            if (content) {
                dialog.setContent(content);
            }
        },
        open: options.open
    }));
    dialog.getContentElement().on('submit', 'form', function () {
        dialog.getButton('submit').click();
        return false;
    });
    dialog.open();
}; // }}}

/**
 * This method is a part of public API.
 */
DirBrowser.prototype.createDir = function () {
    return this.opCreateDir(this._currentDir);
};

DirBrowser.prototype.isWritable = function () {
    return !!this._currentDir.perms.write;
};

DirBrowser.prototype.showUploader = function () {
    if (this._currentDir.perms.write) {
        this._uploader.showDropZone();
    }
};

DirBrowser.prototype.opCreateDir = function (parentDir) { // {{{
    var self = this,
        url = Drive.Util.uri(self._uriTemplates.dir.create, {dir_id: parentDir.dir_id}),
        str = Drive.Util.i18n('DirBrowser.opCreateDir');

    function buildForm(dialog, values, errors) {
        var content = self._renderTemplate('DirBrowser.nameForm', {
            str: str,
            value: values && values.name,
            errors: errors && errors.name
        });

        return content;
    }

    _dialogForm({
        width:         300,
        title:         str.title,
        submitLabel:   str.submit,
        url:           url,
        form:          buildForm,
        open: function () {
            this.getContentElement().find('input[name="name"]').focus();
        },
        success: function (dialog, response) {
            var dir = response.data.dir;

            if (!dir.path) {
                dir.path = self._currentDir.path + '/' + dir.dir_id;
            }

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

    function buildForm(dialog, values, errors) {
        var content = self._renderTemplate('DirBrowser.nameForm', {
            str: str,
            value: values ? values.name : dir.name,
            errors: errors && errors.name
        });

        return content;
    }

    _dialogForm({
        width:       300,
        title:       str.title,
        submitLabel: str.submit,
        url:         url,
        form:        buildForm,
        open: function () {
            this.getContentElement().find('input[name="name"]').focus().select();
        },
        success: function (dialog, response) {
            var responseDir = response.data.dir,
                dirName = responseDir.name;

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

                self._removeDropTarget(oldElement);

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

    Maniple.ajax({
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

DirBrowser.prototype.opShareDir = function (dir) { // {{{
    var $ = this.$,
        self = this,
        str,
        url;

    if (self._options.disableSharing) {
        window.console && window.console.warn('Sharing is disabled');
        return;
    }

    str = Drive.Util.i18n('DirBrowser.opShareDir');
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
                    Maniple.ajax({
                        url: url,
                        type: 'post',
                        data: dialog.getContentElement().find('form').serialize(),
                        dataType: 'json',
                        success: function (response) {
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

            content.find('#drive-dir-share-acl-users').addClass('loading');
            Maniple.ajax({
                url: url,
                type: 'get',
                success: function (response) {
                    content.find('#drive-dir-share-acl-users').removeClass('loading');

                    var responseDir = response.data;

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

                    content.find('#drive-dir-share-acl-no-users').html(String(str.aclNoUsers));

                    // zainicjuj widget listy uzytkownikow
                    new Drive.UserPicker(
                        content.find('#drive-dir-share-acl'),
                        userBuilder,
                        {
                            idColumn: 'user_id',
                            url: self._options.userSearchUrl,
                            users: responseDir.shares,
                            autocomplete: {
                                renderItem: function (user) {
                                    return self._renderTemplate('DirBrowser.opShareDir.userAutocomplete', {user: user});
                                },
                                renderValue: function (user) {
                                    return user.first_name + ' ' + user.last_name;
                                }
                            }
                        }
                    );
                }
            });

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
        url = Drive.Util.uri(self._uriTemplates.file.rename, file),
        str = Drive.Util.i18n('DirBrowser.opRenameFile');

    function selection(element, start, end) { // {{{
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

    function buildForm(dialog, values, errors) {
        var content = self._renderTemplate('DirBrowser.nameForm', {
            str: str,
            value: values ? values.name : file.name,
            errors: errors && errors.name
        });

        return content;
    }

    _dialogForm({
        width:       240,
        title:       str.title,
        submitLabel: str.submit,
        url:         url,
        form:        buildForm,
        open: function () {
            this.getContentElement().find('input[name="name"]').each(function() {
                var j = $(this),
                    val = j.val(),
                    pos = val.lastIndexOf('.');

                // zaznacz nazwe pliku bez rozszerzenia
                selection(j, 0, pos == -1 ? val.length : pos);
            });
        },
        success: function (dialog, response) {
            var responseFile = response.data;

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

    Maniple.ajax({
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
                var responseFile = response.data;

                $.extend(file, responseFile);

                if (file.element) {
                    self._renderFile(file, true);
                }

                dialog.close();
            }
        }
    });
}; // }}}

DirBrowser.prototype.opFileDetails = function(file) { // {{{
    var self = this,
        str = Drive.Util.i18n('DirBrowser.opFileDetails');

    if (self._options.disableSharing) {
        file.url = null;
    }

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

DirBrowser.prototype._subdirOps = function (dir) { // {{{
    var self = this,
        ops = {};

    ops.open = {
        op: 'open',
        title: Drive.Util.i18n('DirBrowser.opOpenDir.opname'),
        handler: function () {
            document.location = self._dirUrl(dir);
            return false;
        }
    };

    if(0)ops.details = {
        op: 'details',
        title: Drive.Util.i18n('DirBrowser.opDirDetails.opname'),
        handler: function () {
            self.opDirDetails(dir);
            self._closeOpdd();
            return false;
        }
    };

    if (dir.perms.share && !self._options.disableSharing) {
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

    if (dir.perms.rename && !self._options.dirNames[dir.dir_id]) {
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
    element.attr('data-name', String(self._options.dirNames[dir.dir_id] || dir.name)).each(function() {
        self._dropTargets.push(this);
    });
}; // }}}

DirBrowser.prototype._removeDropTarget = function (element) { // {{{
    // element - element dokumentu reprezentujacy wpis w katalogu
    var $ = this.$,
        self = this;

    // addBack is available since jQuery 1.8
    element.find('[data-drop-dir]').addBack('[data-drop-dir]').each(function() {
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
    var element = self._renderTemplate('DirBrowser.dirContents.updir', {dir: dir}),
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
        str = Drive.Util.i18n('DirBrowser.dirContents'),
        element = self._renderTemplate('DirBrowser.dirContents.file', {file: file, ops: ops, str: str}),
        hooks = Viewtils.hooks(element, {
            required: ['grab', 'icon', 'name'],
            wrapper: self.$
        }),
        ext = file.name.match(/(?=.)([-_a-z0-9]+)$/i)[1],
        url = Drive.Util.uri(self._uriTemplates.file.read, file);

    // skoro biezacy katalog jest czytelny, oznacza to, ze wszystkie pliki
    // w nim zawarte rowniez sa czytelne
    // element.attr('data-url', file.url);

    [/*hooks.icon,*/ hooks.name].forEach(function (elem) {
        if (file.preview_url) {
            // enable lightbox on this element
            elem.attr('data-open-lightbox', '');
            elem.attr('data-download-url', url);
            elem.attr('href', file.preview_url);
        } else {
            elem.attr('href', url); // 'data-goto-url', '');
        }
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

    self.setDisplayMode(self.getDisplayMode());

    view.hooks.header.append(self._renderHeader());

    if (dir.parents.length && !self._options.disableUpdir) {
        view.hooks.updir.append(self._renderUpdir(dir.parents[dir.parents.length - 1]));
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

    self._lightbox = new Drive.Lightbox(self._element, {
        delegate: '[data-open-lightbox]'
    });

    self._active = null;
}; // }}}

