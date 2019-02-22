function UserLib(tokenLib, detourLib) {
	for (const name in tokenLib.tokens) this[name] = (...args) => tokenLib.tokens[name].set(args);
	for (const name in detourLib) this[name] = (...args) => detourLib[name](...args);
}
module.exports = UserLib;