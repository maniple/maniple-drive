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

