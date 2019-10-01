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
const GeneratorFunction = (function* () { }).constructor;
DetourLib.prototype.createIteratorDetour = function (origIter, iterator, prop) {
	const tokenLib = this.tokenLib;
	const tokenSym = tokenLib.symbols.tokenSym;
	const delegateSym = tokenLib.symbols.delegateSym;
	const detour = this.createDetour(function (...values) {
		if (!iterator[delegateSym] || iterator[delegateSym] === null) {
			const state = origIter[prop].apply(this, values);
			if (
				tokenLib.isKernelized(state.value)
				&& state.value === tokenLib.tokens.yieldValue
				&& state.value.delegate
			) {
				const delegate = state.value.arg.value;
				if (typeof delegate === "undefined") throw new TypeError((typeof delegate) + " is not iterable");
				if (tokenLib.symbols.iterSym in delegate) {
					iterator[delegateSym] = delegate;
				} else if ((typeof delegate === "function") && delegate.constructor === GeneratorFunction) {
					iterator[delegateSym] = delegate.apply(this, values);
				} else if (Symbol.iterator in delegate) {
					iterator[delegateSym] = delegate[Symbol.iterator].apply(this, values);
				} else {
					throw new TypeError((typeof delegate) + " is not iterable");
				}
				return iterator[prop][tokenSym].apply(delegate, values);
			}
			if (state.done && (typeof state.value) === "undefined") {
				return {
					done: true,
					value: tokenLib.tokens.returnValue.set([state])
				};
			}
			return state;
		} else {
			try {
				const state = iterator[delegateSym][prop][tokenSym].apply(iterator[delegateSym], values);
				if (!state.done) return state;
				iterator[delegateSym] = null;
				if (
					tokenLib.isKernelized(state.value)
					&& (state.value === tokenLib.tokens.yieldValue || state.value === tokenLib.tokens.returnValue)
				) {
					return iterator[prop][tokenSym].call(this, state.value.arg);
				}
				return iterator[prop][tokenSym].call(this);
			} catch (error) {
				iterator[delegateSym] = null;
				return iterator.throw[tokenSym].call(this, error);
			}
		}
	});
	detour[this.tokenLib.symbols.iterSym] = true;
	return detour;
}
DetourLib.prototype.hookIterator = function (iterator) {
	const origIter = {
		next: iterator.next,
		throw: iterator.throw,
		return: iterator.return
	};
	iterator[this.tokenLib.symbols.iterSym] = true;
	iterator[this.tokenLib.symbols.delegateSym] = null;
	iterator.next = this.createIteratorDetour(origIter, iterator, "next");
	iterator.throw = this.createIteratorDetour(origIter, iterator, "throw");
	iterator.return = this.createIteratorDetour(origIter, iterator, "return");
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