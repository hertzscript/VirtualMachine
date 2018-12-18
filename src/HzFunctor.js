// Process Control Block
// Wraps a Function or GeneratorFunction, and stores metadata about it
function HzFunctor(debugLog, tokenLib, functor, thisArg = null, args = []) {
	this.tokenLib = tokenLib;
	this.debugLog = debugLog;
	this.image = functor;
	this.thisArg = thisArg;
	this.args = args === null ? [] : args;
	this.instance = null
	if (this.tokenLib.symbols.conSym in functor) this.type = "constructor";
	else if (this.tokenLib.symbols.subSym in functor) this.type = "subroutine";
	else if (this.tokenLib.symbols.genSym in functor) this.type = "generator";
	else if (this.tokenLib.symbols.iterSym in functor) this.type = "iterator";
	else if (this.tokenLib.symbols.crtSym in functor) this.type = "coroutine";
	else this.type = "unknown";
}
HzFunctor.prototype.log = function () {
	this.debugLog(`Functor Details:
	Type: ${this.type},
	Image: ${this.tokenLib.symbols.tokenSym in this.image ? this.image[this.tokenLib.symbols.tokenSym].toString() : this.image.toString()},
	Args: ${this.args.length > 0 ? this.args.join() : "none"}
	ThisArg: ${this.thisArg}
	`);
};
// Functor interaction
HzFunctor.prototype.initFunctor = function (thisArg = null, args = []) {
	this.debugLog("Functor Initializing:");
	this.log();
	if (thisArg === null && this.thisArg !== null) thisArg = this.thisArg;
	if (args.length === 0 && this.args.length !== 0) args = this.args;
	if (this.type !== "unknown" && this.tokenLib.symbols.tokenSym in this.image) {
		return this.image[this.tokenLib.symbols.tokenSym].apply(thisArg, args);
	}
	return this.image.apply(thisArg, args);
};
HzFunctor.prototype.callFunctor = function (nextValue, thisArg = null) {
	if (this.type === "unknown") return this.initFunctor(thisArg);
	if (this.type === "generator") return this.initFunctor(thisArg);
	if (this.type === "iterator") return this.initFunctor(thisArg, [nextValue]);
	if (!(this.tokenLib.symbols.tokenSym in this.image)) return this.initFunctor(thisArg);
	if (this.instance === null) this.instance = this.initFunctor(thisArg);
	return this.instance.next(nextValue);
};
HzFunctor.prototype.throwIntoFunctor = function (error) {
	if (this.instance !== null) return this.instance.throw(error);
	else throw error;
};
HzFunctor.prototype.returnFromFunctor = function () {
	if (this.instance !== null) this.instance.return();
};
module.exports = HzFunctor;