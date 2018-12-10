var global = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
if (!("hzTknLib" in global)) {
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
    var sleepAndSay = hzDisp.createCoroutine(function* sleepAndSay(message, ms) {
        yield hzUserLib.callArgs(sleep, [ms]);
        yield hzUserLib.callMethodArgs(console, 'log', [message]);
    });
    var sleep = hzDisp.createCoroutine(function* sleep(ms) {
        const end = (yield hzUserLib.callMethod(performance, 'now')) + ms;
        yield hzUserLib.callMethodArgs(console, 'log', ['Beginning to sleep for ' + ms + 'ms']);
        while ((yield hzUserLib.callMethod(performance, 'now')) < end);
    });

    const performance = (yield hzUserLib.callArgs(require, ['perf_hooks'])).performance;

    yield hzUserLib.spawnArgs(sleepAndSay, ['Hello World 1000ms', 5000]);
    yield hzUserLib.spawnArgs(sleepAndSay, ['Hello World 500ms', 500]);
});