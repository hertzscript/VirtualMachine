// Library for implementing dynamic Function call interception (FCI)
function DetourLib(Dispatcher, tokenLib) {
	this.tokenLib = tokenLib;
	this.Dispatcher = Dispatcher;
}
DetourLib.prototype.createDetour = function (functor) {
	const tokenLib = this.tokenLib;
	const Dispatcher = this.Dispatcher;
	const hzFunctor = function (...argsArray) {
		const hzDisp = new Dispatcher(tokenLib);
		hzDisp.enqueue(hzFunctor, this, argsArray);
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
	return this.tokenLib.tokens.yieldValue.set([iterator]);
};
DetourLib.prototype.hookCoroutine = function (functor) {
	const coroutine = this.createDetour(functor);
	functor[this.tokenLib.symbols.crtSym] = true;
	coroutine[this.tokenLib.symbols.crtSym] = true;
	return coroutine;
};
DetourLib.prototype.hookArrowCoroutine = function (functor, thisArg) {
	const descriptor = {
		length: {
			configurable: true,
			value: functor.length
		},
		name: {
			configurable: true,
			value: functor.name
		},
		toString: {
			configurable: true,
			value: functor.toString.bind(functor)
		}
	};
	functor = functor.bind(thisArg);
	Object.defineProperties(functor, descriptor);
	return this.hookCoroutine(functor);
};
module.exports = DetourLib;