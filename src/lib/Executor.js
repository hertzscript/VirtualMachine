// Processes a kernelized instruction token
module.exports = function Executors(additions = null) {
	const executors = {
		// Loop interruptor
		loopYield: () => { },
		returnValue: (tokenLib, queue, block, token) => {
			// Return with argument
			queue.killLast();
			block.lastReturn = token.arg;
		},
		yieldValue: (tokenLib, queue, block, token) => {
			// Yield with argument
			block.popFunctor();
			block.lastReturn = token.arg;
		},
		return: (tokenLib, queue, block, token) => {
			// Return without argument
			queue.killLast();
			block.lastReturn = undefined;
		},
		yield: (tokenLib, queue, block, token) => {
			// Yield without argument
			block.popFunctor();
			block.lastReturn = token.arg;
		},
		call: (tokenLib, queue, block, token, wasTailCall) => {
			// Function call without arguments
			if (token.isTailCall && wasTailCall) block.killLast();
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, null, null, token.isTailCall));
		},
		callArgs: (tokenLib, queue, block, token, wasTailCall) => {
			// Function call with arguments
			if (token.isTailCall && wasTailCall) block.killLast();
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, null, token.args, token.isTailCall));
		},
		callMethod: (tokenLib, queue, block, token, wasTailCall) => {
			// Method call without arguments
			if (token.isTailCall && wasTailCall) block.killLast();
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object, null, token.isTailCall));
		},
		callMethodArgs: (tokenLib, queue, block, token, wasTailCall) => {
			// Method call with arguments
			if (token.isTailCall && wasTailCall) block.killLast();
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object, token.args, token.isTailCall));
		},
		new: (tokenLib, queue, block, token) => {
			// NewExpression without arguments
			token.functor[tokenLib.symbols.conSym] = true;
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, Object.create(token.functor.prototype)));
		},
		newArgs: (tokenLib, queue, block, token) => {
			// NewExpression with arguments
			token.functor[tokenLib.symbols.conSym] = true;
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.functor, Object.create(token.functor.prototype), token.args));
		},
		newMethod: (tokenLib, queue, block, token) => {
			// NewExpression from method without arguments
			token.object[token.property][tokenLib.symbols.conSym] = true;
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], Object.create(token.object[token.property].prototype)));
		},
		newMethodArgs: (tokenLib, queue, block, token) => {
			// NewExpression from method with arguments
			token.object[token.property][tokenLib.symbols.conSym] = true;
			queue.enqueue(new HzFunctor(tokenLib.symbols, token.object[token.property], Object.create(token.object[token.property].prototype), token.args));
		},
		spawn: (tokenLib, queue, block, token) => {
			// SpawnExpression without arguments
			queue.spawn(new HzFunctor(tokenLib.symbols, token.functor));
		},
		spawnArgs: (tokenLib, queue, block, token) => {
			// SpawnExpression with arguments
			queue.spawn(new HzFunctor(tokenLib.symbols, token.functor, null, token.args));
		},
		spawnMethod: (tokenLib, queue, block, token) => {
			// SpawnExpression from method without arguments
			queue.spawn(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object));
		},
		spawnMethodArgs: (tokenLib, queue, block, token) => {
			// SpawnExpression from method with arguments
			queue.spawn(new HzFunctor(tokenLib.symbols, token.object[token.property], token.object, token.args));
		},
		illegalToken: () => {
			throw new TypeError("Illegal Instruction Kernel \"" + token.type + "\"");
		}
	}
	if (additions !== null) return Object.assign(executors, additions);
	return executors;
};