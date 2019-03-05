// A type of low level Process Control Block
function ControlBlock(tokenLib) {
	this.tokenLib = tokenLib;
	// A virtual stack of hzFunctors and Functions
	this.stack = [];
	// The last new return value seen by the Dispatcher
	this.lastReturn = tokenLib.symbols.nullSym;
	// The last new Error seen by the Dispatcher
	this.lastError = tokenLib.symbols.nullSym;
	// Pauses a stack's execution
	this.waiting = false;
	this.metrics = {
		// Last Cycle time
		makeflight: 0,
		// Total running time
		makespan: 0
	};
}
ControlBlock.prototype.pushFunctor = function(hzFunctor) {
	this.stack.push(hzFunctor);
};
ControlBlock.prototype.popFunctor = function() {
	return this.stack.pop();
};
ControlBlock.prototype.getCurrent = function() {
	if (this.stack.length === 0) return null;
	return this.stack[this.stack.length - 1];
};
ControlBlock.prototype.killLast = function() {
	if (this.stack.length !== 0) this.popFunctor().returnFromFunctor();
};
ControlBlock.prototype.killAll = function() {
	while (this.stack.length >= 0) this.killLast();
};
module.exports = ControlBlock;