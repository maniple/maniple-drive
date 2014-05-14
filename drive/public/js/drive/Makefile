I18N = pl_PL
OUTPUT = drive.js
MODULE = Drive

all: $(OUTPUT)

$(OUTPUT): $(wildcard src/*.js) src/I18n.js src/Templates.js
	php build-tools/build-src $(MODULE) -o $@ $^

src/I18n.js: src/i18n/$(I18N).js
	cp $< src/I18n.js

src/Templates.js: src/Templates.xml
	php build-tools/build-templates $< $@


.PHONY: install clean

install: all
	mv -f $(OUTPUT) ..

clean:
	rm -rf $(OUTPUT) src/Templates.js src/I18n.js
