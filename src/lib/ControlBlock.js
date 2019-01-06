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
module.exports = ControlBlock;