var global = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
if (!("tknLib") in global) {
	const TokenLib = require("TokenLib.js");
	global.tknLib = new TokenLib();
}
const tknLib = global.tknLib;
const Dispatcher = require("./Dispatcher.js");
const hzDisp = new Dispatcher(tknLib);
