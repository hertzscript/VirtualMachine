const testClass = function () {
	this.prop = "Hello World!";
	this.arrow = () => console.log(this.prop);
	this.random = Math.random();
}
testClass.prototype.test = function () {
	console.log(this.random);
}
const test = new testClass();
test.test();
test.arrow();