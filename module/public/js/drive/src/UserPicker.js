/**
 * Widget wyboru uzytkownikow i okreslenia dla kazdego z nich praw dostepu.
 *
 * Element wskazany selektorem musi zawierac elementy zawierajace atrybut
 * data-hook o wartosciach 'userSearch', 'userAdd', 'userList', wskazujace
 * odpowiednio na pole tekstowe do wpisywania nazwy uzytkownika, przycisk
 * dodajacy uzytkownika do listy, liste wybranych uzytkownikow. Opcjonalny
 * jest element o atrybucie data-hook 'emptyListMessage' reprezentujacy
 * element listy niepowiazany z zadnym uzytkownikiem, sluzacy jedynie do
 * wyswietlenia komunikatu o pustej liscie wybranych uzytkownikow.
 *
 * Dodanie uzytkownika do listy wybranych wywoluje zdarzenie 'append'
 * z wartoscia pola relatedNode wskazujaca na bezposredniego rodzica
 * w drzewie dokumentu. Proba dodania uzytkownika, ktory jest juz na liscie
 * wywoluje zdarzenie 'exists'. Usuniecie uzytkownika wywoluje zdarzenie
 * 'remove' z wartoscia pola relatedNode wskazujacego na bezposredniego
 * rodzica usuwanego elementu.
 *
 * @param {string|jQuery|Element} selector
 * @param {function} itemBuilder   funkcja tworzace element reprezentujacy
 *                                 uzytkownika na liscie
 * @param {object} [options]       ustawienia dodatkowe
 * @param {string} [options.url]   zrodlo danych do autouzupelniania
 * @param {int}    [options.limit] limit liczby elementow
 * @param {Array}  [options.users] poczatkowa lista uzytkownikow
 * @constructor
 * @requires Viewtils
 * @version 2014-04-17 / 2013-07-20 / 2012-12-27
 */
var UserPicker = function(selector, itemBuilder, options) { // {{{
    var $ = window.jQuery,
        self = this,
        container = $(selector),
        hooks,
        users,
        selected,
        term;

    options = $.extend(true, {}, UserPicker.defaults, options);

    function init() {
        users = {length: 0, data: {}};
        hooks = Viewtils.hooks(container, {
            required: ['userSearch', 'userAdd', 'userList'],
            wrapper: $
        });

        // czas zamkniecia listy autouzupelniania
        var closeTime;

        // zainicjuj autouzupelnianie pola do wpisywania danych uzytkownika,
        // przycisk dodajacy uzytkownika do listy wybranych jest odblokowywany
        // po wybraniu uzytkownika, po dodaniu uzytkownika jest blokowany,
        // wartosc pola do wpisywania jest czyszczona
        hooks.userSearch.autocomplete($.extend({}, options.autocomplete, {
            open: function(event, ui) {
                closeTime = null;
            },
            close: function(event, ui) {
                closeTime = event.timeStamp;
            },
            source: options.url || [],
            select: function(event, ui) {
                hooks.userAdd.removeClass('disabled').prop('disabled', false);
                selected = ui.item;
                return false;
            },
            beforeSend: function(request) {
                hooks.userAdd.addClass('disabled').prop('disabled', true);
                selected = null;

                term = $.trim(request.term);
                if (!term.match(/^\d+$/) && term.length < 2) {
                    return false;
                }
            }
        }));

        // zablokuj zdarzenie keydown jezeli wcisnieto Enter, aby zablokowac
        // przesylanie formularza. Jezeli wybrano uzytkownika, a lista
        // sugestii zostala zamknieta, wcisniecie Enter dodaje uzytkownika
        // do listy wybranych
        hooks.userSearch.keydown(function(e) {
            if (e.keyCode == 13) { // Enter
                // Trzeba zbadac, czy to zdarzenie odpowiada za jednoczesny
                // wybor uzytkownika z listy sugestii i jej zamkniecie (A),
                // czy za dodanie uprzenio wybranego z listy sugestii
                // uzytkownika wyswietlonego w polu tekstowym do listy
                // wybranych uzytkownikow, w momencie gdy lista sugestii
                // jest zamknieta (B).
                // Trudnosc polega na tym, ze wraz ze zdarzeniem
                // autocompleteclose, wywolanym przez wcisniecie klawisza
                // Enter, puszczane jest rowniez zdarzenie keydown.
                // Aby rozroznic sytuacje A od B badany zostaje czas
                // wystapienia zdarzenia. Jezeli zdarzenie keydown wystapilo
                // nie wczesniej niz 75ms od zamkniecia listy sugestii uznaj,
                // ze jest to zdarzenie dodajace uzytkownika do listy
                // wybranych (B).
                if (selected && closeTime && (e.timeStamp - closeTime >= 75)) {
                    self.addUser(selected);
                    selected = null;

                    this.value = '';
                    hooks.userAdd.addClass('disabled').prop('disabled', true);
                }
                return false;
            }
        });

        // dodaj aktualnie wybranego uzytkownika do listy
        hooks.userAdd.click(function() {
            var j = $(this);

            if (j.hasClass('disabled')) {
                return;
            }

            if (selected) {
                self.addUser(selected);
                selected = null;
            }

            j.addClass('disabled').prop('disabled', true);
            hooks.userSearch.val('');
        });

        // na poczatku przycisk dodawania jest zablokowany
        hooks.userAdd.addClass('disabled').prop('disabled', true);

        // dodaj uzytkownikow do listy, poczatkowe wypelnianie listy
        if (options.users) {
            $.each(options.users, function(key, user) {
                self.addUser(user, false);
            });
        }
    }

    /**
     * Jezeli uzytkownik nie znajduje na liscie wybranych uzytkownikow,
     * tworzy reprezentujacy go element i zapisuje go w polu .element.
     * Jezeli uzytkownik byl juz dodany reprezentujacy go element zostaje
     * podswietlony.
     * @param {object} user
     */
    this.addUser = function(user, _isInitialValue) {
        var element,
            elementHtml,
            elementHooks;

        if (user[options.idColumn] in users.data) {
            // uzytkownik o podanym id jest juz dodany do listy, wywolaj
            // zdarzenie o tym informujace
            users.data[user[options.idColumn]].element.trigger('exists');

        } else {
            if (options.limit > 0 && users.length == options.limit) {
                return false;
            }

            elementHtml = itemBuilder(user);

            // jezeli itemBuilder zwroci false, oznacza to, ze element nie
            // moze zostac dodany.
            if (false === elementHtml) {
                return false;
            }

            element = $(elementHtml);
            elementHooks = Viewtils.hooks(element, {wrapper: $});

            if (elementHooks.userDelete) {
                elementHooks.userDelete.click(function() {
                    delete users.data[user[options.idColumn]];
                    --users.length;

                    hooks.userSearch.removeClass('disabled').prop('disabled', false);

                    // usun element z dokumentu i wywolaj zdarzenie informujace
                    // o usunieciu elementu. Event ma ustawione pole relatedNode
                    // wskazujace na rodzica, od ktorego zostal odlaczony.
                    // http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#event-type-DOMNodeRemoved
                    var parentNode = element.get(0).parentNode;

                    element.trigger({
                        type: 'beforeRemove'
                    });
                    element.remove().trigger({
                        type: 'remove',
                        relatedNode: parentNode
                    });
                    container.trigger('itemRemove', [user, element]);

                    // usun referencje do elementu aby ulatwic odsmiecanie
                    element = null;

                    delete user.element;
                    user = null;

                    if (!users.length && hooks.emptyListMessage) {
                        hooks.emptyListMessage.appendTo(hooks.userList);
                    }
                });
            }

            if (!users.length && hooks.emptyListMessage) {
                hooks.emptyListMessage.remove();
            }

            users.data[user[options.idColumn]] = user;
            ++users.length;

            user.element = element;
            hooks.userList.append(element);

            // wywolaj zdarzenie append informujace element, ze zostal dodany
            // do drzewa dokumentu
            // http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#event-type-DOMNodeInsertedIntoDocument
            element.trigger({
                type: 'append',
                relatedNode: hooks.userList.get(0),
                isInitialValue: _isInitialValue
            });

            container.trigger('itemAdd', [user, element, _isInitialValue]);

            if (options.limit == users.length) {
                hooks.userSearch.addClass('disabled').prop('disabled', true);
            }
        }
    }

    this.getHook = function (name) {
        return hooks.hasOwnProperty(name) ? hooks[name] : null;
    };

    init();
} // }}}

UserPicker.defaults = {
    idColumn: 'id',
    autocomplete: {}
};

