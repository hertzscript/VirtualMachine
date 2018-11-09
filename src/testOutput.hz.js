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
    var testSpawn = hzDisp.createCoroutine(function* testSpawn() {
        yield hzUserLib.callMethodArgs(console, 'log', ['Spawned!']);
    });
    var add = hzDisp.createCoroutine(function* add(num1, num2) {
        return hzUserLib.returnValue(num1 + num2);
    });
    var genNumberIterator = hzDisp.createGenerator(function* genNumberIterator() {
        while (true) yield hzUserLib.yieldValue((yield hzUserLib.call(genNumber)));
    });
    var genNumber = hzDisp.createCoroutine(function* genNumber() {
        return hzUserLib.returnValue((yield hzUserLib.callMethod((yield hzUserLib.callMethod(Math, 'random')), 'toFixed')));
    });

    const numIterator = (yield hzUserLib.call(genNumberIterator));
    yield hzUserLib.callMethodArgs(console, 'log', [(yield hzUserLib.callArgs(add, [(yield hzUserLib.callMethod(numIterator, 'next')).value, (yield hzUserLib.callMethod(numIterator, 'next')).value]))]);

    yield hzUserLib.spawn(testSpawn);
});