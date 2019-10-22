const Context = require("./Context.js");
const hzCompile = require("hertzscript-compiler");
module.exports = function execute(source, compile = false, async = false) {
	if (compile) source = hzCompile(source);
	source = "(hzUserLib.hookCoroutine(function* (){" + source + "}))";
	var hzModule = new Function(
		'exports',
		'require',
		'module',
		'__filename',
		'__dirname',
		"return hzUserLib => { return " + source + "};"
	);
	const context = new Context();
	context.import(hzModule(exports, require, module, __filename, __dirname));
	if (!async) return context.runComplete(true);
	function runAsync() {
		context.dispatch(5, true);
		if (!context.terminated) setTimeout(runAsync, 5);
	}
	setTimeout(runAsync, 5);
};