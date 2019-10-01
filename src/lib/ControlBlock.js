// A type of low level Process Control Block
function ControlBlock(tokenLib) {
	this.tokenLib = tokenLib;
	// A virtual stack of StackFrames
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
ControlBlock.prototype.pushFrame = function(stackFrame) {
	this.stack.push(stackFrame);
};
ControlBlock.prototype.popFrame = function() {
	return this.stack.pop();
};
ControlBlock.prototype.getCurrentFrame = function() {
	if (this.stack.length === 0) return null;
	return this.stack[this.stack.length - 1];
};
ControlBlock.prototype.killLastFrame = function() {
	if (this.stack.length !== 0) this.popFrame().returnFromFunctor();
};
ControlBlock.prototype.killAllFrames = function() {
	while (this.stack.length >= 0) this.killLastFrame();
};
module.exports = ControlBlock;