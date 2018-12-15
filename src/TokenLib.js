const Kernelizer = require("./Kernelizer.js");
// HzTokens are unique single-instance objects for wrapping user instructions and data
const kernSym = Symbol("Kernelization Marker Symbol");
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
		call: new HzToken("call",
			"functor"
		),
		callArgs: new HzToken("callArgs",
			"functor",
			"args"
		),
		callMethod: new HzToken("callMethod",
			"object",
			"property"
		),
		callMethodArgs: new HzToken("callMethodArgs",
			"object",
			"property",
			"args"
		),
		new: new HzToken("new",
			"functor"
		),
		newArgs: new HzToken("newArgs",
			"functor",
			"args"
		),
		newMethod: new HzToken("newMethod",
			"object",
			"property"
		),
		newMethodArgs: new HzToken("newMethodArgs",
			"object",
			"property",
			"args"
		),
		// Type 2: Data Tokens,
		//	Wrap arbitrary userland datum when returning or yielding.
		return: new HzToken("return"),
		returnValue: new HzToken("returnValue",
			"arg"
		),
		yield: new HzToken("yield"),
		yieldValue: new HzToken("yieldValue",
			"arg"
		),
		spawn: new HzToken("spawn",
			"functor"
		),
		spawnArgs: new HzToken("spawnArgs",
			"functor",
			"args"
		),
		spawnMethod: new HzToken("spawnMethod",
			"object",
			"property"
		),
		spawnMethodArgs: new HzToken("spawnMethodArgs",
			"object",
			"property",
			"args"
		),
		// Indicates an HZ-inserted loop yield
		loopYield: new HzToken("loopYield"),
		symbols: {
			kernSym: kernSym,
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