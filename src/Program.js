function Program(functor, thisArg = null, args = null) {
	this.type = "unknown";
	this.image = functor;
	this.thisArg = thisArg;
	this.args = args;
	this.instance = null;
}
Program.prototype.init = function (thisArg = null, args = null) {
	if (thisArg === null) {
		if (args === null) return this.image();
		else return this.image(...args);
	} else {
		if (args === null) return this.image.call(thisArg);
		else return this.image.apply(thisArg, args);
	}
	if (this.type === "generator") return initState;
	else this.instance = initState;
};
Program.prototype.throw = function (error) {
	if (this.instance !== null) return this.instance.throw(error);
	else throw error;
};
Program.prototype.return = function() {
	if (this.instance !== null) this.instance.return();
};
Program.prototype.call = function (nextValue) {
	if (this.type.generator) return this.init();
	if (this.instance === null) {
		if (this.type === "generator") return this.init(this.thisArg, this.args);
		else this.instance = this.init();
	}
	return this.instance.next(nextValue);
};
module.exports = Program;