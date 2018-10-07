// Wraps data via set/reset methods
function Kernelizer(...argsArray) {
	this.argSlots = argsArray;
	this.reset();
}
Kernelizer.prototype.set = function (args) {
	if (this.argSlots.length === 0) return this;
	if (args.length === 0) return this.reset();
	args.forEach((value, index) => this[this.argSlots[index]] = value);
	return this;
};
Kernelizer.prototype.reset = function (resetValue = null) {
	if (this.argSlots.length === 0) return this;
	for (const argName of this.argSlots) this[argName] = resetValue;
	return this;
};
module.exports = Kernelizer;