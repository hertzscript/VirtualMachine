function Coroutine(functor, thisArg = null, args = null) {
	this.type = "coroutine";
	this.image = functor;
	this.instance = null;
	this.args = args;
	this.thisArg = thisArg;
}
Coroutine.prototype.call = function (nextValue) {
	if (this.instance === null) {
		if (this.thisArg !== null) {
			if (this.args !== null) {
				this.instance = this.image.apply(this.thisArg, this.args);
			} else {
				this.instance = this.image.call(this.thisArg);
			}
		} else {
			if (this.args !== null) {
				this.instance = this.image(...this.args);
			} else {
				this.instance = this.image();
			}
		}
	}
	const firstYield = this.instance.next(nextValue);
	if (firstYield === Dispatcher.genSym) return this.instance;
};
function Subroutine(functor, thisArg = null, args = null) {
	this.type = "subroutine";
	this.functor = functor;
	this.args = args;
	this.thisArg = thisArg;
}
Subroutine.prototype.call = function (args) {
	if (this.thisArg !== null) {
		if (this.args !== null) {
			var state = this.functor.apply(this.thisArg, this.args);
		} else {
			var state = this.functor.call(this.thisArg);
		}
	} else {
		if (this.args !== null) {
			var state = this.functor(...this.args);
		} else {
			var state = this.functor();
		}
	}
	return { done: true, value: state };
};
const kernSym = Symbol("Kernelization Marker Symbol");
// Dispatcher API Kernelizers
function Call() {
	this.type = "call";
	this.functor = null;
	this.args = null;
	this.thisArg = null;
}
Call.prototype[kernSym] = null;
Call.prototype.set = function (functor, thisArg, ...args) {
	this.functor = functor;
	this.args = args;
	this.thisArg = thisArg;
	return this;
};
function CallSubroutine() {
	this.type = "subroutineCall";
	this.functor = null;
	this.args = null;
	this.thisArg = null;
}
CallSubroutine.prototype[kernSym] = null;
CallSubroutine.prototype.set = function (functor, thisArg, ...args) {
	this.functor = functor;
	this.args = args
	this.thisArg = thisArg;
	return this;
};
function CallMethod() {
	this.type = "methodCall";
	this.object = null;
	this.prop = null;
	this.args = null;
	this.thisArg = null;
}
CallMethod.prototype.set = function (object, prop, ...args) {
	this.object = object;
	this.prop = prop;
	this.args = args
	this.thisArg = object;
	return this;
};
CallMethod.prototype[kernSym] = null;
function CallSubroutineMethod() {
	this.type = "subroutineMethodCall";
	this.object = null;
	this.prop = null;
	this.args = null;
	this.thisArg = null;
}
CallSubroutineMethod.prototype[kernSym] = null;
CallSubroutineMethod.prototype.set = function (object, prop, ...args) {
	this.object = object;
	this.prop = prop;
	this.args = args
	this.thisArg = object;
	return this;
};
function ReturnValue() {
	this.type = "return";
	this.returnValue = null;
}
ReturnValue.prototype[kernSym] = null;
ReturnValue.prototype.set = function (value = Dispatcher.nullSym) {
	this.returnValue = value;
	return this;
};
function YieldValue() {
	this.type = "yield",
	this.yieldValue = null;
}
YieldValue.prototype[kernSym] = null;
YieldValue.prototype.set = function (value = Dispatcher.nullSym) {
	this.yieldValue = value;
	return this;
};
const flyweights = [
	Call,
	CallMethod,
	CallSubroutine,
	CallSubroutineMethod,
	ReturnValue,
	YieldValue
];
function Dispatcher() {
	this.running = false;
	this.task = null;
	this.lastReturn = null;
	this.lastError = null;
	this.stack = [];
	for (const Flyweight of flyweights) {
		const flyweight = new Flyweight();
		this[Flyweight.name] = (...args) => flyweight.set(...args);
	}
}
Dispatcher.kernSym = kernSym;
Dispatcher.nullSym = Symbol("Null Value Symbol");
Dispatcher.genSyn = Symbol("Generator Symbol");
Dispatcher.prototype.kernSym = Dispatcher.kernSym;
Dispatcher.prototype.nullSym = Dispatcher.nullSym;
Dispatcher.prototype.cycle = function () {
	try {
		if (this.stack.length === 0 || !this.running) {
			this.running = false;
			return;
		}
		this.task = this.stack[this.stack.length - 1];
		try {
			if (this.lastError !== null) {
				var state = this.task.instance.throw(this.lastError);
			} else {
				var state = this.task.call(this.lastReturn !== null ? this.lastReturn : undefined);
			}
		} catch (error) {
			this.stack.pop();
			this.lastError = error;
		}
		this.lastReturn = null;
		if (this.task.type === "subroutine"
			|| (typeof state.value) !== "object"
			|| !(this.kernSym in state.value)
		) {
			var node = this.ReturnValue(state.value);
		} else {
			var node = state.value;
		}
		if (node.type === "return") {
			this.lastReturn = node.returnValue !== this.nullSym ? node.returnValue : undefined;
			this.stack.pop();
			return;
		} else if (node.type === "yield") {
			this.lastReturn = node.yieldValue !== this.nullSym ? node.yieldValue : undefined;
			this.stack.pop();
			return;
		} else if (state.done) {
			this.stack.pop();
		}
		if (node.type === "call") {
			if (node.args.length === 0) node.args = null;
			this.stack.push(new Coroutine(node.functor, node.thisArg, node.args));
		} else if (node.type === "methodCall") {
			if (node.args.length === 0) node.args = null;
			this.stack.push(new Coroutine(node.object[node.prop], node.object, node.args));
		} else if (node.type === "subroutineCall") {
			if (node.args.length === 0) node.args = null;
			this.stack.push(new Subroutine(node.functor, node.thisArg, node.args));
		} else if (node.type === "subroutineMethodCall") {
			if (node.args.length === 0) node.args = null;
			this.stack.push(new Subroutine(node.object[node.prop], node.object, node.args));
		} else if (node.type === "sysCall") {
			if (!(sysCall in this.sysCalls)) throw new ReferenceError("ABORTING CYCLE: Requested SysCall \"" + node.callName + "\" was not found.");
			this.sysCalls[node.callName](node.args);
		}
	} catch (error) {
		console.group(error);
		console.log("\n");
		console.error(`Current Task:\n{\n\t${Object.keys(this.task).map(key => `${key}: ${((typeof this.task[key]) === "function" ? "[function " + this.task[key].name + "]" : this.task[key])}`).join(",\n\t")}\n}\n`);
		console.error("Dispatcher Stack:\n" + this.stack.map(function (node) {
			return `{\n\t${Object.keys(node).map(key => `${key}: ${((typeof node[key]) === "function" ? "[function " + node[key].name + "]" : node[key])}`).join(",\n\t")}\n}`;
		}).join(",\n"));
		console.groupEnd();
		this.running = false;
	}
};
Dispatcher.prototype.enqueue = function (functor, thisArg, ...args) {
	this.stack.push(new Coroutine(functor, thisArg, ...args));
};
Dispatcher.prototype.runSync = function () {
	this.running = true;
	while (this.running) this.cycle();
};
Dispatcher.prototype.runAsync = function (quantum = 0) {
	this.running = true;
	return new Promise(function (resolve, reject) {
		const asyncRunner = function () {
			this.cycle();
			if (!this.running) return resolve();
			setTimeout(asyncRunner, quantum);
		};
	});
};
Dispatcher.prototype.runIterator = function* () {
	this.running = true;
	while (this.running) yield this.cycle();
};
Dispatcher.prototype.stop = function () {
	this.running = false;
};
module.exports = Dispatcher;