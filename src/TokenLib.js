// Kernelizer with values via set/reset methods
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
// Instruction tokens are recycled data/functor kernelizing flyweight objects
function HzToken(type, ...argsArray) {
	const kern = new Kernelizer(...argsArray);
	kern.type = type;
	return kern;
}
function TokenLib() {
	// Dispatcher Instruction Tokens
	// 2 types: Invocation Tokens & Data Tokens
	return {
		call: new HzToken("call",
			"functor",
			"thisArg",
			"args"
		),
		callMethod: new HzToken("callMethod",
			"object",
			"property",
			"args"
		),
		return: new HzToken("return"),
		returnValue: new HzToken("returnValue",
			"arg"
		),
		yield: new HzToken("yield"),
		yieldValue: new HzToken("yieldValue",
			"arg"
		),
		symbols: {
			kernSym: Symbol("Kernelization Marker Symbol"),
			tokenSym: Symbol("Instruction Token Stream Symbol"),
			genSym: Symbol("Generator Symbol"),
			crtSym: Symbol("Coroutine Symbol"),
			nullSym: Symbol("Null Value Symbol")
		}
	};
}
module.exports = TokenLib;