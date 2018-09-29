// Original Program
function* program() {
	function* genNumber() {
		return hzDisp.returnValue((yield hzDisp.callMethod((yield hzDisp.callMethod(Math, "random")), "toFixed")));
	}
	function* genNumberIterator() {
		while (true) yield hzDisp.yieldValue((yield hzDisp.call(genNumber)));
	}
	function* add(num1, num2) {
		return hzDisp.returnValue(num1 + num2);
	}
	const numIterator = (yield hzDisp.call(genNumberIterator));
	yield hzDisp.callMethodArgs(console, "log", [(yield hzDisp.callArgs(add, [(yield hzDisp.callMethod(numIterator, "next")).value, (yield hzDisp.callMethod(numIterator, "next")).value]))]);
}