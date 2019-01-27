function Lightbox(selector, options) {
    this._init(selector, options);
}

Lightbox.prototype = {
    on: function (event, handler) {
        $(this).on(event, handler);
        return this;
    },
    off: function (event, handler) {
        $(this).off(event, handler);
        return this;
    },
    emit: function (event, data) {
        var data = Array.prototype.slice.call(arguments, 1);
        $(this).triggerHandler(event, data);
        return this;
    },
    _init: function (selector, options) {
        var self = this,
            el = $(selector).first(),
            str = Drive.Util.i18n('Lightbox');

        options = $.extend(true, {}, options);

        this.el = el;

        el.magnificPopup({
            delegate: options.delegate || 'a',
            type: 'image',
            closeBtnInside: false,
            closeOnContentClick: false,
            callbacks: {
                buildControls: function() {
                    // move arrows inside content container
                    if (this.arrowLeft) {
                        this.arrowLeft
                            .removeClass('mfp-arrow mfp-arrow-left')
                            .addClass('drive-viewer-arrow drive-viewer-arrow-left')
                            .on('click', function () {
                                this.contentContainer.removeClass('drive-viewer-content-ready');
                            }.bind(this))
                            .appendTo(this.contentContainer);
                        this.con
                    }

                    if (this.arrowRight) {
                        this.arrowRight
                            .removeClass('mfp-arrow mfp-arrow-right')
                            .addClass('drive-viewer-arrow drive-viewer-arrow-right')
                            .on('click', function () {
                                this.contentContainer.removeClass('drive-viewer-content-ready');
                            }.bind(this))
                            .appendTo(this.contentContainer);
                    }
                },
                beforeOpen: function () {
                    [
                        ['bgOverlay',        'mfp-bg',        'drive-viewer-overlay'],
                        ['wrap',             'mfp-wrap',      'drive-viewer'],
                        ['container',        'mfp-container', 'drive-viewer-container'],
                        ['contentContainer', 'mfp-content',   'drive-viewer-content'],
                        ['preloader',        'mfp-preloader', 'drive-viewer-preloader']
                    ].forEach(function (map) {
                        this[map[0]].removeClass(map[1]).addClass(map[2]);
                    }.bind(this));

                    // It seems that closeOnContentClick:false doesn't work, and we
                    // have to prevent closing on click manually
                    this.container.on('click', function () {
                        return false;
                    });
                },
                resize: function () {
                    var $image = this.currItem && this.currItem.img;
                    $image.css({
                        maxHeight: Math.floor(this.contentContainer.height()),
                        maxWidth: Math.floor(this.contentContainer.width())
                    });
                },
                imageLoadComplete: function () {
                    var $image = this.currItem && this.currItem.img;
                    if (!$image || !$image.length) {
                        return;
                    }

                    var imageElement = $image[0];
                    var width = imageElement.naturalWidth || imageElement.width;
                    var height = imageElement.naturalHeight || imageElement.height;

                    $image.css({
                        maxHeight: this.contentContainer.height(),
                        maxWidth: this.contentContainer.width()
                    });
                    this.contentContainer.addClass('drive-viewer-content-ready');

                    var downloadUrl = this.currItem.el.data('downloadUrl') || this.currItem.el.attr('href');

                    // append download=1 URL parameter to force file download
                    downloadUrl += (downloadUrl.indexOf('?') === -1 ? '?' : '&') + 'download=1';

                    var file = this.currItem.el.data('file') || {};

                    var title = this.currItem.el.data('title') || this.currItem.el.attr('title');
                    this.contentContainer.find('.drive-viewer-sidebar').html(
                        '<div class="gallery-header">' +
                            (options.title ? '<div class="gallery-title">' + options.title + '</div>' : '') +
                            (file.create_time ? '<div class="create-time">' + file.create_time + '</div>' : '') +
                        '</div>' +
                        '<h4 class="title">' + Viewtils.esc(title) + '</h4>'
                    );

                    var sidebarContent = $('<div class="drive-viewer-sidebar-content" />');
                    sidebarContent.append(
                        (file.description ? '<div class="description">' + file.description + '</div>' : '') +
                        (file.author ? '<div class="author">' + file.author + '</div>' : '')
                    );
                    this.contentContainer.find('.drive-viewer-sidebar').append(sidebarContent);

                    this.contentContainer.find('.drive-viewer-toolbar').html(
                        (this.contentContainer.find('.mfp-counter').text() || '&nbsp;') +
                        '<a class="drive-viewer-toolbar-download btn btn-default" href="#!" onclick="(event||window.event).stopPropagation();document.location.href=\'' + Viewtils.esc(downloadUrl) + '\'" style="float:right">' + str.saveImage + '</a>'
                    );

                    self.emit('imageLoaded', {
                        width: width,
                        height: height,
                        src: this.currItem.src,
                        element: $image,
                        triggerElement: this.currItem.el
                    });
                }
            },
            disableOn: function disableOn() {
                // contrary to this function's name lightbox will be disabled
                // when false is returned
                if (typeof self.disabled === 'function') {
                    return !self.disabled();
                }
                return self.disabled ? false : true;
            },
            tClose: String(str.close),
            tLoading: String(str.loadingImage),
            gallery: {
                enabled: true,
                tPrev: String(str.prev),
                tNext: String(str.next),
                tCounter: String(str.counter)
            },
            image: {
                verticalFit: false,
                verticalGap: 0,
                tError: String(str.imageFailedToLoad),
                // titleSrc: function titleSrc(item) {
                //     console.log('titleSrc', this, item);
                //     var title = item.el.data('title') || item.el.attr('title'),
                //         caption = item.el.data('caption'), // legacy
                //         html;
                //
                //     html = '<h4 class="title">' + Viewtils.esc(title) + '</h4>';
                //
                //     if (caption && (caption = Viewtils.esc(caption)).length) {
                //         html += '<div class="caption">' + caption + '</div>';
                //     }
                //
                //     return html;
                // },
                markup: '<div class="drive-viewer-figure">' +
                            '<div class="mfp-img"></div>' +
                            '<div class="drive-viewer-counter mfp-counter"></div>' +
                        '</div>' +
                        '<div class="drive-viewer-sidebar">' +
                        '</div>' +
                        '<div class="drive-viewer-toolbar">' +
                        '</div>'
            }
        });
    },
    disable: function disable(flag) {
        if (typeof flag === 'undefined') {
            flag = true;
        }
        this.disabled = !!flag;
    }
};

