const Dispatcher = require("./Dispatcher.js");
const hzCompile = require("hertzscript-compiler");
module.exports = function execute(source, compile = false, spawn = false, async = null) {
	if (compile) source = hzCompile(source, false, false, spawn);
	source = "(hzUserLib.hookCoroutine(function* (){" + source + "}))";
	var hzModule = new Function(
		'exports',
		'require',
		'module',
		'__filename',
		'__dirname',
		"return hzUserLib => { return " + source + "};"
	);
	const hzDisp = new Dispatcher();
	hzDisp.import(hzModule(exports, require, module, __filename, __dirname));
	if (async === null) return hzDisp.runComplete();
	return hzDisp.runAsync(5, async, true);
};