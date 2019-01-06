# npm install -g handlebars@^1.3.0

LOCALES := $(patsubst %.js,%, $(wildcard src/i18n/*.js))
LOCALES := $(LOCALES:src/i18n/%=%)

OUTPUT = $(addprefix dist/drive., $(addsuffix .js, $(LOCALES)))
MODULE = Drive

ifeq ($(windir),)
    BIN_SUFFIX =
else
    BIN_SUFFIX = .exe
endif

all: dist $(OUTPUT)

dist:
	mkdir$(BIN_SUFFIX) -p dist

src/%.js: $(wildcard src/i18n/*.js)

src/Templates.js: src/Templates.xml
	php$(BIN_SUFFIX) build/build-templates $< $@

dist/drive.%.js: src/deps.json $(wildcard src/*.js) src/Templates.js
	php$(BIN_SUFFIX) build/build-src $(MODULE) src/i18n/$*.js:I18n -o $@ -d $^


.PHONY: install clean dist distclean

install: all
	cp$(BIN_SUFFIX) -f $(OUTPUT) ..

clean:
	rm$(BIN_SUFFIX) -rf $(OUTPUT) src/Templates.js dist

distclean:
	rm -rf dist
