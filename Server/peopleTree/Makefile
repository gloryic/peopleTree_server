REPORTER = spec
APPNAME = oauth2playground

COMMON_OPTION = --reporter spec --ui bdd --require should --compilers coffee:coffee-script/register
MOCHA = @node_modules/.bin/mocha

all: clean-install test

install:
	@npm install

clean:
	@rm -rf ./node_modules
	@rm -f ${APPNAME}.zip

clean-install: clean install

compile:
	@coffee --compile --output ./ src/

test: compile
	${MOCHA} ${COMMON_OPTION} -t 60000 test/*.coffee

package:
	zip -r ${APPNAME}.zip ./ -x node_modules\* .git\* .gitignore .DS_Store test\*

.PHONY: all install clean clean-install compile test package