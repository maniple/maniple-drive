LOCALES := $(patsubst %.js,%, $(wildcard src/i18n/*.js))
LOCALES := $(LOCALES:src/i18n/%=%)

OUTPUT = $(addprefix dist/drive., $(addsuffix .js, $(LOCALES)))
MODULE = Drive

all: $(OUTPUT)
	@mkdir -p dist

src/%.js: $(wildcard src/i18n/*.js)

src/Templates.js: src/Templates.xml
	php build/build-templates $< $@

dist/drive.%.js: $(wildcard src/*.js) src/Templates.js
	php build/build-src $(MODULE) src/i18n/$*.js:I18n -o $@ $^


.PHONY: install clean

install: all
	cp -f $(OUTPUT) ..

clean:
	rm -rf $(OUTPUT) src/Templates.js
