const Kernelizer = require("./Kernelizer.js");
// Marks an object as an HzToken
const kernSym = Symbol("Kernelization Marker Symbol");
// HzTokens are unique single-instance objects for wrapping user instructions and data
function HzToken(type, ...argsArray) {
	const kern = new Kernelizer(...argsArray);
	kern.type = type;
	kern[kernSym] = true;
	return kern;
}
// Instruction Token library
function TokenLib() {
	return {
		// Returns true if a value is wrapped in a Kernelizer
		isKernelized: input => ((typeof input) === "object") && (kernSym in input),
		// 2 Uniqueness Types: Only 1 instance each per-thread.
		// Type 1: Invocation Tokens,
		//	Wrap userland functors and any operands needed to invoke them.
		tokens: {
			// Function call without arguments
			call: new HzToken("call",
				"functor",
				"isTailCall"
			),
			// Function call with arguments
			callArgs: new HzToken("callArgs",
				"functor",
				"args",
				"isTailCall"
			),
			// Method call without arguments
			callMethod: new HzToken("callMethod",
				"object",
				"property",
				"isTailCall"
			),
			// Method call with arguments
			callMethodArgs: new HzToken("callMethodArgs",
				"object",
				"property",
				"args",
				"isTailCall"
			),
			// NewExpression without arguments
			new: new HzToken("new",
				"functor"
			),
			// NewExpression with arguments
			newArgs: new HzToken("newArgs",
				"functor",
				"args"
			),
			// NewExpression from method without arguments
			newMethod: new HzToken("newMethod",
				"object",
				"property"
			),
			// NewExpression from method with arguments
			newMethodArgs: new HzToken("newMethodArgs",
				"object",
				"property",
				"args"
			),
			// SpawnExpression without arguments
			spawn: new HzToken("spawn",
				"functor"
			),
			// SpawnExpression with arguments
			spawnArgs: new HzToken("spawnArgs",
				"functor",
				"args"
			),
			// SpawnExpression from method without arguments
			spawnMethod: new HzToken("spawnMethod",
				"object",
				"property"
			),
			// SpawnExpression from method with arguments
			spawnMethodArgs: new HzToken("spawnMethodArgs",
				"object",
				"property",
				"args"
			),
			// Type 2: Data Tokens,
			//	Wrap arbitrary userland datum when returning or yielding.
			// ReturnStatement without an argument
			return: new HzToken("return"),
			// ReturnStatement with an argument
			returnValue: new HzToken("returnValue",
				"arg"
			),
			// YieldExpression without an argument (state object)
			yield: new HzToken("yield",
				"arg"
			),
			// YieldExpression with an argument (state object)
			yieldValue: new HzToken("yieldValue",
				"arg",
				"delegate"
			),
			// Remit to the caller of the Dispatcher without an argument
			remit: new HzToken("remit"),
			// Remit to the caller of the Dispatcher with an argument
			remitValue: new HzToken("remitValue",
				"arg"
			),
			// Indicates an HZ-inserted loop yield
			loopYield: new HzToken("loopYield"),
		},
		symbols: {
			kernSym: kernSym,
			// Property to access a HzFunctor instruction stream
			tokenSym: Symbol("Instruction Token Stream Symbol"),
			// Marks a functor as a generator.
			genSym: Symbol("Generator Symbol"),
			// Marks an object as an iterator
			iterSym: Symbol("Iterator Symbol"),
			// Marks a functor as a coroutine.
			crtSym: Symbol("Coroutine Symbol"),
			// Marks a functor as a constructor
			conSym: Symbol("Constructor Symbol"),
			// Proprietary Null. Builtin null considered userland datum.
			nullSym: Symbol("Null Value Symbol")
		}
	};
}
module.exports = TokenLib;