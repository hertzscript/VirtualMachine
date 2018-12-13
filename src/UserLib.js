function UserLib(tokenLib, detourLib) {
	for (const name in tokenLib) this[name] = (...args) => tokenLib[name].set(args);
	for (const name in detourLib) this[name] = (...args) => detourLib[name](...args);
}
module.exports = UserLib;