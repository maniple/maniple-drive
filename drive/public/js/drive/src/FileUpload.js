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
        var upload = item.upload;

        upload.onabort = (function (onAbort) {
            return function () {
                _abort(item);
                _complete(item, onAbort, arguments);
            }
        })(upload.onabort);

        upload.oncomplete = (function (onComplete) {
            return function () {
                _complete(item, onComplete, arguments);
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
