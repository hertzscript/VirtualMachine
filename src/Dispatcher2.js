const performance = require('perf_hooks').performance;
const GeneratorFunction = (function* () { }).constructor;
const Generator = GeneratorFunction.prototype.prototype;
const ArrayIterator = [][Symbol.iterator]().__proto__;
// Mimics regular execution by instantiating a Dispatcher
GeneratorFunction.prototype.callVirtual = function (...args) {
	const d = new Dispatcher();
	d.enqueue(functor, null, args);
	return d.runSync();
};
function isIterator(input) {
	return ((typeof input) === "object") && (input.next === Generator.next || input.next === ArrayIterator.next);
}
const symbols = {
	kernSym: Symbol("Kernelization Marker Symbol"),
	genSym: Symbol("Generator Symbol"),
	nullSym: Symbol("Null Value Symbol")
};
function isKernelized(input) {
	return ((typeof state.value) === "object") && (symbols.kernSym in state.value);
};
function Program(functor, thisArg = null, args = null) {
	this.type = "coroutine";
	this.image = functor;
	this.thisArg = thisArg;
	this.args = args;
	this.instance = null;
}
Program.prototype.init = function (thisArg = null, args = null) {
	return this.image.apply(thisArg, args);
};
Program.prototype.throw = function (error) {
	if (this.instance === null) return this.instance.throw(error);
};
Program.prototype.call = function (nextValue) {
	if (this.instance === null) {
		if (!(this.image instanceof GeneratorFunction)) return this.init(this.thisArg, this.args);
		const initState = this.init(this.thisArg, this.args);
		if (!isIterator(initState)) return initState;
		const initYield = initState.next(nextValue);
		if (initYield.done) return state.value;
		if (isKernelized(initYield.value)) this.instance = initState;
		if (initYield.value === symbols.genSym) return this.instance;
		return initYield;
	}
	return this.instance.next(nextValue);
};
function Dispatcher(quantum = 300000000) {
	this.quantum = quantum;
	// Set to "true" when the Dispatcher is running.
	this.running = false;
	// The virtual stack of Programs and Functions
	this.stack = [];
	// The last new return value seen by the Dispatcher
	this.lastReturn = null;
	// The last new Error seen by the Dispatcher
	this.lastError = null;
	this.metrics = {
		makeflight: 0,
		makespan: 0
	};
	// Initialize Kernelizer Flyweights
	const call = new Call();
	const callMethod = new CallMethod();
	const returnValue = new ReturnValue();
	const yieldValue = new YieldValue();
	// Expose Kernelizer Interfaces
	this.call = (...args) => call.set(...args);
	this.callMethod = (...args) => callMethod.set(...args);
	this.returnValue = (...args) => returnValue.set(...args);
	this.yieldValue = (...args) => returnValue.set(...args);
}
Dispatcher.prototype.symbols = symbols;
Dispatcher.prototype.isKernelized = isKernelized;
Dispatcher.prototype.enqueue = function (functor, thisArg, ...args) {
	this.stack.push(new Program(functor, thisArg, args));
};
Dispatcher.prototype.killLast = function () {
	if (this.stack.length > 0) {
		const program = this.stack.pop();
		if (program.instance !== null) program.instance.return();
	}
};
Dispatcher.prototype.killAll = function () {
	while (this.stack.length !== 0) this.killLast();
	this.running = false;
};
// Processes a kernelized instruction
Dispatcher.prototype.processState = function (kern) {
	// Interprets an instruction kernel and performs the indicated actions
	if (kern.type === "return") {
		this.killLast();
		this.lastReturn = kern.value;
	} else if (kern.type === "yield") {
		this.stack.pop();
		this.lastReturn = kern.value;
	} else if (kern.type === "call") {
		if (node.args.length === 0) node.args = null;
		this.enqueue(node.functor, node.thisArg, node.args);
	} else if (kern.type === "callMethod") {
		if (node.args.length === 0) node.args = null;
		this.enqueue(node.object[node.prop], node.object, node.args);
	} else {
		throw new TypeError("Illegal Instruction Kernel \"" + kern.type + "\"");
	}
};
// Runs a single execution cycle
Dispatcher.prototype.cycle = function (quantum = null) {
	if (quantum === null) quantum = this.quantum;
	const start = performance.now();
	cycle: while (performance.now() - start <= quantum) {
		if (!this.running || this.stack.length === 0) {
			// Dispatcher is not running or stack is empty, so abort
			this.running = false;
			return false;
		}
		// Advance arbitrary execution of the last Program in the virtual stack
		try {
			const program = this.stack[this.stack.length - 1];
			// Advances execution of the Program and saves the yielded state
			if (this.lastError !== null) {
				// Uncaught error was seen before, so throw it into the Program
				var state = program.throw(this.lastError);
				this.lastError = null;
			} else {
				// Return value was seen before, so invoke the Program with it
				var state = this.lastReturn !== null ? program.call(this.lastReturn) : program.call();
				this.lastReturn = null;
			}
			// Return the yielded state of the Program
			if (!isIterator(state)) state = this.returnValue(state);
			else if (!isKernelized(state.value)) state = this.returnValue(state.value);
			if ((state.type === "return" || state.type === "yield") && this.stack.length === 0) {
				this.lastReturn = state.value;
				return false;
			}
			// Collect resultant state and process any instructions
			this.processState(state);
		} catch (error) {
			// Uncaught error, so end the program
			this.killLast();
			this.lastError = error;
			if (this.stack.length === 0) {
				this.running = false;
				throw error;
			}
			return true;
		}
	}
	return true;
};
Dispatcher.prototype.runCompleteReturn = function () {
	this.runComplete();
	if (this.lastReturn !== null) return this.lastReturn;
};
Dispatcher.prototype.runComplete = function () {
	while (this.cycle());
};
Dispatcher.prototype.runSync = function (quantum = null) {
	return this.cycle(quantum);
};
Dispatcher.prototype.runAsync = function (interval = 300, quantum = null) {
	return new Promise(function (resolve, reject) {
		const asyncRunner = function () {
			if (!this.runSync(quantum)) return resolve();
			setTimeout(asyncRunner, interval);
		};
	});
};
Dispatcher.prototype.runIterator = function* (quantum = null) {
	if (quantum === null) quantum = this.quantum;
	this.running = true;
	while (this.runSync()) yield;
};
Dispatcher.prototype.stop = function () {
	this.running = false;
};
// Dispatcher API Kernelizers
// (Reusable flyweight classes mutated via set/clear prototype methods)
function Call() {
	this.type = "call";
	this.functor = null;
	this.thisArg = null;
	this.args = null;
}
Call.prototype.set = function (functor, thisArg, ...args) {
	this.functor = functor;
	this.thisArg = thisArg;
	this.args = args;
	return this;
};
Call.prototype.clear = function () {
	this.functor = null;
	this.thisArg = null;
	this.args = null;
};
function CallMethod() {
	this.type = "methodCall";
	this.object = null;
	this.prop = null;
	this.thisArg = null;
	this.args = null;
}
CallMethod.prototype.set = function (object, prop, ...args) {
	this.object = object;
	this.prop = prop;
	this.thisArg = object;
	this.args = args
	return this;
};
CallMethod.prototype.clear = function () {
	this.object = null;
	this.prop = null;
	this.thisArg = null;
	this.args = null;
};
function ReturnValue() {
	this.type = "return";
	this.value = null;
}
ReturnValue.prototype.set = function (value = Dispatcher.nullSym) {
	this.value = value;
	return this;
};
function YieldValue() {
	this.type = "yield",
		this.value = null;
}
YieldValue.prototype.set = function (value = Dispatcher.nullSym) {
	this.value = value;
	return this;
};
const flyweights = [
	Call,
	CallMethod,
	ReturnValue,
	YieldValue
];
for (const Flyweight of flyweights) Flyweight.prototype[Dispatcher.prototype.kernSym] = null;
module.exports = Dispatcher;