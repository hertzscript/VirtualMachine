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
	// 2 Uniqueness Types: Only 1 instance each per-thread.
	return {
		// Type 1: Invocation Tokens,
		//	Wrap userland functors and any operands needed to invoke them.
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
		// YieldExpression without an argument
		yield: new HzToken("yield"),
		// YieldExpression with an argument
		yieldValue: new HzToken("yieldValue",
			"arg"
		),
		// Indicates an HZ-inserted loop yield
		loopYield: new HzToken("loopYield"),
		symbols: {
			kernSym: kernSym,
			// Property to access a HzFunctor instruction stream
			tokenSym: Symbol("Instruction Token Stream Symbol"),
			// Marks a functor as a generator.
			genSym: Symbol("Generator Symbol"),
			// Marks an object as an iterator
			iterSym: Symbol("Iterator Symbol"),
			// Marks a functor as a subroutine.
			srtSym: Symbol("Subroutine Symbol"),
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