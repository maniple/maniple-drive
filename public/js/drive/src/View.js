/**
 * @constructor
 */
var View = function (element, requiredHooks) { // {{{
    this.element = element;
    this.hooks = this.extractHooks(element, requiredHooks);
    this.childViews = {};
} // }}}

/**
 * Replaces hook element with a given view. New view receives class name
 * of parent hook element.
 *
 * @param {string} parentHook
 * @param {View} view
 */
View.prototype.inject = function (parentHook, view) { // {{{
    if (this.hooks[parentHook]) {
        if (view.element.length != 1) {
            throw parentHook + ": Injected view must contain only a single tree of elements";
        }

        // copy original class
        view.element.addClass(this.hooks[parentHook].attr('class'));

        // use parent id if no id is present
        if (!view.element.attr('id')) {
            view.element.attr('id', this.hooks[parentHook].attr('id'));
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

