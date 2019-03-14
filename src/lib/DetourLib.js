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
DetourLib.prototype.createIteratorDetour = function(iterator, prop) {
	const tokenLib = this.tokenLib;
	const origIter = iterator[prop];
	const detour = this.createDetour(function(value) {
		if (iterator[tokenLib.symbols.delegateSym] === null) {
			const state = origIter.call(this, value);
			if (
				tokenLib.isKernelized(state.value)
				&& state.value === tokenLib.tokens.yieldValue
				&& state.value.delegate
			) {
				iterator[tokenLib.symbols.delegateSym] = state.value.arg.value;
				state.value.arg.value.yes = true;
				return iterator[prop][tokenLib.symbols.tokenSym].call(iterator[tokenLib.symbols.delegateSym], value);
			}
			return state;
		} else {
			try {
				const state = iterator[tokenLib.symbols.delegateSym][prop][tokenLib.symbols.tokenSym].call(this, value);
				if (!state.done) return state;
				iterator[tokenLib.symbols.delegateSym] = null;
				if (tokenLib.isKernelized(state.value)) {
					return iterator[prop][tokenLib.symbols.tokenSym].call(this, state.value.arg.value);
				}
				return iterator[prop][tokenLib.symbols.tokenSym].call(this);
			} catch (error) {
				return iterator.throw[tokenLib.symbols.tokenSym].call(this, error);
			}
		}
	});
	detour[this.tokenLib.symbols.iterSym] = true;
	return detour;
}
DetourLib.prototype.hookIterator = function (iterator) {
	iterator[this.tokenLib.symbols.iterSym] = true;
	iterator[this.tokenLib.symbols.delegateSym] = null;
	iterator.next = this.createIteratorDetour(iterator, "next");
	iterator.throw = this.createIteratorDetour(iterator, "throw");
	iterator.return = this.createIteratorDetour(iterator, "return");
	const detourLib = this;
	origIter = iterator[Symbol.iterator];
	iterator[Symbol.iterator] = function (value) {
		return detourLib.hookIterator(origIter.call(this, value));
	};
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