const performance = require('perf_hooks').performance;
const TokenLib = require("./lib/TokenLib.js");
const DetourLib = require("./lib/DetourLib.js");
const UserLib = require("./lib/UserLib.js");
const StackFrame = require("./lib/StackFrame.js");
const ControlBlock = require("./lib/ControlBlock.js");
const AspectWeaver = require("./lib/AspectWeaver.js");
// Aspect Oriented Virtual Machine
function VirtualMachine(uTokenLib = null) {
	// Instruction Token Library
	if (uTokenLib !== null) this.tokenLib = uTokenLib;
	else this.tokenLib = new TokenLib;
	// Functor detour library
	this.detourLib = new DetourLib(VirtualMachine, this.tokenLib);
	// Userland Library
	this.userLib = new UserLib(this.tokenLib, this.detourLib);
	// Coroutine Control Block
	this.controlBlock = new ControlBlock(this.tokenLib);
	this.lastError = this.tokenLib.symbols.nullSym;
	this.lastRemit = this.tokenLib.symbols.nullSym;
	this.lastInstruction = null;
	this.terminated = false;
	this.weaver = new AspectWeaver(this, {
		enqueue: [this._enqueue],
		import: [this._import],
		terminate: [this._terminate],
		vmError: [this._vmError],
		programError: [this._programError],
		fetch: [this._fetchInstruction],
		coerce: [this._coerceInstruction],
		execute: [this._executeInstruction],
		cycle: [this._cycle]
	});
}
// Add a StackFrame to the active ControlBlock, or create a new ControlBlock for it
VirtualMachine.prototype._enqueue = function (rValue, stop, functor, thisArg = null, args = null, isTailCall = false) {
	if ((typeof functor) !== "function") throw new TypeError(functor + " is not a function");
	this.controlBlock.pushFrame(new StackFrame(this.tokenLib.symbols, functor, thisArg, args, isTailCall));
};
VirtualMachine.prototype.enqueue = function (functor, thisArg = null, args = null, isTailCall = false) {
	this.weaver.execAspects("enqueue", functor, thisArg, args, isTailCall);
};
VirtualMachine.prototype._import = function (rValue, stop, hzModule) {
	this.enqueue(hzModule(this.userLib));
};
VirtualMachine.prototype.import = function (hzModule) {
	this.weaver.execAspects("import", hzModule);
};
// Pop and terminate all StackFrames in the stack, freeing the memory they use.
VirtualMachine.prototype._terminate = function () {
	this.controlBlock.killAllFrames();
	this.terminated = true;
};
VirtualMachine.prototype.terminate = function () {
	this.weaver.execAspects("terminate");
};
VirtualMachine.prototype.executors = {
	// Loop interruptor
	loopYield: () => { },
	return: (tokenLib, token, controlBlock) => {
		// Return without argument
		controlBlock.killLastFrame();
		controlBlock.lastReturn = undefined;
	},
	returnValue: (tokenLib, token, controlBlock) => {
		// Return with argument
		controlBlock.killLastFrame();
		controlBlock.lastReturn = token.arg;
	},
	yield: (tokenLib, token, controlBlock) => {
		// Yield without argument
		controlBlock.popFrame();
		controlBlock.lastReturn = token.arg;
	},
	yieldValue: (tokenLib, token, controlBlock) => {
		// Yield with argument
		controlBlock.popFrame();
		controlBlock.lastReturn = token.arg;
	},
	call: (tokenLib, token, controlBlock, wasTailCall) => {
		// Function call without arguments
		if (token.isTailCall && wasTailCall) controlBlock.killLastFrame();
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.functor, null, null, token.isTailCall));
	},
	callArgs: (tokenLib, token, controlBlock, wasTailCall) => {
		// Function call with arguments
		if (token.isTailCall && wasTailCall) controlBlock.killLastFrame();
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.functor, null, token.args, token.isTailCall));
	},
	callMethod: (tokenLib, token, controlBlock, wasTailCall) => {
		// Method call without arguments
		if (token.isTailCall && wasTailCall) controlBlock.killLastFrame();
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.object[token.property], token.object, null, token.isTailCall));
	},
	callMethodArgs: (tokenLib, token, controlBlock, wasTailCall) => {
		// Method call with arguments
		if (token.isTailCall && wasTailCall) controlBlock.killLastFrame();
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.object[token.property], token.object, token.args, token.isTailCall));
	},
	new: (tokenLib, token, controlBlock) => {
		// NewExpression without arguments
		token.functor[tokenLib.symbols.conSym] = true;
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.functor, Object.create(token.functor.prototype)));
	},
	newArgs: (tokenLib, token, controlBlock) => {
		// NewExpression with arguments
		token.functor[tokenLib.symbols.conSym] = true;
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.functor, Object.create(token.functor.prototype), token.args));
	},
	newMethod: (tokenLib, token, controlBlock) => {
		// NewExpression from method without arguments
		token.object[token.property][tokenLib.symbols.conSym] = true;
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.object[token.property], Object.create(token.object[token.property].prototype)));
	},
	newMethodArgs: (tokenLib, token, controlBlock) => {
		// NewExpression from method with arguments
		token.object[token.property][tokenLib.symbols.conSym] = true;
		controlBlock.pushFrame(new StackFrame(tokenLib.symbols, token.object[token.property], Object.create(token.object[token.property].prototype), token.args));
	},
	illegalToken: (tokenLib, token) => {
		throw new TypeError("Illegal Instruction Kernel \"" + token + "\"");
	}
};
VirtualMachine.prototype._executeInstruction = function (rValue, stop, tokenLib, token, controlBlock, wasTailCall) {
	if (token.type in this.executors) return this.executors[token.type](tokenLib, token, controlBlock, wasTailCall);
	else return this.executors.illegalToken(tokenLib, token);
};
VirtualMachine.prototype.executeInstruction = function (tokenLib, token, controlBlock, wasTailCall) {
	this.weaver.execAspects("execute", tokenLib, token, controlBlock, wasTailCall);
};
VirtualMachine.prototype._coerceInstruction = function (rValue, stop, tokenLib, detourLib, stackFrame, state) {
	if (stackFrame.type === "iterator") stackFrame.args = [];
	if (stackFrame.type === "generator") {
		// Detour an iterator
		state = detourLib.hookIterator(state, stackFrame.image[tokenLib.symbols.tokenSym].constructor === AsyncGeneratorFunction);
	} else if (stackFrame.type === "unknown") {
		// State is not an Hztoken, so wrap it in one
		if ((typeof state) === "undefined") state = tokenLib.tokens.return;
		else state = tokenLib.tokens.returnValue.set([state]);
	} else {
		if (
			!(tokenLib.symbols.tokenSym in stackFrame.image)
			|| (typeof state) !== "object"
			|| state === null
			|| !("value" in state)
		) {
			// State is not an HzToken, so wrap it in one
			state = tokenLib.tokens.returnValue.set([state]);
		} else if (!tokenLib.isKernelized(state.value)) {
			// State is not an HzToken, so wrap it in one
			if ((typeof state.value) === "undefined") state = tokenLib.tokens.return;
			else state = tokenLib.tokens.returnValue.set([state.value]);
		} else if (!tokenLib.isKernelized(state)) {
			// State.value is an HzToken, so unwrap it
			state = state.value;
		}
	}
	if (stackFrame.type === "constructor" && (
		state === tokenLib.tokens.return
		|| (state === tokenLib.tokens.returnValue && (typeof state.arg) === "undefined")
	)) {
		// State is from a constructor, so wrap it in an HzToken
		state = tokenLib.tokens.returnValue.set([stackFrame.thisArg]);
	}
	// Return the HzToken
	return state;
};
VirtualMachine.prototype.coerceInstruction = function (rValue, stop, tokenLib, detourLib, stackFrame, state) {
	this.weaver.execAspects("coerce", tokenLib, detourLib, stackFrame, state);
};
function VMError(error) {
	Object.defineProperty(error, "name", {
		value: "Fatal VM Runtime Error, " + error.name,
		enumerable: false
	});
	return error;
}
VirtualMachine.prototype._vmError = function (rValue, stop, error, controlBlock) {
	this.terminated = true;
	this.controlBlock.killAllFrames();
	throw new VMError(error);
};
function ProgramError(error) {
	Object.defineProperty(error, "name", {
		value: "User Program Error, " + error.name,
		enumerable: false
	});
	return error;
}
VirtualMachine.prototype._programError = function (rValue, stop, error, controlBlock, throwUp) {
	controlBlock.killLastFrame();
	controlBlock.lastError = error;
	if (controlBlock.stack.length === 0 && throwUp) throw new ProgramError(error);
	else console.error(error);
};
VirtualMachine.prototype._fetchInstruction = function (rValue, stop, stackFrame, tokenLib, detourLib, controlBlock, throwUp) {
	try {
		// Advances execution of the StackFrame and saves the yielded state
		if (controlBlock.lastError !== tokenLib.symbols.nullSym) {
			// Uncaught error was seen before, so throw it into the StackFrame
			var state = stackFrame.throwIntoFunctor(controlBlock.lastError);
			controlBlock.lastError = tokenLib.symbols.nullSym;
		} else {
			// A value was returned or yielded before, so invoke the StackFrame with it
			if (controlBlock.lastReturn !== tokenLib.symbols.nullSym) {
				var state = stackFrame.callFunctor(controlBlock.lastReturn);
			} else {
				var state = stackFrame.callFunctor();
			}
		}
		return state;
	} catch (error) {
		this.weaver.execAspects("programError", error, controlBlock, throwUp);
	}
};
VirtualMachine.prototype.fetchInstruction = function (stackFrame, tokenLib, detourLib, controlBlock, throwUp) {
	this.weaver.execAspects("fetch", stackFrame, tokenLib, detourLib, controlBlock, throwUp);
};
// Runs a single fetch-decode-execute instruction cycle
VirtualMachine.prototype._cycle = function (rValue, stop, throwUp = false) {
	this.terminated = false;
	// Get the next runnable StackFrame
	if (this.controlBlock.stack.length === 0) {
		this.terminated = true;
		return;
	}
	const stackFrame = this.controlBlock.getCurrentFrame();
	var state = null;
	try {
		state = this.weaver.execAspects("fetch", stackFrame, this.tokenLib, this.detourLib, this.controlBlock, throwUp);
		state = this.weaver.execAspects("coerce", this.tokenLib, this.detourLib, stackFrame, state);
		this.lastInstruction = state;
		this.weaver.execAspects("execute", this.tokenLib, state, this.controlBlock, stackFrame.isTailCall);
	} catch (error) {
		this.weaver.execAspects("vmError", error, this.controlBlock);
	}
	if (
		state === this.tokenLib.tokens.remit
		|| state === this.tokenLib.tokens.remitValue
	) {
		this.lastRemit = state.arg;
		return state.arg;
	}
};
VirtualMachine.prototype.cycle = function (throwUp = false) {
	this.weaver.execAspects("cycle", throwUp);
};
module.exports = VirtualMachine;