const performance = require('perf_hooks').performance;
const VirtualMachine = require("./VirtualMachine.js");
const hzCompile = require("hertzscript-compiler");
function Context(uTokenLib = null, cQuantum = 300, tQuantum = 0) {
	this.vm = new VirtualMachine(uTokenLib);
	// Default cycle time-slice length
	this.cQuantum = cQuantum;
	this.terminated = false;
	this.metrics = {
		// Last Cycle time
		makeflight: 0,
		// Total running time
		makespan: 0
	};
	this.reflectors = {};
	this.hook = {};
	const times = ["before", "after"];
	const types = Object.keys(this.vm.weaver.aspects);
	for (const when of times) {
		this.hook[when] = {};
		this.reflectors[when] = {};
		for (const type of types) {
			this.hook[when][type] = callback => this.createHook(when, type, callback);
			this.reflectors[when][type] = new Set();
		}
	}
}
Context.prototype.invokeHook = function (when, type, argsArray) {
	if (
		!(when in this.reflectors)
		|| !(type in this.reflectors[when])
		|| this.reflectors[when][type].size === 0
	) {
		return false;
	}
	for (const callback of this.reflectors[when][type]) callback.apply(callback, argsArray);
};
Context.prototype.createHook = function (when, type, callback) {
	if (!(when in this.reflectors)) throw new Error("No such hook time \"" + type + "\"");
	if (!(type in this.reflectors[when])) throw new Error("No such hook type \"" + type + "\"");
	if (this.reflectors[when][type].size === 0) {
		if (when === "before") {
			this.vm.weaver.unshiftAspect(type, (...argsArray) => {
				this.invokeHook(when, type, argsArray);
			});
		} else if (when === "after") {
			this.vm.weaver.pushAspect(type, (...argsArray) => {
				this.invokeHook(when, type, argsArray);
			});
		}
	}
	this.reflectors[when][type].add(callback);
};
Context.prototype.unhook = function (when, type, callback = null) {
	if (callback === null) this.reflectors[when][type].clear();
	else this.reflectors[when][type].delete(callback);
};
// Set the time slice quantum of the Context cycle
Context.prototype.cycleQuantum = function (cQuantum) {
	this.cQuantum = cQuantum;
};
// Add a StackFrame to the active ControlBlock, or create a new ControlBlock for it
Context.prototype.enqueue = function (functor, thisArg = null, args = null, isTailCall = false) {
	this.vm.enqueue(functor, thisArg, args, isTailCall);
};
Context.prototype.import = function (hzModule) {
	this.vm.import(hzModule);
};
Context.prototype.importString = function (source, compile = false) {
	if (compile) source = hzCompile(source);
	const hzModule = new Function("hzUserLib", `return (hzUserLib.hookCoroutine(function* (){` + source + `}));`);
	this.import(hzModule);
};
// Pop and terminate all StackFrames in the stack
Context.prototype.killAll = function () {
	this.vm.terminate();
	this.terminated = true;
};
// Synchronous mode, runs for the duration of the quantum in milliseconds
Context.prototype.dispatch = function (cQuantum = null, throwUp = false) {
	this.running = true;
	const complete = cQuantum === false;
	if (cQuantum === null) cQuantum = this.cQuantum;
	const cEnd = performance.now() + cQuantum;
	while (complete || performance.now() < cEnd) {
		if (this.vm.terminated) {
			this.terminated = true;
			return;
		}
		const cStart = performance.now();
		this.vm.cycle(throwUp);
		this.metrics.makeflight = performance.now() - cStart;
		this.metrics.makespan += this.metrics.makeflight;
		if (this.vm.lastRemit !== this.vm.tokenLib.symbols.nullSym) return this.vm.lastRemit;
	}
};
Context.prototype.runAsync = function(cQuantum = null, interval = 5, throwUp = false) {
	return new Promise(resolve => {
		const asyncRunner = () => {
			if (!context.terminated) var state = this.dispatch(cQuantum, throwUp);
			if (context.terminated || state) return resolve(state);

			setTimeout(asyncRunner, interval);
		};
		setTimeout(asyncRunner, interval);
	});
};
// Run-to-completion mode, dispatches continuously until all programs have exited
Context.prototype.runComplete = function (throwUp = false) {
	return this.dispatch(false, throwUp);
};
module.exports = Context;