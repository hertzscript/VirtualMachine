function DetourLib(Dispatcher, tokenLib, debugLog) {
	this.tokenLib = tokenLib;
	// TODO: Remove the logging somehow
	this.debugLog = debugLog;
	this.Dispatcher = Dispatcher;
}
// Dynamic call site interception
DetourLib.prototype.createDetour = function (functor) {
	this.debugLog("Creating call adapter for:");
	this.debugLog(functor);
	const tokenLib = this.tokenLib;
	const hzFunctor = function (...argsArray) {
		const hzDisp = new this.Dispatcher(tokenLib);
		this.debugLog("\nhzFunctor has been invoked, initializing new Dispatcher:");
		this.debugLog(hzFunctor);
		hzDisp.enqueue(hzFunctor[d.tokenLib.symbols.tokenSym], this, argsArray);
		return hzDisp.runComplete();
	};
	hzFunctor[this.tokenLib.symbols.tokenSym] = functor;
	return hzFunctor;
}
DetourLib.prototype.hookSubroutine = function (functor) {
	const subroutine = this.createDetour(functor);
	functor[this.tokenLib.symbols.subSym] = true;
	subroutine[this.tokenLib.symbols.subSym] = true;
	return subroutine;
};
DetourLib.prototype.hookGenerator = function (functor) {
	const generator = this.createDetour(functor);
	functor[this.tokenLib.symbols.genSym] = true;
	generator[this.tokenLib.symbols.genSym] = true;
	return generator;
};
DetourLib.prototype.hookIterator = function (iterator) {
	iterator.next = this.createDetour(iterator.next);
	iterator.throw = this.createDetour(iterator.throw);
	iterator.return = this.createDetour(iterator.return);
	iterator.next[this.tokenLib.symbols.iterSym] = true;
	iterator.throw[this.tokenLib.symbols.iterSym] = true;
	iterator.return[this.tokenLib.symbols.iterSym] = true;
	iterator[this.tokenLib.symbols.iterSym] = true;
	return this.tokenLib.yieldValue.set([iterator]);
};
DetourLib.prototype.hookCoroutine = function (functor) {
	const coroutine = this.createDetour(functor);
	functor[this.tokenLib.symbols.crtSym] = true;
	coroutine[this.tokenLib.symbols.crtSym] = true;
	return coroutine;
};
DetourLib.prototype.hookArrowCoroutine = function (functor, thisArg) {
	const name = functor.name;
	const length = functor.length;
	const toString = functor.toString.bind(functor);
	functor = functor.bind(thisArg);
	Object.defineProperties(functor, {
		length: {
			configurable: true,
			value: length
		},
		name: {
			configurable: true,
			value: name
		},
		toString: {
			configurable: true,
			value: toString
		}
	});
	return this.hookCoroutine(functor);
};
module.exports = DetourLib;