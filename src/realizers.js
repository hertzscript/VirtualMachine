//---------------------
// Original Source Code
// Function Declaration
function test(arg) {
	return arg() + 2;
}
// GeneratorFunction Expression
test.test2 = function* (arg) {
	yield test(arg);
};
// Assign Function Call
const number1 = test(2);
// Assign Method Call
const iter = test.test2(2);
const number2 = number1 + iter.next().value;
console.log(number2);


//---------------------
// Source Code After Re-Compile
// Main Wrapper GeneratorFunction
function* main(hzDisp) {
	"use strict";
	// Function Declaration
	function test(arg) {
		const d = new hzDisp.constructor();
		d.enqueue(_Vtest);
		return d.runComplete();
	}
	function* _Vtest(arg) {
		return hzDisp.returnValue((yield hzDisp.call(arg)) + 2);
	}
	// Assign GeneratorFunction Expression
	test.test2 = function* (arg) {
		yield hzDisp.symbols.genSym;
		yield hzDisp.yieldValue(hzDisp.call(test, null, arg));
	};
	// Assign Function Call
	const number1 = yield hzDisp.call(test, null, "2");
	// Assign Method Call
	const iter = hzDisp.callMethod(test, "test2", 2);
	const number2 = number1 + (yield hzDisp.callMethod(iter, "next")).value;
	hzDisp.callMethod(console, "log", number2);
}