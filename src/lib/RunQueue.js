const ControlBlock = require("./ControlBlock.js");
function RunQueue() {
	// The ControlBlock stack
	this.blocks = [];
	// The current active ControlBlock
	this.activeBlock = null;
	// The current active ControlBlock index
	this.blockIndex = 0;
}
RunQueue.prototype.getNext = function () {
	if (this.blocks.length === 0) return null;
	var loc = this.blockIndex;
	const start = loc;
	while (true) {
		if (loc === start + 1) break;
		loc++;
		if (loc >= this.blocks.length || loc < 0) loc = 0;
		if (this.blocks[loc].waiting) continue;
		this.activeBlock = this.blocks[loc];
		this.blockIndex = loc;
		if (this.activeBlock.stack.length === 0) {
			this.killLast();
			continue;
		}
		return this.activeBlock;
	}
	return null;
};
RunQueue.prototype.enqueue = function (hzFunctor) {
	if (this.blocks.length === 0) {
		const block = new ControlBlock();
		block.stack.push(hzFUnctor);
		this.blocks.push(block);
	} else {
		this.activeBlock.stack.push(hzFunctor);
	}
};
RunQueue.prototype.spawn = function (hzFunctor) {
	const block = new ControlBlock();
	block.stack.push(hzFunctor);
	this.blocks.push(block);
};
RunQueue.prototype.killLast = function() {
	if (this.activeBlock.stack.length > 0) this.activeBlock.stack.pop().returnFromFunctor();
	if (this.activeBlock.stack.length === 0) {
		this.blocks.splice(this.blockIndex, 1);
		this.blockIndex--;
		this.activeBlock = this.blockIndex < 0 ? null : this.blocks[this.blockIndex];
	}
};
RunQueue.prototype.killAll = function() {
	while (this.activeBlock.stack.length >= 0) this.killLast();
	this.blocks.splice(this.blockIndex, 1);
	this.blockIndex--;
};
module.exports = RunQueue;