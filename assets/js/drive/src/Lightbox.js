function Lightbox(selector, options) {
    this._init(selector, options);
}

Lightbox.prototype = {
    _init: function (selector, options) {
        var self = this,
            el = $(selector).first();

        options = $.extend(true, {}, options);

        var str = {
            saveImage: 'Zapisz obraz',
            loadingImage: 'Wczytuję obraz...',
            imageFailedToLoad: 'Wczytywanie obrazu nie powiodło się.',
            next: 'Następny',
            prev: 'Poprzedni',
            close: 'Zamknij',
            counter: '%curr% z %total%'
        };

        str = {
            saveImage: 'Save image',
            loadingImage: 'Loading image...',
            imageFailedToLoad: 'Failed to load image.',
            next: 'Next',
            prev: 'Previous',
            close: 'Close',
            counter: '%curr% of %total%'
        };

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
            disableOn: function () {
                // contrary to this function's name lightbox will be disabled
                // when false is returned
                return self.disabled ? false : true;
            },
            tClose: str.close,
            tLoading: str.loadingImage,
            gallery: {
                enabled: true,
                tPrev: str.prev,
                tNext: str.next,
                tCounter: str.counter
            },
            image: {
                verticalFit: false,
                verticalGap: 0,
                tError: str.imageFailedToLoad,
                titleSrc: function (item) {
                    var title = '<div class="actions"><a class="btn btn-primary" href="#!" onclick="(event||window.event).stopPropagation();document.location.href=\'' + Viewtils.esc(item.el.attr('data-download-url')) + '\'" >' + str.saveImage + '</a></div>' + '<h4 class="title">' + Viewtils.esc(item.el.attr('title')) + '</h4>',
                    caption = item.el.attr('data-caption');
                    if (caption && (caption = Viewtils.esc(caption)).length) {
                        title += '<div class="caption">' + caption + '</div>';
                    }
                    return title;
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

