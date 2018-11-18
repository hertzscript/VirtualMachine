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
    var testSpawn = hzDisp.createCoroutine(function* testSpawn() {
        yield hzUserLib.callMethodArgs(console, 'log', ['Spawned!']);
    });
    var add = hzDisp.createCoroutine(function* add(num1, num2) {
        return hzUserLib.returnValue(num1 + num2);
    });
    var genNumberIterator = hzDisp.createGenerator(function* genNumberIterator() {
        while (true) yield hzUserLib.yieldValue({
            value: (yield hzUserLib.call(genNumber)),
            done: false
        });
    });
    var genNumber = hzDisp.createCoroutine(function* genNumber() {
        return hzUserLib.returnValue((yield hzUserLib.callMethodArgs((yield hzUserLib.callMethod((yield hzUserLib.callMethod(Math, 'random')), 'toString')), 'substring', [2])));
    });

    const numIterator = (yield hzUserLib.call(genNumberIterator));
    yield hzUserLib.callMethodArgs(console, 'log', ['Generating 10 random numbers...']);
    for (var loc = 0; loc < 10; loc++) yield hzUserLib.callMethodArgs(console, 'log', [(yield hzUserLib.callArgs(add, [(yield hzUserLib.callMethod(numIterator, 'next')).value, (yield hzUserLib.callMethod(numIterator, 'next')).value]))]);
});