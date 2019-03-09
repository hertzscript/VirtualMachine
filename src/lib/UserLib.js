function UserLib(tokenLib, detourLib) {
	for (const name in tokenLib.tokens) this[name] = (...args) => tokenLib.tokens[name].set(args);
	this.return = tokenLib.tokens.return;
	this.remit = tokenLib.tokens.remit;
	this.loopYield = tokenLib.tokens.loopYield;
	for (const name in detourLib) this[name] = (...args) => detourLib[name](...args);
}
module.exports = UserLib;