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

