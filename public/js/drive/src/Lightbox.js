function Lightbox(selector, options) {
    this._init(selector, options);
}

Lightbox.prototype = {
    _init: function (selector, options) {
        var self = this,
            el = $(selector).first(),
            str = Drive.Util.i18n('Lightbox');

        options = $.extend(true, {}, options);

        el.magnificPopup({
            delegate: options.delegate || 'a',
            type: 'image',
            closeBtnInside: false,
            closeOnContentClick: true,
            callbacks: {
                beforeOpen: function () {
                    var self = this;
                    [
                        ['bgOverlay',        'mfp-bg',        'drive-viewer-overlay'],
                        ['wrap',             'mfp-wrap',      'drive-viewer'],
                        ['container',        'mfp-container', 'drive-viewer-container'],
                        ['contentContainer', 'mfp-content',   'drive-viewer-content'],
                        ['preloader',        'mfp-preloader', 'drive-viewer-preloader']
                    ].forEach(function (map) {
                        self[map[0]].removeClass(map[1]).addClass(map[2]);
                    });
                }
            },
            disableOn: function disableOn() {
                // contrary to this function's name lightbox will be disabled
                // when false is returned
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
                titleSrc: function titleSrc(item) {
                    var title = item.el.data('title') || item.el.attr('title'),
                        caption = item.el.data('caption'),
                        downloadUrl = item.el.data('downloadUrl') || item.el.attr('href'),
                        html;

                    // append download=1 URL parameter to force file download
                    downloadUrl += (downloadUrl.indexOf('?') === -1 ? '?' : '&') + 'download=1';

                    html = '<div class="actions"><a class="btn btn-primary" href="#!" onclick="(event||window.event).stopPropagation();document.location.href=\'' + Viewtils.esc(downloadUrl) + '\'" >' + str.saveImage + '</a></div>' + '<h4 class="title">' + Viewtils.esc(title) + '</h4>';

                    if (caption && (caption = Viewtils.esc(caption)).length) {
                        html += '<div class="caption">' + caption + '</div>';
                    }

                    return html;
                },
                markup: '<div class="drive-viewer-figure">' +
                            '<div class="mfp-img"></div>' +
                            '<div class="drive-viewer-bottom-bar">' +
                                '<div class="drive-viewer-bottom-bar-inner">' +
                                    '<div class="drive-viewer-metadata mfp-title"></div>' +
                                    '<div class="drive-viewer-counter mfp-counter"></div>' +
                                '</div>' +
                            '</div>' +
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

