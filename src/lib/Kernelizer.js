// Wraps data via set/reset methods
function Kernelizer(...argsArray) {
	this.argSlots = argsArray;
	this.reset();
}
Kernelizer.prototype.set = function (args) {
	if (this.argSlots.length === 0) return this;
	this.argSlots.forEach((argName, index) => {
		if (index <= args.length - 1) this[argName] = args[index];
		else this[argName] = undefined;
	});
	return this;
};
Kernelizer.prototype.reset = function (resetValue) {
	if (this.argSlots.length === 0) return this;
	for (const argName of this.argSlots) this[argName] = resetValue;
	return this;
};
module.exports = Kernelizer;