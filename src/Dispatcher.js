const performance = require('perf_hooks').performance;
const HzFunctor = require("./lib/HzFunctor.js");
const TokenLib = require("./lib/TokenLib.js");
const DetourLib = require("./lib/DetourLib.js");
const UserLib = require("./lib/UserLib.js");
const RunQueue = require("./lib/RunQueue.js");
function Dispatcher(tokenLib = null, cQuantum = 300, tQuantum = 0) {
	// Instruction Token Library
	if (tokenLib !== null) this.tokenLib = tokenLib;
	else this.tokenLib = new TokenLib();
	// Functor detour library
	this.detourLib = new DetourLib(Dispatcher, this.tokenLib);
	// Userland Library
	this.userLib = new UserLib(this.tokenLib, this.detourLib);
	// Default cycle time-slice length
	this.cQuantum = cQuantum;
	// Set to "true" when the Dispatcher is running
	this.running = false;
	// The ControlBlock queue
	this.queue = new RunQueue(this.tokenLib, tQuantum);
	this.lastError = this.tokenLib.symbols.nullSym;
	this.lastReturn = this.tokenLib.symbols.nullSym;
	this.metrics = {
		// Last Cycle time
		makeflight: 0,
		// Total running time
		makespan: 0
	};
}
// Set the time slice quantum of the RunQueue
Dispatcher.prototype.threadQuantum = function (tQuantum) {
	this.queue.quantum = tQuantum;
};
// Set the time slice quantum of the Dispatcher cycle
Dispatcher.prototype.cycleQuantum = function (cQuantum) {
	this.cQuantum = cQuantum;
};
// Add a hzFunctor to the active ControlBlock, or create a new ControlBlock for it
Dispatcher.prototype.enqueue = function (functor, thisArg = null, args = null, isTailCall = false) {
	if ((typeof functor) !== "function") throw new TypeError("Given value is not a function!");
	this.queue.enqueue(new HzFunctor(this.tokenLib.symbols, functor, thisArg, args, isTailCall));
};
// Add a hzFunctor to a new ControlBlock
Dispatcher.prototype.spawn = function (functor, thisArg = null, args = null) {
	if ((typeof functor) !== "function") throw new TypeError("Given value is not a function!");
	this.queue.spawn(new HzFunctor(this.tokenLib.symbols, functor, thisArg, args));
};
// Imports an HzModule
Dispatcher.prototype.import = function (hzModule) {
	this.spawn(hzModule(this.userLib));
};
// Imports an HzFunctor or HzModule and executes it in run-to-completion mode
Dispatcher.prototype.exec = function (functor, thisArg = null, args = null, throwUp = false) {
	if (this.tokenLib.symbols.tokenSym in functor) this.spawn(functor, thisArgs, args);
	else this.import(functor);
	return this.runComplete(throwUp);
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
Dispatcher.prototype.processToken = function (tokenLib, queue, block, hzFunctor, token) {
	// Loop interruptor
	if (token === tokenLib.tokens.loopYield) return;
	if (token === tokenLib.tokens.returnValue) {
		// Return with argument
		queue.killLast();
		block.lastReturn = token.arg;
	} else if (token === tokenLib.tokens.yieldValue) {
		// Yield with argument
		block.popFunctor();
		block.lastReturn = token.arg;
	} else if (token === tokenLib.tokens.return) {
		// Return without argument
		queue.killLast();
		block.lastReturn = undefined;
	} else if (token === tokenLib.tokens.yield) {
		// Yield without argument
		block.popFunctor();
		block.lastReturn = token.arg;
	} else if (token === tokenLib.tokens.call) {
		// Function call without arguments
		if (token.isTailCall && hzFunctor.isTailCall) block.killLast();
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, null, null, token.isTailCall));
	} else if (token === tokenLib.tokens.callArgs) {
		// Function call with arguments
		if (token.isTailCall && hzFunctor.isTailCall) block.killLast();
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, null, token.args, token.isTailCall));
	} else if (token === tokenLib.tokens.callMethod) {
		// Method call without arguments
		if (token.isTailCall && hzFunctor.isTailCall) block.killLast();
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object, null, token.isTailCall));
	} else if (token === tokenLib.tokens.callMethodArgs) {
		// Method call with arguments
		if (token.isTailCall && hzFunctor.isTailCall) block.killLast();
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object, token.args, token.isTailCall));
	} else if (token === tokenLib.tokens.new) {
		// NewExpression without arguments
		token.functor[tokenLib.symbols.conSym] = true;
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, Object.create(token.functor.prototype)));
	} else if (token === tokenLib.tokens.newArgs) {
		// NewExpression with arguments
		token.functor[tokenLib.symbols.conSym] = true;
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, Object.create(token.functor.prototype), token.args));
	} else if (token === tokenLib.tokens.newMethod) {
		// NewExpression from method without arguments
		token.object[token.property][tokenLib.symbols.conSym] = true;
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], Object.create(token.object[token.property].prototype)));
	} else if (token === tokenLib.tokens.newMethodArgs) {
		// NewExpression from method with arguments
		token.object[token.property][tokenLib.symbols.conSym] = true;
		queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], Object.create(token.object[token.property].prototype), token.args));
	} else if (token === tokenLib.tokens.spawn) {
		// SpawnExpression without arguments
		queue.spawn(new HzFunctor(tokenLib.symbols, token.functor));
	} else if (token === tokenLib.tokens.spawnArgs) {
		// SpawnExpression with arguments
		queue.spawn(new HzFunctor(tokenLib.symbols, token.functor, null, token.args));
	} else if (token === tokenLib.tokens.spawnMethod) {
		// SpawnExpression from method without arguments
		queue.spawn(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object));
	} else if (token === tokenLib.tokens.spawnMethodArgs) {
		// SpawnExpression from method with arguments
		queue.spawn(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object, token.args));
	} else {
		throw new TypeError("Illegal Instruction Kernel \"" + token.type + "\"");
	}
};
Dispatcher.processToken = Dispatcher.prototype.processToken;
// Prepare the yielded state of an hzFunctor for processState
Dispatcher.prototype.coerceState = function (tokenLib, detourLib, hzFunctor, state) {
	if (hzFunctor.type === "iterator") hzFunctor.args = [];
	if (hzFunctor.type === "generator") {
		// Detour an iterator
		state = detourLib.hookIterator(state);
	} else if (hzFunctor.type === "unknown") {
		// State is not an Hztoken, so wrap it in one
		if ((typeof state) === "undefined") state = tokenLib.tokens.return;
		else state = tokenLib.tokens.returnValue.set([state]);
	} else {
		if (!(tokenLib.symbols.tokenSym in hzFunctor.image)) {
			// State is not an HzToken, so wrap it in one
			state = tokenLib.tokens.returnValue.set([state]);
		} else if (!tokenLib.isKernelized(state.value)) {
			// State is not an HzToken, so wrap it in one
			if ((typeof state.value) === "undefined") state = tokenLib.tokens.return;
			else state = tokenLib.tokens.returnValue.set([state.value]);
		} else {
			// State is an HzToken, so unwrap it
			state = state.value;
		}
	}
	if (hzFunctor.type === "constructor" && (
		state === tokenLib.tokens.return
		|| (state === tokenLib.tokens.returnValue && (typeof state.arg) === "undefined")
	)) {
		// State is from a constructor, so wrap it in an HzToken
		state = tokenLib.tokens.returnValue.set([hzFunctor.thisArg]);
	}
	// Return the HzToken
	return state;
};
Dispatcher.coerceState = Dispatcher.prototype.coerceState;
Dispatcher.prototype.dispatch = function (tokenLib, detourLib, queue, block, throwUp) {
	const hzFunctor = block.getCurrent();
	try {
		// Advances execution of the hzFunctor and saves the yielded state
		if (block.lastError !== tokenLib.symbols.nullSym) {
			// Uncaught error was seen before, so throw it into the hzFunctor
			var state = hzFunctor.throwIntoFunctor(block.lastError);
			block.lastError = tokenLib.symbols.nullSym;
		} else {
			// A value was returned or yielded before, so invoke the hzFunctor with it
			var state = block.lastReturn !== tokenLib.symbols.nullSym ? hzFunctor.callFunctor(block.lastReturn) : hzFunctor.callFunctor();
			block.lastReturn = tokenLib.symbols.nullSym;
		}
		// Prepare the yielded state for processing.
		// Will wrap naked values in an HzToken.
		state = Dispatcher.coerceState(tokenLib, detourLib, hzFunctor, state);
		if (state === tokenLib.tokens.remit || state === tokenLib.tokens.remitValue) {
			return state;
		}
		// Process the HzToken
		Dispatcher.processToken(tokenLib, queue, block, hzFunctor, state);
	} catch (error) {
		// Uncaught error, so terminate the hzFunctor
		console.error(error);
		queue.killLast();
		block.lastError = error;
		if (block.stack.length === 0 && throwUp) if (throwUp) throw error;
	}
};
Dispatcher.dispatch = Dispatcher.prototype.dispatch;
// Runs a single execution cycle
Dispatcher.prototype.cycle = function (cQuantum = null, throwUp = false) {
	const complete = cQuantum === false;
	if (cQuantum === null) cQuantum = this.cQuantum;
	const cEnd = performance.now() + cQuantum;
	cycle: while (complete || performance.now() < cEnd) {
		const cStart = performance.now();
		if (!this.running || this.queue.blocks.length === 0) {
			// Dispatcher is not running or there are no ControlBlocks
			this.stop();
			return this.lastReturn;
		}
		// Get the next runnable ControlBlock
		const block = this.queue.getNext();
		if (block === null) {
			// No runnable ControlBlocks
			this.stop();
			return this.lastReturn;
		}
		try {
			// Advance execution of the last Functor in the virtual stack
			var state = Dispatcher.dispatch(this.tokenLib, this.detourLib, this.queue, block, throwUp);
			this.lastReturn = block.lastReturn;
		} catch (error) {
			// Uncaught error
			this.lastError = error;
			if (throwUp) {
				this.stop();
				throw error;
			}
		}
		// Update dispactcher metrics
		this.metrics.makeflight = performance.now() - cStart;
		this.metrics.makespan += this.metrics.makeflight;
		// Update ControlBlock metrics
		block.metrics.makeflight = this.metrics.makeflight;
		block.metrics.makespan += block.metrics.makeflight;
		if (state === this.tokenLib.tokens.remit || state === this.tokenLib.tokens.remitValue) {
			// Remit HzToken seen, so stop the cycle and return it
			this.stop();
			return state;
		}
	}
	return this.lastReturn;
};
// Synchronous mode, runs for the duration of the quantum in milliseconds
Dispatcher.prototype.runSync = function (cQuantum = null, throwUp = false) {
	this.running = true;
	return this.cycle(cQuantum, throwUp);
};
// Run-to-completion mode, runs runSync continuously until all programs have exited
Dispatcher.prototype.runComplete = function (throwUp = false) {
	return this.runSync(false, throwUp);
};
// Asynchronous mode, runs runSync on an interval in the asynchrnous event loop
Dispatcher.prototype.runAsync = function (interval = 30, cQuantum = null, throwUp = false) {
	if (this.running) return;
	return new Promise((resolve) => {
		const asyncRunner = () => {
			const state = this.runSync(cQuantum, throwUp);
			if (!this.running) return resolve(state);
			setTimeout(asyncRunner, interval);
		};
		setTimeout(asyncRunner, interval);
	});
};
// Stops execution
Dispatcher.prototype.stop = function () {
	this.queue.blockIndex = 0;
	this.queue.activeBlock = null;
	this.running = false;
};
module.exports = Dispatcher;