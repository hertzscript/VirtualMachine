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
		spawnArgs: new HzToken("spawn",
			"functor",
			"args"
		),
		spawnMethod: new HzToken("spawn",
			"object",
			"property"
		),
		spawnMethodArgs: new HzToken("spawn",
			"object",
			"property",
			"args"
		),
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
			// Proprietary Null. Builtin null considered userland datum.
			nullSym: Symbol("Null Value Symbol")
		}
	};
}
module.exports = TokenLib;