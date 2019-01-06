const performance = require('perf_hooks').performance;
const HzFunctor = require("./HzFunctor.js");
const TokenLib = require("./lib/TokenLib.js");
const DetourLib = require("./lib/DetourLib.js");
const UserLib = require("./lib/UserLib.js");
const RunQueue = require("./lib/RunQueue.js");
const debug = false;
if (debug) require("console-buffer")(4096);
function debugLog(str) {
	if (debug) console.log(str);
}
function debugTable(obj) {
	if (debug) console.table(obj);
}
function debugError(error) {
	if (debug) console.error(error);
}
function Dispatcher(tokenLib = null, quantum = 300000000) {
	// Instruction Token Library
	if (tokenLib !== null) {
		this.tokenLib = tokenLib;
	} else {
		this.tokenLib = new TokenLib();
	}
	// Functor detour library
	this.detourLib = new DetourLib(Dispatcher, this.tokenLib, debugLog);
	// Userland Library
	this.userLib = new UserLib(this.tokenLib, this.detourLib);
	// Default time-slice length per cycle()
	this.quantum = quantum;
	// Set to "true" when the Dispatcher is running
	this.running = false;
	// The ControlBlock queue
	this.queue = new RunQueue();
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
Dispatcher.prototype.enqueue = function (functor, thisArg = null, args = null) {
	debugLog("Enqueuing Functor:");
	debugLog(functor);
	debugLog(Object.keys(functor).join());
	this.queue.enqueue(new HzFunctor(debugLog, this.tokenLib, functor, thisArg, args));
};
// Add a hzFunctor to a new ControlBlock
Dispatcher.prototype.spawn = function (functor, thisArg = null, args = null) {
	if ((typeof functor) !== "function") throw new TypeError("Given value is not a function!");
	debugLog("Spawning Functor in new ControlBlock:");
	debugLog(functor);
	debugLog(Object.keys(functor).join());
	this.queue.spawn(new HzFunctor(debugLog, this.tokenLib, functor, thisArg, args));
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
	debugLog("Killing last Functor in the ControlBlock");
	this.queue.killLast();
};
// Pop and terminate all Functors in the stack
Dispatcher.prototype.killAll = function () {
	debugLog("Killing all Functors in the ControlBlock");
	this.queue.killAll();
};
// Processes a kernelized instruction
Dispatcher.prototype.processState = function (token) {
	debugLog("Processing Token \"" + token.type + "\"");
	debugLog(token);
	// Interprets an instruction token into stack operations
	if (token.type === "loopYield") return;
	if (token.type === "returnValue") {
		this.queue.killLast();
		this.queue.activeBlock.lastReturn = token.arg;
	} else if (token.type === "yieldValue") {
		this.queue.activeBlock.stack.pop();
		this.queue.activeBlock.lastReturn = token.arg;
	} else if (token.type === "return") this.queue.killLast();
	else if (token.type === "yield") this.queue.activeBlock.stack.pop();
	else if (token.type === "call") this.enqueue(token.functor);
	else if (token.type === "callArgs") this.enqueue(token.functor, null, token.args);
	else if (token.type === "callMethod") this.enqueue(token.object[token.property], token.object, null);
	else if (token.type === "callMethodArgs") this.enqueue(token.object[token.property], token.object, token.args);
	else if (token.type === "new") {
		token.functor[this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.functor, Object.create(token.functor.prototype));
	} else if (token.type === "newArgs") {
		token.functor[this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.functor, Object.create(token.functor.prototype), token.args);
	} else if (token.type === "newMethod") {
		debugLog(token);
		token.object[token.property][this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.object[token.property], Object.create(token.object[token.property].prototype));
	} else if (token.type === "newMethodArgs") {
		token.object[token.property][this.tokenLib.symbols.conSym] = true;
		this.enqueue(token.object[token.property], Object.create(token.object[token.property].prototype), token.args);
	} else if (token.type === "spawn") this.spawn(token.functor);
	else if (token.type === "spawnArgs") this.spawn(token.functor, null, token.args);
	else if (token.type === "spawnMethod") this.spawn(token.object[token.property], token.object);
	else if (token.type === "spawnMethodArgs") this.spawn(token.object[token.property], token.object, token.args);
	else throw new TypeError("Illegal Instruction Kernel \"" + token.type + "\"");
};
// Runs a single execution cycle
Dispatcher.prototype.cycle = function (quantum = null, throwUp = false) {
	debugLog("Cycle Invoked");
	const complete = quantum === false;
	if (complete) debugLog("Starting Dispatcher in run-to-completion mode...");
	if (quantum === null) quantum = this.quantum;
	const qEnd = performance.now() + quantum;
	cycle: while (complete || performance.now() < qEnd) {
		const cStart = performance.now();
		debugLog("Cycling Dispatcher...");
		debugLog("Current Metrics:");
		debugLog(this.metrics);
		if (!this.running || this.queue.blocks.length === 0) {
			!this.running ? debugLog("Stopping Dispatcher because the Stop signal was received...\n")
				: debugLog("Stopping Dispatcher because all ControlBlock Stacks are empty...\n");
			// Dispatcher is not running, or ControlBlock stack is empty, so abort
			this.stop();
			return;
		}
		const block = this.queue.getNext();
		if (block === null) {
			this.stop();
			return;
		}
		debugLog("\n\x1b[32mControlBlock " + this.queue.blockIndex + " loaded\x1b[0m");
		debugLog("Stack Snapshot:");
		debugTable(block.stack);
		// Advance execution of the last Functor in the virtual stack
		try {
			const hzFunctor = block.stack[block.stack.length - 1];
			debugLog("Dispatching hzFunctor:");
			hzFunctor.log();
			if (block.lastReturn !== null) (debugLog("With value:"), debugLog(block.lastReturn));
			// Advances execution of the hzFunctor and saves the yielded state
			if (block.lastError !== null) {
				debugLog("Throwing Error into hzFunctor...");
				// Uncaught error was seen before, so throw it into the hzFunctor
				var state = hzFunctor.throwIntoFunctor(block.lastError);
				block.lastError = null;
			} else {
				// A value was returned or yielded before, so invoke the hzFunctor with it
				var state = block.lastReturn !== null ? hzFunctor.callFunctor(block.lastReturn) : hzFunctor.callFunctor();
				block.lastReturn = null;
			}
			// Return the yielded state of the hzFunctor
			debugLog("hzFunctor yielded State:");
			debugLog(state);
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
			this.processState(state);
		} catch (error) {
			debugLog("Uncaught Error was thrown! Terminating end of stack...");
			debugError(error);
			// Uncaught error, so end the hzFunctor
			this.queue.killLast();
			block.lastError = error;
			if (block.stack.length === 0) {
				if (throwUp) {
					debugLog("Stopping Dispatcher due to an uncaught error...\n");
					this.stop();
					throw error;
				} else {
					debugLog("Killing current ControlBlock due to an uncaught error...\n");
					console.error(error);
				}
			}
		}
		// Update dispactcher metrics
		this.metrics.makeflight = performance.now() - cStart;
		this.metrics.makespan += this.metrics.makeflight;
		// Update ControlBlock metrics
		block.metrics.makeflight = performance.now() - cStart;
		block.metrics.makespan += block.metrics.makeflight;
	}
};
Dispatcher.prototype.runComplete = function (throwUp = false) {
	return this.runSync(false, throwUp);
};
Dispatcher.prototype.runSync = function (quantum = null, throwUp = false) {
	debugLog("Beginning synchronous execution...");
	this.running = true;
	return this.cycle(quantum, throwUp);
	if (!this.running) return this.lastReturn;
};
Dispatcher.prototype.runAsync = function (interval = 300, quantum = null, throwUp = false) {
	if (this.running) return;
	debugLog("Beginning asynchronous execution...");
	return new Promise((resolve) => {
		const asyncRunner = () => {
			this.runSync(quantum, throwUp);
			if (!this.running) return resolve(this.lastReturn);
			setTimeout(asyncRunner, interval);
		};
		setTimeout(asyncRunner, interval);
	});
};
Dispatcher.prototype.runIterator = function* (quantum = null, throwUp = false) {
	while (this.running) yield this.runSync(quantum, throwUp);
};
Dispatcher.prototype.stop = function () {
	this.queue.blockIndex = 0;
	this.queue.activeBlock = null;
	this.running = false;
};
module.exports = Dispatcher;