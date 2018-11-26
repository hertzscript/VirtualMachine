var global = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
if (!("tknLib" in global)) {
	const hzTokenLib = require("./TokenLib.js");
	global.hzTknLib = new hzTokenLib();
	global.hzUserLib = {};
	for (const name in global.hzTknLib) global.hzUserLib[name] = (...args) => global.hzTknLib[name].set(args);
}
const hzTknLib = global.hzTknLib;
const hzUserLib = global.hzUserLib;
const hzDispatcher = require("./Dispatcher.js");
const hzDisp = new hzDispatcher(hzTknLib);
module.exports = hzDisp.createCoroutine(function* testProgram() {
    yield hzUserLib.spawn('test');
    var spawn = 123;
    var spawn;
    spawn = 123;
    yield hzUserLib.spawn(thing);
    yield hzUserLib.spawn(hzDisp.createCoroutine(function* () {}));
    yield hzUserLib.spawn(hzDisp.createCoroutine((hello, world) => {}));
});