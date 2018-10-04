const TokenLib = require("./TokenLib.js");
const performance = require('perf_hooks').performance;
const GeneratorFunction = (function* () { }).constructor;
const Generator = GeneratorFunction.prototype.prototype;
const ArrayIterator = [][Symbol.iterator]().__proto__;
const tokens = new TokenLib();
function isIterator(input) {
	return ((typeof input) === "object")
		&& ("next" in input)
		&& (input.next === Generator.next || input.next === ArrayIterator.next);
}
function isKernelized(input) {
	return ((typeof state.value) === "object") && (symbols.kernSym in state.value);
};
function Program(functor, thisArg = null, args = null) {
	this.type = "unknown";
	this.image = functor;
	if (symbols.genSym in functor) this.type = "generator";
	else if (symbols.crtSym in functor) this.type = "coroutine";
	this.thisArg = thisArg;
	this.args = args;
	this.instance = null;
}
Program.prototype.init = function (thisArg = null, args = null) {
	if (thisArg === null) {
		if (args === null) {
			var initState = this.image();
		} else {
			var initState = this.image(...args);
		}
	} else {
		if (args === null) {
			var initState = this.image.call(thisArg);
		} else {
			var initState = this.image.apply(thisArg, args);
		}
	}
	if (!isIterator(initState)) return initState;
	if (nextValue === symbols.nullSym) {
		var initYield = this.instance.next();
	} else {
		var initYield = this.instance.next(nextValue);
	}
	if (initYield.value === symbols.genSym) {
		this.type = "generator";
		this.image[symbols.genSym] = null;
		return this.instance;
	}
	if (initYield.value === symbols.crtSym) {
		this.type = "coroutine";
		this.image[symbols.crtSym] = null;
		this.instance = initState;
	}
	return initYield.value;
};
Program.prototype.throw = function (error) {
	if (this.instance !== null) return this.instance.throw(error);
};
Program.prototype.call = function (nextValue = symbols.nullSym) {
	if (this.instance === null) {
		const initState = this.init(this.thisArg, this.args);
	}
	if (nextValue === symbols.nullSym) {
		return this.instance.next();
	} else {
		return this.instance.next(nextValue);
	}
};
function Dispatcher(tokenLib, quantum = 300000000) {
	// Instruction Token Library
	this.tokenLib = tokenLib;
	// Default time-slice length per cycle()
	this.quantum = quantum;
	// Set to "true" when the Dispatcher is running
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
	for (const tokenName in tokens) this[tokenName] = argsArray => tokens[tokenName].set(argsArray);
}
Dispatcher.prototype.symbols = symbols;
Dispatcher.prototype.isKernelized = isKernelized;
Dispatcher.prototype.subroutineAdapter = function (tokenStream, thisArg, argsArray) {
	const d = new Dispatcher();
	d.enqueue(tokenStream, thisArg, argsArray);
	return d.runSync();
};
Dispatcher.prototype.createCoroutine = function (functor) {
	functor[symbols.tokenSym] = functor;
	functor[symbols.crtSym] = true;
	return function* (...argsArray) {
		return hzDisp.subrouitneAdapter(functor[symbols.tokenSym], argsArray);
	};
};
Dispatcher.prototype.createGenerator = function (functor) {
	functor[symbols.tokenSym] = functor;
	functor[symbols.genSym] = true;
	const hzDisp = this;
	return function (...args) {
		return hzDisp.subrouitneAdapter(functor[symbols.tokenSym], this, argsArray);
	};
};
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
	this.stop();
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
	const complete = quantum === false;
	if (!complete && quantum === null) quantum = this.quantum;
	const start = performance.now();
	cycle: while (complete || performance.now() - start <= quantum) {
		if (!this.running || this.stack.length === 0) {
			// Dispatcher is not running or stack is empty, so abort
			this.stop();
			return;
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
				return this.lastReturn;
			}
			// Collect resultant state and process any instructions
			this.processState(state);
		} catch (error) {
			// Uncaught error, so end the program
			this.killLast();
			this.lastError = error;
			if (this.stack.length === 0) {
				this.stop();
				throw error;
			}
		}
	}
};
Dispatcher.prototype.runComplete = function () {
	return this.cycle(false);
};
Dispatcher.prototype.runSync = function (quantum = null) {
	while (this.running) this.cycle(quantum);
	return this.lastReturn;
};
Dispatcher.prototype.runAsync = function (interval = 300, quantum = null) {
	return new Promise(function (resolve, reject) {
		const asyncRunner = function () {
			this.runSync(quantum);
			if (!this.running) return resolve(this.lastReturn);
			setTimeout(asyncRunner, interval);
		};
	});
};
Dispatcher.prototype.runIterator = function* (quantum = null) {
	while (this.runSync()) yield;
};
Dispatcher.prototype.stop = function () {
	this.running = false;
};
module.exports = Dispatcher;