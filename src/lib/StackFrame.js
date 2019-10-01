// Wraps a Function and stores the metadata/operands for it.

function StackFrame(symbols, functor, thisArg = null, args = [], isTailCall = false) {
	this.symbols = symbols;
	this.image = functor;
	this.thisArg = thisArg;
	this.args = args === null ? [] : args;
	this.instance = null;
	this.isTailCall = isTailCall;
	if (symbols.conSym in functor) this.type = "constructor";
	else if (symbols.genSym in functor) this.type = "generator";
	else if (symbols.iterSym in functor) this.type = "iterator";
	else if (symbols.crtSym in functor) this.type = "coroutine";
	else this.type = "unknown";
}
StackFrame.prototype.initFunctor = function (thisArg = null, args = []) {
	if (thisArg === null && this.thisArg !== null) thisArg = this.thisArg;
	if (args.length === 0 && this.args.length !== 0) args = this.args;
	if (this.type !== "unknown" && this.symbols.tokenSym in this.image) {
		return this.image[this.symbols.tokenSym].apply(thisArg, args);
	}
	return this.image.apply(thisArg, args);
};
StackFrame.prototype.callFunctor = function (nextValue, thisArg = null) {
	if (this.type === "unknown") return this.initFunctor(thisArg);
	if (this.type === "generator") return this.initFunctor(thisArg);
	if (this.type === "iterator") return this.initFunctor(thisArg, [nextValue]);
	if (!(this.symbols.tokenSym in this.image)) return this.initFunctor(thisArg);
	if (this.instance === null) this.instance = this.initFunctor(thisArg);
	return this.instance.next(nextValue);
};
StackFrame.prototype.throwIntoFunctor = function (error) {
	if (this.instance !== null) return this.instance.throw(error);
	else throw error;
};
StackFrame.prototype.returnFromFunctor = function () {
	if (this.instance !== null) this.instance.return();
};
module.exports = StackFrame;