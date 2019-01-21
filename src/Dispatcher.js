const performance = require('perf_hooks').performance;
const HzFunctor = require("./lib/HzFunctor.js");
const TokenLib = require("./lib/TokenLib.js");
const DetourLib = require("./lib/DetourLib.js");
const UserLib = require("./lib/UserLib.js");
const RunQueue = require("./lib/RunQueue.js");
const bufferConsole = false;
if (bufferConsole) require("console-buffer")(4096);
function Dispatcher(tokenLib = null, quantum = 300) {
	// Instruction Token Library
	if (tokenLib !== null) this.tokenLib = tokenLib;
	else this.tokenLib = new TokenLib();
	// Functor detour library
	this.detourLib = new DetourLib(Dispatcher, this.tokenLib);
	// Userland Library
	this.userLib = new UserLib(this.tokenLib, this.detourLib);
	// Default time-slice length per cycle()
	this.quantum = quantum;
	// Set to "true" when the Dispatcher is running
	this.running = false;
	// The ControlBlock queue
	this.queue = new RunQueue();
	this.curFunctor = null;
	this.lastError = undefined;
	this.lastReturn = undefined;
	this.metrics = {
		// Last Cycle time
		makeflight: 0,
		// Total running time
		makespan: 0
	};
}
// Returns true if a value is wrapped in a Kernelizer
Dispatcher.prototype.isKernelized = function (input) {
	return ((typeof input) === "object") && (this.tokenLib.symbols.kernSym in input);
};
// Add a hzFunctor to the active ControlBlock, or create a new ControlBlock for it
Dispatcher.prototype.enqueue = function (functor, thisArg = null, args = null, isTailCall = false) {
	if ((typeof functor) !== "function") throw new TypeError("Given value is not a function!");
	this.queue.enqueue(new HzFunctor(this.tokenLib, functor, thisArg, args, isTailCall));
};
// Add a hzFunctor to a new ControlBlock
Dispatcher.prototype.spawn = function (functor, thisArg = null, args = null) {
	if ((typeof functor) !== "function") throw new TypeError("Given value is not a function!");
	this.queue.spawn(new HzFunctor(this.tokenLib, functor, thisArg, args));
};
Dispatcher.prototype.import = function (hzModule) {
	this.spawn(hzModule(this.userLib));
};
Dispatcher.prototype.exec = function (functor, thisArg = null, args = null) {
	if (this.tokenLib.symbols.tokenSym in functor) this.spawn(functor, thisArgs, args);
	else this.import(functor);
	return this.runComplete();
};
// Pop and terminate a Functor from the stack
Dispatcher.prototype.killLast = function () {
	this.queue.killLast();
};
// Pop and terminate all Functors in the stack
Dispatcher.prototype.killAll = function () {
	this.queue.killAll();
};
// Processes a kernelized instruction
Dispatcher.prototype.processToken = function (token) {
	// Interprets an instruction token into stack operations
	if (token.type === "loopYield") return;
	if (token.type === "returnValue") {
		this.queue.killLast();
		this.queue.activeBlock.lastReturn = token.arg;
	} else if (token.type === "yieldValue") {
		this.queue.activeBlock.popFunctor();
		this.queue.activeBlock.lastReturn = token.arg;
	} else if (token.type === "return") {
		this.queue.killLast();
	} else if (token.type === "yield") {
		this.queue.activeBlock.popFunctor();
	} else if (token.type === "call") {
		if (token.isTailCall && this.curFunctor.isTailCall) this.queue.returnFromLast();
		this.enqueue(token.functor, null, null, token.isTailCall);
	} else if (token.type === "callArgs") {
		if (token.isTailCall && this.curFunctor.isTailCall) this.queue.returnFromLast();
		this.enqueue(token.functor, null, token.args, token.isTailCall);
	} else if (token.type === "callMethod") {
		if (token.isTailCall && this.curFunctor.isTailCall) this.queue.returnFromLast();
		this.enqueue(token.object[token.property], token.object, null, token.isTailCall);
	} else if (token.type === "callMethodArgs") {
		if (token.isTailCall && this.curFunctor.isTailCall) this.queue.returnFromLast();
		this.enqueue(token.object[token.property], token.object, token.args, token.isTailCall);
	} else if (token.type === "new") {
		token.functor[this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.functor, Object.create(token.functor.prototype));
	} else if (token.type === "newArgs") {
		token.functor[this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.functor, Object.create(token.functor.prototype), token.args);
	} else if (token.type === "newMethod") {
		token.object[token.property][this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.object[token.property], Object.create(token.object[token.property].prototype));
	} else if (token.type === "newMethodArgs") {
		token.object[token.property][this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.object[token.property], Object.create(token.object[token.property].prototype), token.args);
	} else if (token.type === "spawn") {
		this.spawn(token.functor);
	} else if (token.type === "spawnArgs") {
		this.spawn(token.functor, null, token.args);
	} else if (token.type === "spawnMethod") {
		this.spawn(token.object[token.property], token.object);
	} else if (token.type === "spawnMethodArgs") {
		this.spawn(token.object[token.property], token.object, token.args);
	} else {
		throw new TypeError("Illegal Instruction Kernel \"" + token.type + "\"");
	}
};
// Runs a single execution cycle
Dispatcher.prototype.cycle = function (quantum = null, throwUp = false) {
	const complete = quantum === false;
	if (quantum === null) quantum = this.quantum;
	const qEnd = performance.now() + quantum;
	cycle: while (complete || performance.now() < qEnd) {
		const cStart = performance.now();
		if (!this.running || this.queue.blocks.length === 0) {
			// Dispatcher is not running, or ControlBlock stack is empty, so abort
			this.stop();
			return this.lastReturn;
		}
		const block = this.queue.getNext();
		if (block === null) {
			this.stop();
			return this.lastReturn;
		}
		// Advance execution of the last Functor in the virtual stack
		try {
			const hzFunctor = block.getCurrent();
			this.curFunctor = hzFunctor;
			// Advances execution of the hzFunctor and saves the yielded state
			if (block.lastError !== null) {
				// Uncaught error was seen before, so throw it into the hzFunctor
				var state = hzFunctor.throwIntoFunctor(block.lastError);
				block.lastError = null;
			} else {
				// A value was returned or yielded before, so invoke the hzFunctor with it
				var state = block.lastReturn !== null ? hzFunctor.callFunctor(block.lastReturn) : hzFunctor.callFunctor();
				block.lastReturn = null;
			}
			// Return the yielded state of the hzFunctor
			if (hzFunctor.type === "iterator") hzFunctor.args = [];
			if (hzFunctor.type === "generator") {
				state = this.detourLib.hookIterator(state);
			} else if (hzFunctor.type === "unknown") {
				if ((typeof state) === "undefined") state = this.tokenLib.return;
				else state = this.tokenLib.returnValue.set([state]);
			} else if (hzFunctor.type !== "generator") {
				if (!(this.tokenLib.symbols.tokenSym in hzFunctor.image)) state = this.tokenLib.returnValue.set([state]);
				else if (!this.isKernelized(state.value)) {
					if ((typeof state.value) === "undefined") state = this.tokenLib.return;
					else state = this.tokenLib.returnValue.set([state.value]);
				} else {
					state = state.value;
				}
			}
			if (hzFunctor.type === "constructor") {
				if (state === this.tokenLib.return || (state === this.tokenLib.returnValue && (typeof state.arg) === "undefined")) {
					state = this.tokenLib.returnValue.set([hzFunctor.thisArg]);
				}
			}
			// Collect resultant state and process any instructions
			this.processToken(state);
			this.lastReturn = block.lastReturn;
		} catch (error) {
			// Uncaught error, so end the hzFunctor
			this.queue.killLast();
			block.lastError = error;
			this.lastError = error;
			if (block.stack.length === 0) {
				if (throwUp) {
					this.stop();
					throw error;
				} else {
					console.error(error);
				}
			}
		}
		// Update dispactcher metrics
		this.metrics.makeflight = performance.now() - cStart;
		this.metrics.makespan += this.metrics.makeflight;
		// Update ControlBlock metrics
		block.metrics.makeflight = this.metrics.makeflight;
		block.metrics.makespan += block.metrics.makeflight;
	}
	return this.lastReturn;
};
Dispatcher.prototype.runComplete = function (throwUp = false) {
	return this.runSync(false, throwUp);
};
Dispatcher.prototype.runSync = function (quantum = null, throwUp = false) {
	this.running = true;
	return this.cycle(quantum, throwUp);
	if (!this.running) return this.lastReturn;
};
Dispatcher.prototype.runAsync = function (interval = 30, quantum = null, throwUp = false) {
	if (this.running) return;
	return new Promise((resolve) => {
		const asyncRunner = () => {
			this.runSync(quantum, throwUp);
			if (!this.running) return resolve(this.lastReturn);
			setTimeout(asyncRunner, interval);
		};
		setTimeout(asyncRunner, interval);
	});
};
Dispatcher.prototype.stop = function () {
	this.queue.blockIndex = 0;
	this.queue.activeBlock = null;
	this.running = false;
};
module.exports = Dispatcher;