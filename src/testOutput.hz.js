var global = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
if (!("tknLib" in global)) {
	const TokenLib = require("./TokenLib.js");
	global.tknLib = new TokenLib();
	global.userLib = {};
	for (const name in global.tknLib) global.userLib[name] = (...args) => global.tknLib[name].set(...args);
}
const tknLib = global.tknLib;
const userLib = global.userLib;
const Dispatcher = require("./Dispatcher.js");
const hzDisp = new Dispatcher(tknLib);
module.exports = hzDisp.createCoroutine(function* program() {
	var add = hzDisp.createCoroutine(function* add(num1, num2) {
		return yield userLib.callMethodArgs(userLib, "returnValue", [num1 + num2]);
	});
	var genNumberIterator = hzDisp.createGenerator(function* genNumberIterator() {
		while (true) yield (yield userLib.callMethodArgs(userLib, "yieldValue", [(yield userLib.call(genNumber))]));
	});
	var genNumber = hzDisp.createCoroutine(function* genNumber() {
		return yield userLib.callMethodArgs(userLib, "returnValue", [(yield userLib.callMethod((yield userLib.callMethod(Math, "random")), "toFixed"))]);
	});

	const numIterator = (yield userLib.call(genNumberIterator));
	yield userLib.callMethodArgs(console, "log", [(yield userLib.callArgs(add, [(yield userLib.callMethod(numIterator, "next")).value, (yield userLib.callMethod(numIterator, "next")).value]))]);
});