const performance = require('perf_hooks').performance;
const Program = require("./Program.js");
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
	for (const tokenName in tokenLib) this[tokenName] = argsArray => tokens[tokenName].set(argsArray);
}
Dispatcher.prototype.isKernelized = function (input) {
	return ((typeof input) === "object") && (this.tokenLib.symbols.kernSym in input);
};
Dispatcher.prototype.createCallAdapter = function (functor) {
	const tokenLib = this.tokenLib;
	functor[tokenLib.symbols.tokenSym] = functor;
	return function (...argsArray) {
		const d = new Dispatcher(tokenLib);
		d.enqueue(functor[tokenLib.symbols.tokenSym], this, argsArray);
		return d.runSync();
	};
}
Dispatcher.prototype.createSubroutine = function (functor) {
	const hzDisp = this;
	const subroutine = this.createCallAdapter(functor);
	subroutine[this.tokenLib.symbols.subSym] = true;
	return subroutine;
};
Dispatcher.prototype.createGenerator = function (functor) {
	const hzDisp = this;
	const generator = this.createCallAdapter(functor);
	generator[this.tokenLib.symbols.genSym] = true;
	return generator;
};
Dispatcher.prototype.createCoroutine = function (functor) {
	const hzDisp = this;
	const coroutine = this.createCallAdapter(functor);
	coroutine[hzDisp.tokenLib.symbols.tokenSym] = functor;
	coroutine[this.tokenLib.symbols.crtSym] = true;
	return coroutine;
};
Dispatcher.prototype.enqueue = function (functor, thisArg, ...args) {
	const program = new Program(functor, thisArg, args)
	if (this.tokenLib.symbols.subSym in functor) program.type = "subroutine";
	else if (this.tokenLib.symbols.genSym in functor) program.type = "generator";
	else if (this.tokenLib.symbols.crtSym in functor) program.type = "coroutine";
	this.stack.push(program);
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
Dispatcher.prototype.processState = function (token) {
	// Interprets an instruction kernel and performs the indicated actions
	if (token.type === "return") {
		if (this.stack.length > 0) this.stack.pop().return();
		this.lastReturn = token.value;
	} else if (token.type === "yield") {
		this.stack.pop();
		this.lastReturn = token.value;
	} else if (token.type === "call") {
		if (node.args.length === 0) node.args = null;
		this.enqueue(node.functor, node.thisArg, node.args);
	} else if (token.type === "callMethod") {
		if (node.args.length === 0) node.args = null;
		this.enqueue(node.object[node.prop], node.object, node.args);
	} else {
		throw new TypeError("Illegal Instruction Kernel \"" + token.type + "\"");
	}
};
// Runs a single execution cycle
Dispatcher.prototype.cycle = function (quantum = null) {
	console.log("Cycling...");
	console.log("Current Stack:");
	console.log(this.stack);
	const complete = quantum === false;
	if (quantum === null) quantum = this.quantum;
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
			if (program.type === "unknown" || !this.isKernelized(state.value)) state = this.tokenLib.returnValue(state.value);
			if ((state.type === "return" || state.type === "yield") && this.stack.length === 0) {
				this.lastReturn = state.value;
				return this.lastReturn;
			}
			// Collect resultant state and process any instructions
			this.processState(state);
		} catch (error) {
			console.error(error);
			// Uncaught error, so end the program
			this.killLast();
			this.lastError = error;
			if (this.stack.length === 0) {
				this.stop();
				throw error;
			}
		}
		// Update metrics
		this.metrics.makeflight = performance.now() - start;
		this.metrics.makespan += this.metrics.makeflight;
	}
};
Dispatcher.prototype.runComplete = function () {
	return this.cycle(false);
};
Dispatcher.prototype.runSync = function (quantum = null) {
	console.log("Beginning Synchronous Execution...");
	this.running = true;
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