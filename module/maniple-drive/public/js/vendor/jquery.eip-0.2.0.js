/*!
 * jQuery Edit In Place plugin
 *
 * This version is based on 0.1.2 version of jQuery Edit In Place (JEIP)
 * from http://josephscott.org/code/javascript/jquery-edit-in-place/
 *
 * Version: 0.2.0 (2012-12-16, Xemlock)
 *
 * Copyright (c) 2008 Joseph Scott - released under MIT License
 */
/*
Copyright (c) 2008 Joseph Scott, http://josephscott.org/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// version: 0.2.0

(function( $ ) {
    var eip_counter = 0;

    $.fn.eip = function( target, options ) {
        // Defaults
        var opt = {
            target: target
        }

        $.extend( opt, $.fn.eip.defaults, options );

        var _id = function( self, key ) {
            var id = 'jeip-' + key + '-' + self.getAttribute( 'data-jeip-id' );
            return id;
        }

        // Private functions
        var _attach = function( self ) {
            var $self = $( self );

            $self.attr( 'title', opt.hint_text );

            if( !$.trim( $self.html() ).length ) {
                $self.addClass( opt.empty_class );
                $self.html( opt.empty_text );
            }

            $self.bind( opt.edit_event, function() {
                _editMode( this );
            });
        }

        var _show = function( self ) {
            var $edit = $( '#' + _id( self, 'edit' ) );
            var $editor = $( '#' + _id( self, 'editor' ) );

            if( opt.focus_edit ) {
                $edit.focus( );
            }

            if( opt.select_text ) {
                $edit.select( );
            }

            if( typeof opt.on_show === 'function' ) {
                $editor.each( function() {
                    opt.on_show.call( this );
                } );
            }
        }

        var _editMode = function( self ) {
            var $self = $( self );

            $self.unbind( opt.edit_event );

            $self.removeClass( opt.mouseover_class );
            $self.fadeOut( "fast", function() {
                var value = $self.hasClass( opt.empty_class ) ? '' : $self.html( );

                if( typeof opt.prepare_value === 'function' ) {
                    value = opt.prepare_value( value );
                }

                self._eipInitialValue = value;

                var safe_value = value;

                safe_value = safe_value.replace( /</g, "&lt;" )
                safe_value = safe_value.replace( />/g, "&gt;" );
                safe_value = safe_value.replace( /"/g, "&quot;" );
                safe_value = safe_value.replace( /'/g, "&#39;" );

                var orig_option_value = false;

                var form = opt.template( opt.start_form, {
                    id              : _id( self, 'editor' ),
                    editor_class    : opt.editor_class
                } );

                if( opt.form_type == 'text' ) {
                    form += opt.template( opt.text_form, {
                        id              : _id( self, 'edit' ),
                        editfield_class : opt.editfield_class,
                        value           : safe_value
                    } );
                } // text form
                else if( opt.form_type == 'textarea' ) {
                    var length = value.length;
                    var rows = ( length / opt.cols ) + 2;

                    for( var i = 0; i < length; i++ ) {
                        if( value.charAt( i ) == "\n" ) {
                            rows++;
                        }
                    }

                    if( rows > opt.max_rows ) {
                        rows = opt.max_rows;
                    }
                    if( opt.rows != false ) {
                        rows = opt.rows;
                    }
                    rows = parseInt( rows );

                    form += opt.template( opt.textarea_form, {
                        id              : _id( self, 'edit' ),
                        cols            : opt.cols,
                        rows            : rows,
                        editfield_class : opt.editfield_class,
                        value           : safe_value
                    } );
                } // textarea form
                else if( opt.form_type == 'select' ) {
                    form += opt.template( opt.start_select_form, {
                        id              : _id( self, 'edit' ),
                        editfield_class : opt.editfield_class
                    } );

                    $.each( opt.select_options, function( k, v ) {
                        var selected = '';
                        if( v == value ) {
                            selected = 'selected="selected"';
                        }

                        if( value == v ) {
                            orig_option_value = k;
                        }

                        form += opt.template( opt.select_option_form, {
                            id          : _id( self, 'edit-option-' + k ),
                            option_value: k,
                            option_text : v,
                            selected    : selected
                        } );
                    } );

                    form += opt.template( opt.stop_select_form, { } );
                } // select form

                form += opt.template( opt.form_buttons, {
                    save_id             : _id( self, 'save' ),
                    cancel_id           : _id( self, 'cancel' ),
                    savebutton_class    : opt.savebutton_class,
                    savebutton_text     : opt.savebutton_text,
                    cancelbutton_class  : opt.cancelbutton_class,
                    cancelbutton_text   : opt.cancelbutton_text,
                    or_text             : opt.or_text
                } );

                form += opt.template( opt.stop_form, { } );

                var $form = $( form ).css( 'display', 'none' );

                $self.after( $form );

                $( '#' + _id( self, 'editor' ) ).fadeIn( "fast" );

                var $edit = $( '#' + _id( self, 'edit' ) );

                if( opt.cancel_on_blur ) {
                    $edit.blur( function() {
                        // TODO cancel edit but only if there was focus on text field
                        _cancelEdit( self );
                    } );
                }

                $edit.keydown( function( e ) {
                    // cancel
                    if( e.which == 27 && opt.cancel_on_esc ) {
                        _cancelEdit( self );
                        return false;
                    }

                    // save
                    if( e.which == 13 && opt.form_type != "textarea" ) {
                        _saveEdit( self, orig_option_value );
                        return false;
                    }
                } );

                $( '#' + _id( self, 'cancel' ) ).bind( "click", function() {
                    _cancelEdit( self );
                } );

                $( '#' + _id( self, 'save' ) ).bind( "click", function() {
                    return _saveEdit( self, orig_option_value );
                } );

                _show( self );

            } ); // this fadeOut
        } // function _editMode

        var _cancelEdit = function( self ) {
            var $self = $( self );

            $( '#' + _id( self, 'editor' ) ).fadeOut( "fast", function() {
                if( typeof opt.on_hide === 'function' ) {
                    opt.on_hide.call( this );
                }

                $( this ).remove();

                if( opt.mouseover_class ) {
                    $self.removeClass( opt.mouseover_class );
                }

                $self.fadeIn( "fast" );
            } );

            _attach( self );
        };

        var _error = function( self, response, jqXHR ) {
            var $editor = $( '#' + _id( self, 'editor' ) );

            $( '#' + _id( self, 'saving' ) ).fadeOut( "fast", function() {
                $( this ).remove();

                $editor.fadeIn( "fast", function() {
                    _show( this );                        

                    if( typeof opt.on_error === 'function' ) {
                        opt.on_error.call( $editor.get(0), response, jqXHR );
                    }
                } );
            } );
        }

        var _afterSaveEdit = function( self, response, jqXHR ) {
            var $self = $( self );
            var $editor = $( '#' + _id( self, 'editor' ) );

            // jqXHR requires jQuery 1.4+
            if ( opt.is_error( response, jqXHR ) ) {
                return _error( self, response, jqXHR );
            }

            var new_value = $( '#' + _id( self, 'edit') ).attr( "value" );

            $editor.fadeOut( "fast", function() {
                if( typeof opt.on_hide === 'function' ) {
                    opt.on_hide.call( this );
                }

                $( this ).remove();

                $( '#' + _id( self, 'saving' ) ).fadeOut( "fast", function() {
                    $( this ).remove();

                    var html;

                    if( opt.form_type == "select" ) {
                        html = $( '#' + _id( self, 'edit-option-' + new_value ) ).html( );
                    }
                    else {
                        html = new_value;
                    }

                    // Modify or escape new value before inserting it into the element.
                    // Since result of this function may depend on server response it is
                    // passed as a second parameter.
                    if( typeof opt.process_value === 'function' ) {
                        html = opt.process_value( html, response );
                    }

                    if( $.trim( html ).length ) {
                        $self.removeClass( opt.empty_class );
                    }
                    else {
                        $self.addClass( opt.empty_class );
                        html = opt.empty_text;
                    }

                    $self.html( html );

                    if( opt.mouseover_class ) {
                        $self.addClass( opt.mouseover_class );
                    }

                    $self.fadeIn( "fast" );

                    if( typeof opt.after_save === 'function' ) {
                        opt.after_save.call( self, response, jqXHR );
                    }

                    if( opt.mouseover_class ) {
                        $self.removeClass( opt.mouseover_class );
                    }
                } );

                _attach( self );
            } );
        }

        var _saveEdit = function( self, orig_option_value ) {
            var $self = $( self );
            var new_value = $( '#' + _id( self, 'edit' ) ).val();

            if( self._eipInitialValue == new_value ) {
                _cancelEdit( self );
                return true;
            }

            var $saving = $( opt.template( opt.saving, {
                id          : _id( self, 'saving' ),
                saving_class: opt.saving_class,
                saving_text : opt.saving_text
            } ));

            $( '#' + _id( self, 'editor' ) )
                .after( $saving.css('display', 'none') )
                .fadeOut( "fast", function( ) {
                    $saving.fadeIn( "fast" );
                } );

            var request_data = {};
            request_data[ opt.name ] = new_value;

            var context_data = {
                url         : location.href,
                name        : opt.name,
                form_type   : opt.form_type,
                orig_value  : self._eipInitialValue,
                new_value   : new_value,
                data        : opt.data
            }

            if( opt.form_type == "select" ) {
                context_data.orig_option_value = orig_option_value;
                context_data.orig_option_text = context_data.orig_value;
                context_data.new_option_text = $( '#' + _id( self, 'edit-option-' + new_value ) ).html( );
            }

            if ( $.isFunction( opt.prepare_data ) ) {
                $.extend( request_data, opt.prepare_data( context_data ));
            }

            if( $.isFunction( opt.target ) ) {
                var response = opt.target.call( null, request_data );
                _afterSaveEdit( self, response );
            }
            else if( opt.target ) {
                $.ajax( {
                    url     : opt.target,
                    type    : opt.method,
                    dataType: "json",
                    data    : request_data,
                    success : function( data, textStatus, jqXHR ) {
                        _afterSaveEdit( self, data, jqXHR );
                    },
                    error   : function( jqXHR, textStatus, errorThrown ) {
                        var data = null;
                        try {
                            data = $.parseJSON(jqXHR.responseText);
                        } catch (e) {
                        }
                        _afterSaveEdit( self, data, jqXHR );
                    }
                } ); // ajax
            }
            else {
                _afterSaveEdit( self, null, null );
            }
        }; // _saveEdit


        this.each( function( ) {
            var $this = $( this );

            if (opt.mouseover_class) {
                $this.bind( "mouseenter mouseleave", function() {
                    $( this ).toggleClass( opt.mouseover_class );
                } );
            }

            $this.attr( 'data-jeip-id', eip_counter++ );

            _attach( this );
        } ); // this.each

    }; // inplaceEdit

    $.fn.eip.defaults = {
        name                : 'value',
        method              : "POST",

        save_on_enter       : true,
        cancel_on_esc       : true,
        cancel_on_blur      : false,
        focus_edit          : true,
        select_text         : false,
        edit_event          : "click",
        select_options      : false,
        data                : false,

        form_type           : "text", // text, textarea, select
        size                : false, // calculate at run time
        max_size            : 60,
        rows                : false, // calculate at run time
        max_rows            : 10,
        cols                : 60,

        savebutton_text     : "SAVE",
        savebutton_class    : "jeip-savebutton",
        cancelbutton_text   : "CANCEL",
        cancelbutton_class  : "jeip-cancelbutton",

        mouseover_class     : false, // no mouseover class
        editor_class        : "jeip-editor",
        editfield_class     : "jeip-editfield",

        hint_text           : "Click to edit",
        or_text             : "OR",
        empty_text          : "(Click to edit)",
        empty_class         : "jeip-empty",

        saving_text         : "Saving ...",
        saving_class        : "jeip-saving",

        saving              : '<span id="#{id}" class="#{saving_class}">#{saving_text}</span>',

        start_form          : '<span id="#{id}" class="#{editor_class}">',
        form_buttons        : '<span><input type="button" id="#{save_id}" class="#{savebutton_class}" value="#{savebutton_text}"/> #{or_text} <input type="button" id="#{cancel_id}" class="#{cancelbutton_class}" value="#{cancelbutton_text}"/></span>',
        stop_form           : '</span>',

        text_form           : '<input type="text" id="#{id}" class="#{editfield_class}" value="#{value}"/> <br/>',
        textarea_form       : '<textarea cols="#{cols}" rows="#{rows}" id="#{id}" class="#{editfield_class}">#{value}</textarea> <br/>',
        start_select_form   : '<select id="#{id}" class="#{editfield_class}">',
        select_option_form  : '<option id="#{id}" value="#{option_value}" #{selected}>#{option_text}</option>',
        stop_select_form    : '</select>',

        after_save          : function() {
            var $this = $( this );
            for( var i = 0; i < 2; ++i ) {
                $this.fadeOut( "fast" );
                $this.fadeIn( "fast" );
            }
        },
        is_error            : function( response ) {
            return response && response.error;
        },
        on_error            : function( response ) {
            alert( 'Error: ' + response.error );
        },
        on_show             : null,
        on_hide             : null,
        prepare_data        : null,
        prepare_value       : null,
        process_value       : null,
        template            : function( template, values ) {
            var replace = function( str, match ) {
                return typeof values[match] === "string" || typeof values[match] === "number" ? values[match] : str;
            };
            return template.replace( /#\{([^{}]*)}/g, replace );
        }
    }; // defaults

})( jQuery );
