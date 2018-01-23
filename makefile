noargs :
	@printf "\
	╭─────────────────────────────────────────╮\n\
	│        HertzScript Build Options        │\n\
	├─────────────────────────────────────────┤\n\
	│ ▶ Run Tests:          'make test'       │\n\
	│ ▶ Production Build:   'make prod'       │\n\
	│ ▶ Clean Build:        'make prod clean' │\n\
	╰─────────────────────────────────────────╯\n\n"

node_modules/jasmine/bin/jasmine.js :
	@printf "Downloading jasmine from NPM...\n"
	@npm i jasmine --save-dev
node_modules/pegjs/bin/pegjs :
	@printf "Downloading PEG.js from NPM...\n"
	@npm install --save pegjs
prod-build :
	@rm -drf prod-build
	@mkdir prod-build
prod-build/src : prod-build
	@rm -drf prod-build/src
	@cp -r src prod-build/src
prod-build/dist :
	@rm -drf prod-build/dist
	@mkdir prod-build/dist
prod-build/src/javascriptParser.js : prod-build/src node_modules/pegjs/bin/pegjs
	@./node_modules/pegjs/bin/pegjs -o prod-build/src/javascriptParser.js node_modules/pegjs/examples/javascript.pegjs
prod-build/dist/HertzScript.js : prod-build/src/javascriptParser.js
	@printf "Building dist/HertzScript.js\n"
	@mkdir prod-build/dist
	@touch prod-build/dist/HertzScript.js
	@echo "var HzScript = (function(){var module = {};" >> prod-build/dist/HertzScript.js
	@cat prod-build/src/javascriptParser.js src/main.js >> prod-build/dist/HertzScript.js
	@echo "return HzScript;})();if(module!==undefined){module.exports=HzScript}" >> prod-build/dist/HertzScript.js
	@printf "      \x1b[32;01m[OK]\x1b[0m\n"
prod : prod-build/dist/HertzScript.js
	@cp README.md prod-build/README.md
	@cp package.json prod-build/package.json
	@cp node_modules/pegjs/examples/javascript.pegjs prod-build/src/javascript.pegjs
	@printf "Build Done! ･ω･\n"
test : node_modules/jasmine/bin/jasmine.js prod-build/dist/HertzScript.js
	@printf "Running tests...\n"
	@node node_modules/jasmine/bin/jasmine.js spec/Spec.js
clean :
	@printf "Cleaning up...\n"
	@rm -drf node_modules