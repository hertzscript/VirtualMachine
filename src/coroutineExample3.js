// Original Program
function program() {
	function genNumber() {
		return Math.random().toFixed();
	}
	function* genNumberIterator() {
		while (true) yield genNumber();
	}
	function add(num1, num2) {
		return num1 + num2;
	}
	const numIterator = genNumberIterator();
	console.log(add(numIterator.next().value, numIterator.next().value));
}

function test() {
	// Recompiled Program
	/*
	function* program() {
		function* genNumber() {
			return d.returnValue(yield d.callSubroutineMethod((yield d.callSubroutineMethod(Math, "floor", 2048)) * (yield d.callSubroutineMethod(Math, "random")), "toFixed"));
		}
		function* genNumberIterator() {
			while (true) yield d.yieldValue(yield d.call(genNumber));
		}
		function* add(num1, num2) {
			return d.returnValue(num1 + num2);
		}
		const randIter = yield d.callSubroutine(genNumberIterator);
		console.log(yield d.callMethod(randIter, "next"));
		//console.log(yield d.call(add, null, (yield d.callSubroutineMethod(randIter, "next")).value, (yield d.callSubroutineMethod(randIter, "next")).value));
	}
	*/
	function* program() {
		function* gen() {
			yield hzDisp.symbols.genSym;
			while (true) yield hzDisp.yieldValue("test");
		}
		const iter = yield hzDisp.call(gen, null);
		console.log((yield hzDisp.callMethod(iter, "next")).value);
	}
	const Dispatcher = require("./Dispatcher2.js");
	const d = new Dispatcher();
	// Run the program
	d.enqueue(program, null);
	d.runSync();
}
test();