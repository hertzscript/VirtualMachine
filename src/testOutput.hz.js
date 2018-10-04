var global = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
if (!("tknLib") in global) {
	const TokenLib = require("TokenLib.js");
	global.tknLib = new TokenLib();
}
const tknLib = global.tknLib;
const Dispatcher = require("./Dispatcher.js");
const hzDisp = new Dispatcher(tknLib);
module.exports = hzDisp.createCoroutine(function program() {
	var add = hzDisp.createCoroutine(function* add(num1, num2) {
		return yield tknLib.callMethodArgs(tknLib, "returnValue", [num1 + num2]);
	});
	var genNumberIterator = hzDisp.createGenerator(function* genNumberIterator() {
		while (true) yield (yield tknLib.callMethodArgs(tknLib, "yieldValue", [(yield tknLib.call(genNumber))]));
	});
	var genNumber = hzDisp.createCoroutine(function* genNumber() {
		return yield tknLib.callMethodArgs(tknLib, "returnValue", [(yield tknLib.callMethod((yield tknLib.callMethod(Math, "random")), "toFixed"))]);
	});

	const numIterator = (yield tknLib.call(genNumberIterator));
	yield tknLib.callMethodArgs(console, "log", [(yield tknLib.callArgs(add, [(yield tknLib.callMethod(numIterator, "next")).value, (yield tknLib.callMethod(numIterator, "next")).value]))]);
});