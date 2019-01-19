// A type of low level Stack Control Block
function ControlBlock() {
	// A virtual stack of hzFunctors and Functions
	this.stack = [];
	// The last new return value seen by the Dispatcher
	this.lastReturn = null;
	// The last new Error seen by the Dispatcher
	this.lastError = null;
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
	this.stack.pop();
};
ControlBlock.prototype.getCurrent = function() {
	if (this.stack.length === 0) return null;
	return this.stack[this.stack.length - 1];
};
ControlBlock.prototype.killLast = function() {
	this.stack.pop().returnFromFunctor();
};
ControlBlock.prototype.killAll = function() {
	while (this.stack.length >= 0) this.killLast();
};
module.exports = ControlBlock;