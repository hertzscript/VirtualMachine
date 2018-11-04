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
