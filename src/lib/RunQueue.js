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
RunQueue.prototype.getNext = function () {
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
			this.removeCurrent();
			if (this.blocks.length === 0) break;
			continue;
		}
		return this.activeBlock;
	}
	return null;
};
RunQueue.prototype.enqueue = function (hzFunctor) {
	if (this.blocks.length === 0) return this.spawn(hzFunctor);
	else this.activeBlock.pushFunctor(hzFunctor);
	return this.activeBlock;
};
RunQueue.prototype.spawn = function (hzFunctor) {
	const block = new ControlBlock(this.tokenLib);
	block.pushFunctor(hzFunctor);
	this.blocks.push(block);
	return block;
};
RunQueue.prototype.removeCurrent = function () {
	this.blocks.splice(this.blockIndex, 1);
	this.blockIndex--;
	this.activeBlock = this.blockIndex < 0 ? null : this.blocks[this.blockIndex];
};
RunQueue.prototype.returnFromLast = function () {
	this.activeBlock.killLast();
};
RunQueue.prototype.killLast = function () {
	if (this.activeBlock === null) return;
	this.returnFromLast();
	if (this.activeBlock.stack.length === 0) this.removeCurrent();
};
RunQueue.prototype.killAll = function () {
	this.activeBlock.killAll();
	this.removeCurrent();
};
module.exports = RunQueue;