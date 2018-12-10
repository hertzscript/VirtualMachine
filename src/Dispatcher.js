const performance = require('perf_hooks').performance;
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
// A type of low level Thread Control Block
function ControlBlock() {
	// A virtual stack of Programs and Functions
	this.stack = [];
	// The last new return value seen by the Dispatcher
	this.lastReturn = null;
	// The last new Error seen by the Dispatcher
	this.lastError = null;
	// Pauses a stack's execution
	this.waiting = false;
	this.metrics = {
		makeflight: 0,
		makespan: 0
	};
}
// Process Control Block
// Wraps a Function or GeneratorFunction, and stores metadata about it
function Program(functor, thisArg = null, args = []) {
	this.type = "unknown";
	this.image = functor;
	this.thisArg = thisArg;
	this.args = args;
	this.instance = null
}
function Dispatcher(tokenLib, quantum = 300000000) {
	// Instruction Token Library
	this.tokenLib = tokenLib;
	// Default time-slice length per cycle()
	this.quantum = quantum;
	// Set to "true" when the Dispatcher is running
	this.running = false;
	// The ControlBlock stack
	this.blocks = [];
	// The current active ControlBlock
	this.activeBlock = null;
	// The current active ControlBlock index
	this.blockIndex = 0;
	this.metrics = {
		makeflight: 0,
		makespan: 0
	};
}
// Returns true if a value is wrapped in a Kernelizer
Dispatcher.prototype.isKernelized = function (input) {
	return ((typeof input) === "object") && (this.tokenLib.symbols.kernSym in input);
};
// Dynamic call site interception
Dispatcher.prototype.createCallAdapter = function (functor) {
	debugLog("Creating call adapter for:");
	debugLog(functor);
	const tokenLib = this.tokenLib;
	const hzFunctor = function (...argsArray) {
		const d = new Dispatcher(tokenLib);
		debugLog("\nhzFunctor has been invoked, initializing new Dispatcher:");
		debugLog(hzFunctor);
		d.enqueue(hzFunctor[tokenLib.symbols.tokenSym], this, argsArray);
		return d.runComplete();
	};
	hzFunctor[tokenLib.symbols.tokenSym] = functor;
	return hzFunctor;
}
Dispatcher.prototype.createSubroutine = function (functor) {
	const subroutine = this.createCallAdapter(functor);
	functor[this.tokenLib.symbols.subSym] = true;
	subroutine[this.tokenLib.symbols.subSym] = true;
	return subroutine;
};
Dispatcher.prototype.createGenerator = function (functor) {
	const generator = this.createCallAdapter(functor);
	functor[this.tokenLib.symbols.genSym] = true;
	generator[this.tokenLib.symbols.genSym] = true;
	return generator;
};
Dispatcher.prototype.createIterator = function (iterator) {
	iterator.next = this.createCallAdapter(iterator.next);
	iterator.throw = this.createCallAdapter(iterator.throw);
	iterator.return = this.createCallAdapter(iterator.return);
	iterator.next[this.tokenLib.symbols.iterSym] = true;
	iterator.throw[this.tokenLib.symbols.iterSym] = true;
	iterator.return[this.tokenLib.symbols.iterSym] = true;
	iterator[this.tokenLib.symbols.iterSym] = true;
	return this.tokenLib.yieldValue.set([iterator]);
};
Dispatcher.prototype.createCoroutine = function (functor) {
	const coroutine = this.createCallAdapter(functor);
	functor[this.tokenLib.symbols.crtSym] = true;
	coroutine[this.tokenLib.symbols.crtSym] = true;
	return coroutine;
};
Dispatcher.prototype.createArrowCoroutine = function (functor, thisArg) {
	const coroutine = this.createCoroutine(functor);
	coroutine[this.tokenLib.symbols.tokenSym] = coroutine[this.tokenLib.symbols.tokenSym].bind(thisArg);
	return coroutine;
};
Dispatcher.prototype.printProgram = function (program) {
	debugLog(`Program Details:
	Type: ${program.type},
	Image: ${this.tokenLib.symbols.tokenSym in program.image ? program.image[this.tokenLib.symbols.tokenSym] : program.image},
	Args: ${program.args.length > 0 ? program.args.join() : "none"}
	`);
};
Dispatcher.prototype.createProgram = function (functor, thisArg = null, args = []) {
	if (args === null) args = [];
	const program = new Program(functor, thisArg, args);
	if (this.tokenLib.symbols.conSym in functor) program.type = "constructor";
	else if (this.tokenLib.symbols.subSym in functor) program.type = "subroutine";
	else if (this.tokenLib.symbols.genSym in functor) program.type = "generator";
	else if (this.tokenLib.symbols.iterSym in functor) program.type = "iterator";
	else if (this.tokenLib.symbols.crtSym in functor) program.type = "coroutine";
	else program.type = "unknown";
	return program;
}
// Program interaction
Dispatcher.prototype.initProgram = function (program, thisArg = null, args = []) {
	debugLog("Program Initializing:");
	debugLog(program.image);
	debugLog("Arguments given:");
	debugLog(program.args);
	if (thisArg === null && program.thisArg !== null) thisArg = program.thisArg;
	if (args.length === 0 && program.args.length !== 0) args = program.args;
	if (program.type !== "unknown" && this.tokenLib.symbols.tokenSym in program.image) {
		return program.image[this.tokenLib.symbols.tokenSym].apply(thisArg, args);
	}
	return program.image.apply(thisArg, args);
};
Dispatcher.prototype.callProgram = function (program, nextValue, thisArg = null) {
	if (program.type === "unknown") return this.initProgram(program);
	if (program.type === "generator") return this.createIterator(this.initProgram(program));
	if (program.type === "iterator") {
		if (this.activeBlock.lastReturn !== null) return this.initProgram(program, thisArg, [this.activeBlock.lastReturn]);
		return this.initProgram(program);
	}
	if (program.instance === null) program.instance = this.initProgram(program);
	return program.instance.next(nextValue);
};
Dispatcher.prototype.throwIntoProgram = function (program, error) {
	if (program.instance !== null) return program.instance.throw(error);
	else throw error;
};
Dispatcher.prototype.returnFromProgram = function (program) {
	if (program.instance !== null) program.instance.return();
};
// Add a Program to the active ControlBlock, or create a new ControlBlock for it
Dispatcher.prototype.enqueue = function (functor, thisArg = null, args = null) {
	debugLog("Enqueuing Functor:");
	debugLog(functor);
	debugLog(Object.keys(functor).join());
	if (this.blocks.length === 0) {
		this.spawn(functor, thisArg, args);
	} else {
		this.activeBlock.stack.push(this.createProgram(functor, thisArg, args));
	}
};
Dispatcher.prototype.spawn = function (functor, thisArg = null, args = null) {
	debugLog("Spawning Functor in new ControlBlock:");
	debugLog(functor);
	debugLog(Object.keys(functor).join());
	const block = new ControlBlock();
	block.stack.push(this.createProgram(functor, thisArg, args))
	this.blocks.push(block);
};
// Pop and terminate a Program from the end of the stack
Dispatcher.prototype.killLast = function () {
	debugLog("Killing last program in the ControlBlock");
	if (this.activeBlock.stack.length > 0) this.returnFromProgram(this.activeBlock.stack.pop());
	if (this.activeBlock.stack.length === 0) {
		this.blocks.splice(this.blockIndex, 1);
		this.blockIndex--;
	}
};
// Pop and terminate all Programs in the stack
Dispatcher.prototype.killAll = function () {
	debugLog("Killing all programs in the ControlBlock");
	while (this.activeBlock.stack.length > 0) this.killLast(this.activeBlock);
	this.blocks.splice(this.blockIndex, 1);
	this.blockIndex--;
};
// Processes a kernelized instruction
Dispatcher.prototype.processState = function (token) {
	debugLog("Processing Token \"" + token.type + "\"");
	debugLog(token);
	// Interprets an instruction token into stack operations
	if (token.type === "returnValue") {
		this.killLast(this.activeBlock);
		this.activeBlock.lastReturn = token.arg;
	} else if (token.type === "yieldValue") {
		this.activeBlock.stack.pop();
		this.activeBlock.lastReturn = token.arg;
	} else if (token.type === "return") this.killLast(this.activeBlock);
	else if (token.type === "yield") this.activeBlock.stack.pop();
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
		token.functor[this.tokenLib.symbols.conSym] = true;
		this.enqueue(function() { return token.object[token.prop].call(this) }, Object.create(token.functor.prototype));
	} else if (token.type === "newMethodArgs") {
		token.functor[this.tokenLib.symbols.conSym] = true;
		this.enqueue(function(...args) { return token.object[token.prop].apply(this, args) }, Object.create(token.functor.prototype));
	} else if (token.type === "spawn") this.spawn(token.functor);
	else if (token.type === "spawnArgs") this.spawn(token.functor, null, token.args);
	else if (token.type === "spawnMethod") this.spawn(token.object[token.property], token.object);
	else if (token.type === "spawnMethodArgs") this.spawn(token.object[token.property], token.object, token.args);
	else throw new TypeError("Illegal Instruction Kernel \"" + token.type + "\"");
};
// Runs a single execution cycle
Dispatcher.prototype.cycle = function (quantum = null) {
	debugLog("Cycle Invoked");
	const complete = quantum === false;
	if (complete) debugLog("Starting Dispatcher in run-to-completion mode...");
	if (quantum === null) quantum = this.quantum;
	const qStart = performance.now();
	cycle: while (complete || performance.now() - qStart <= quantum) {
		const cStart = performance.now();
		debugLog("Cycling Dispatcher...");
		debugLog("Current Metrics:");
		debugLog(this.metrics);
		while (true) {
			if (!this.running || this.blocks.length === 0) {
				!this.running ? debugLog("Stopping Dispatcher because the Stop signal was received...\n")
					: debugLog("Stopping Dispatcher because all ControlBlock Stacks are empty...\n");
				// Dispatcher is not running, or stack is empty, so abort
				this.stop();
				return;
			}
			if (this.blockIndex >= this.blocks.length || this.blockIndex < 0) this.blockIndex = 0;
			this.activeBlock = this.blocks[this.blockIndex];
			const block = this.activeBlock;
			debugLog("\n\x1b[32mControlBlock " + this.blockIndex + " loaded\x1b[0m");
			if (block.stack.length === 0) {
				this.blocks.splice(this.blockIndex, 1);
				this.blockIndex--;
			}
			if (block.waiting) {
				debugLog("ControlBlock is waiting, so Dispatcher is skipping...");
				this.blockIndex++;
				continue;
			}
			if (block.stack.length > 0) (debugLog("Stack Snapshot:"), debugTable(block.stack));
			else debugLog("ControlBlock Stack is Empty");
			// Advance execution of the last Program in the virtual stack
			try {
				const program = block.stack[block.stack.length - 1];
				debugLog("Dispatching Program:");
				this.printProgram(program);
				if (block.lastReturn !== null) (debugLog("With value:"), debugLog(this.lastReturn));
				// Advances execution of the Program and saves the yielded state
				if (block.lastError !== null) {
					debugLog("Throwing Error into program...");
					// Uncaught error was seen before, so throw it into the Program
					var state = this.throwIntoProgram(program, block.lastError);
					block.lastError = null;
				} else {
					// A value was returned or yielded before, so invoke the Program with it
					var state = block.lastReturn !== null ? this.callProgram(program, block.lastReturn) : this.callProgram(program);
					block.lastReturn = null;
				}
				// Return the yielded state of the Program
				debugLog("Program yielded State:");
				debugLog(state);
				if (program.type === "iterator") program.args = [];
				if (program.type === "unknown") {
					if ((typeof state) === "undefined") state = this.tokenLib.return;
					else state = this.tokenLib.returnValue.set([state]);
				} else if (program.type !== "generator") {
					if (!this.isKernelized(state.value)) {
						if ((typeof state.value) === "undefined") state = this.tokenLib.return;
						else state = this.tokenLib.returnValue.set([state.value]);
					} else {
						state = state.value;
					}
				}
				if (program.type === "constructor" && state !== this.tokenLib.returnValue) {
					state = this.tokenLib.returnValue.set([program.thisArg]);
				}
				// Collect resultant state and process any instructions
				this.processState(state);
			} catch (error) {
				debugLog("Uncaught Error was thrown! Terminating end of stack...");
				debugError(error);
				// Uncaught error, so end the program
				this.killLast(block);
				block.lastError = error;
				if (this.blocks.length === 0) {
					debugLog("Stopping Dispatcher due to an uncaught error...\n");
					this.stop();
					throw error;
				}
			}
			this.blockIndex++;
			// Update metrics
			this.metrics.makeflight = performance.now() - cStart;
			this.metrics.makespan += this.metrics.makeflight;
		}
	}
};
Dispatcher.prototype.runComplete = function () {
	return this.runSync(false);
};
Dispatcher.prototype.runSync = function (quantum = null) {
	debugLog("Beginning synchronous execution...");
	this.running = true;
	while (this.running) this.cycle(quantum);
	return this.lastReturn;
};
Dispatcher.prototype.runAsync = function (interval = 300, quantum = null) {
	return new Promise(function (resolve) {
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
	this.blockIndex = 0;
	this.activeBlock = null;
	this.running = false;
};
module.exports = Dispatcher;