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
