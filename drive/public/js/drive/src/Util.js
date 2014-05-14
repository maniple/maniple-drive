/**
 * @namespace
 * @version 2013-01-13
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
    return decodeURIComponent(unescape(Util.interp(template, vars, escape)));
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

    Util.assert(typeof template === 'string', 'Template not found: ' + id);

    if (typeof vars === 'function') {
        vars = null;
        wrapper = vars;
    }

    // Backwards compatibility with Mustache.js 0.4.x
    var fn = Mustache.render ? 'render' : 'to_html',
        out = Mustache[fn](template, vars || {});

    return typeof wrapper === 'function' ? wrapper(out) : out;
} // }}}

Util.i18n = function (key) { // {{{
    var keys = key.split('.'),
        context = Drive.I18n;

    while (keys.length) {
        var k = keys.shift();

        if (context[k]) {
            context = context[k];
        } else {
            break;
        }

        if (!keys.length) {
            return context;
        }
    }

    return key;
} // }}}

