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

