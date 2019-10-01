const ControlBlock = require("./ControlBlock.js");
// Round-Robin process scheduler
function RunQueue(tokenLib, quantum = 0) {
	this.tokenLib = tokenLib;
	// Milliseconds a ControlBlock is allowed to continuously run
	this.quantum = quantum;
	// The ControlBlock stack
	this.blocks = [];
	// The current active ControlBlock
	this.activeBlock = null;
	// The current active ControlBlock index
	this.blockIndex = 0;
}
RunQueue.prototype.extend = function (extender) {
	if (typeof extender !== "function") {
		throw new TypeError("extend expects type \"function\" but type \"" + typeof extender + "\" was given.");
	}
	extender.call(this);
};
RunQueue.prototype.getNextFrame = function () {
	if (this.blocks.length === 0) return null;
	if (
		this.activeBlock !== null
		&& this.activeBlock.metrics.makeflight < this.quantum
	) {
		return this.activeBlock;
	}
	var loc = this.blockIndex;
	const start = loc;
	while (loc !== start + 1) {
		loc++;
		if (loc >= this.blocks.length || loc < 0) loc = 0;
		if (this.blocks[loc].waiting) continue;
		this.activeBlock = this.blocks[loc];
		this.blockIndex = loc;
		if (this.activeBlock.stack.length === 0) {
			this.removeCurrentBlock();
			if (this.blocks.length === 0) break;
			continue;
		}
		return this.activeBlock;
	}
	return null;
};
RunQueue.prototype.enqueue = function (stackFrame) {
	if (this.blocks.length === 0) return this.spawn(stackFrame);
	else this.activeBlock.pushFrame(stackFrame);
	return this.activeBlock;
};
RunQueue.prototype.spawn = function (stackFrame) {
	const block = new ControlBlock(this.tokenLib);
	block.pushFrame(stackFrame);
	this.blocks.push(block);
	return block;
};
RunQueue.prototype.removeCurrentBlock = function () {
	this.blocks.splice(this.blockIndex, 1);
	this.blockIndex--;
	this.activeBlock = this.blockIndex < 0 ? null : this.blocks[this.blockIndex];
};
RunQueue.prototype.returnFromLastFrame = function () {
	this.activeBlock.killLastFrame();
};
RunQueue.prototype.killLastFrame = function () {
	if (this.activeBlock === null) return;
	this.returnFromLastFrame();
	if (this.activeBlock.stack.length === 0) this.removeCurrentBlock();
};
RunQueue.prototype.killLastBlock = function () {
	this.activeBlock.killAllFrames();
	this.removeCurrentBlock();
};
module.exports = RunQueue;