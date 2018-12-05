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
    yield hzUserLib.callArgs(spawn, ['test']);
    yield hzUserLib.callArgs(spawn, ['test']);
    yield hzUserLib.callMethodArgs(thing, 'spawn', ['test']);
    yield hzUserLib.callMethodArgs(spawn, 'thing', ['test']);
    var spawn = 123;
    var spawn;
    spawn = 123;
    spawn = 123;
    yield hzUserLib.spawn(thing);
    yield hzUserLib.spawn(thing);
    yield hzUserLib.spawnArgs(thing, ['test']);
    yield hzUserLib.spawnMethod(obj, 'thing');
    yield hzUserLib.spawnMethodArgs(obj, 'thing', ['test']);
});