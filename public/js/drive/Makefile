# npm install -g handlebars@^1.3.0

LOCALES := $(patsubst %.js,%, $(wildcard src/i18n/*.js))
LOCALES := $(LOCALES:src/i18n/%=%)

OUTPUT = $(addprefix ../drive., $(addsuffix .js, $(LOCALES)))
MODULE = Drive

ifeq ($(windir),)
    BIN_SUFFIX =
else
    BIN_SUFFIX = .exe
endif

all: $(OUTPUT)

src/%.js: $(wildcard src/i18n/*.js)

src/Templates.js: $(wildcard src/templates/*.hbs)
	php$(BIN_SUFFIX) build/build-templates $< $@

../drive.%.js: src/deps.json $(wildcard src/*.js) src/Templates.js
	php$(BIN_SUFFIX) build/build-src $(MODULE) src/i18n/$*.js:I18n -o $@ -d $^


.PHONY: clean

clean:
	rm$(BIN_SUFFIX) -rf $(OUTPUT) src/Templates.js
