/**
 * @namespace
 * @version 2014-05-24 / 2013-01-13
 */
var Util = {}

Util.interp = function (template, vars, esc) { // {{{
    // string interpolation, compatible with URI-Template (RFC 6570) delimiters
    vars = vars || {};
    return String(template).replace(/\{([_0-9a-z]+)\}/ig, function (match, key) {
        return esc ? esc(vars[key]) : vars[key];
    });
} // }}}

Util.uri = function (template, vars) { // {{{
    vars = vars || {};
    return String(template).replace(/:([_0-9a-z]+)/ig, function (match, key) {
        return escape(vars[key]);
    });
} // }}}

Util.gotoHash = function (hash) { // {{{
    var p = document.location.href.lastIndexOf('#'),
        h = p == -1 ? document.location.href : document.location.href.substr(0, p);
    document.location.href = h + (hash.charAt(0) != '#' ? '#' : '') + hash;
} // }}}

Util.assert = function (cond, message) { // {{{
    if (!cond) {
        alert(message);
        throw message;
    }
} // }}}

Util.render = function (id, vars, wrapper) { // {{{
    var template = Drive.Templates[id];

    Util.assert(typeof template === 'function', 'Template not found: ' + id);

    if (typeof vars === 'function') {
        vars = null;
        wrapper = vars;
    }

    Handlebars['default'].registerHelper('fileSize', function (text) {
        return Viewtils.fsize(text);
    });

    // Backwards compatibility with Mustache.js 0.4.x
    //var fn = Mustache.render ? 'render' : 'to_html',
    //    out = Mustache[fn](template, vars || {});
    // Mustache sucks
    var out = template(vars);

    return typeof wrapper === 'function' ? wrapper(out) : out;
} // }}}

Util.i18n = function (key) { // {{{
    var keys = key.split('.'),
        context = Drive.I18n;

    function helper(str) {
        if (typeof str === 'string') {
            return new Handlebars['default'].SafeString(str);
        } else if (typeof str === 'object' && str !== null) {
            var output = {};
            $.each(str, function (k, v) {
                output[k] = helper(v);
            });
            return output;
        }
        return str;
    }

    while (keys.length) {
        var k = keys.shift();

        if (context[k]) {
            context = context[k];
        } else {
            break;
        }

        if (!keys.length) {
            return helper(context);
        }
    }

    return key;
} // }}}

Util.dropdown = function(items, options) { // {{{
    var container,
        ul,
        id;

    options = $.extend({}, options);

    id = options.id || ('dropdown-' + String(Math.random()).substr(2));

    container = $('<div class="dropdown"><a href="#' + id + '" data-toggle="dropdown">' + Viewtils.esc(options.title || '') + ' <span class="caret"></span></a></div>');
    container.attr('id', id);

    if (options.containerClass) {
        container.addClass(options.containerClass);
    }

    ul = $('<ul class="dropdown-menu"/>').appendTo(container);
    ul.on('focus', 'a.disabled', function () {
        this.blur();
    });
    ul.on('click', 'a.disabled', function () {
        return false;
    });

    if (options.menuClass) {
        ul.addClass(options.menuClass);
    }

    // due to its more specific name, Bootstrap 3 dropdown menu alignment class
    // is used (.dropdown-menu-right instead of more general .pull-right)
    if (options.right) {
        ul.addClass('dropdown-menu-right');
    }
    if (options.tip) {
        ul.addClass('has-tip');
    }

    $.each(items, function (key, item) {
        if (item) {
            var a = $('<a href="#!"/>').text('' + item.title);

            if (item.disabled) {
                a.addClass('disabled');
            } else {
                if (item.url) {
                    a.attr('href', item.url);
                }

                if (typeof item.click === 'function') {
                    a.click(item.click);
                }
            }

            $('<li/>').append(a).appendTo(ul);
        }
    });

    return container;
} // }}}
