var global = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
if (!("tknLib" in global)) {
	const hzTokenLib = require("./TokenLib.js");
	global.hzTknLib = new hzTokenLib();
	global.hzUserLib = {};
	for (const name in global.hzTknLib) global.hzUserLib[name] = (...args) => global.hzTknLib[name].set(...args);
}
const hzTknLib = global.hzTknLib;
const hzUserLib = global.hzUserLib;
const hzDispatcher = require("./Dispatcher.js");
const hzDisp = new hzDispatcher(hzTknLib);
module.exports = hzDisp.createCoroutine(function* program() {
	var add = hzDisp.createCoroutine(function* add(num1, num2) {
		return userLib.returnValue(num1 + num2);
	});
	var genNumberIterator = hzDisp.createGenerator(function* genNumberIterator() {
		while (true) yield userLib.yieldValue((yield userLib.call(genNumber)));
	});
	var genNumber = hzDisp.createCoroutine(function* genNumber() {
		return userLib.returnValue((yield userLib.callMethod((yield userLib.callMethod(Math, "random")), "toFixed")));
	});

	const numIterator = (yield userLib.call(genNumberIterator));
	yield userLib.callMethodArgs(console, "log", [(yield userLib.callArgs(add, [(yield userLib.callMethod(numIterator, "next")).value, (yield userLib.callMethod(numIterator, "next")).value]))]);
});