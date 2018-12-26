const Dispatcher = require("./Dispatcher.js");
module.exports = function execute(source, compile = false, spawn = false) {
	if (compile) {
		const hzCompile = require('hertzscript-compiler');
		source = hzCompile(source, false, false, spawn);
	}
	source = "return hzUserLib.hookCoroutine(function*(){" + source + "});";
	const hzModule = new Function("hzUserLib", source);
	const hzDisp = new Dispatcher();
	hzDisp.import(hzModule);
	return hzDisp.runComplete();
};