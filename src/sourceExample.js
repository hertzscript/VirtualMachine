module.exports = function testProgram() {
	const performance = require("perf_hooks").performance;
	function sleep(ms) {
		const end = performance.now() + ms;
		console.log("Beginning to sleep for " + ms + "ms");
		while (performance.now() < end);
	}
	function sleepAndSay(message, ms) {
		sleep(ms);
		console.log(message);
	}
	spawn sleepAndSay("Hello World 1000ms", 5000);
	spawn sleepAndSay("Hello World 500ms", 500);
	/*
	const testClass = function () {
		this.prop = "Hello World!";
		this.arrow = () => console.log(this.prop);
	}
	testClass.prototype.test = function () {
		console.log(this.prop);
	}
	const test = new testClass();
	test.test();
	test.arrow();
	*/
	/*
	function* myGenerator() {
		yield 123;
		return 456;
	}
	const iter = myGenerator();
	console.log("\x1b[31m%s\x1b[0m", iter.next().value);

	console.log("Hello World");
	*/
	/*
	function genNumber() {
		return Math.random().toString().substring(2);
	}
	function* genNumberIterator() {
		while (true) yield genNumber();
	}
	function add(num1, num2) {
		return num1 + num2;
	}
	var counter = 0;
	function logNumbers() {
		const id = counter + 1;
		counter++;
		const numIterator = genNumberIterator();
		console.log("Generating 10 random numbers...");
		for (var loc = 0; loc < 10; loc++) console.log("Coroutine " + id + " says: " + add(numIterator.next().value, numIterator.next().value));
	}
	spawn logNumbers();
	spawn logNumbers();
	spawn logNumbers();
	*/
	/*
	spawn("test"); // callExpression
	spawn     ("test"); // callExpression
	thing.spawn("test"); // callExpression (memberExpression)
	spawn.thing("test"); // callExpression (memberExpression)
	var spawn = 123; // declaration identifier assignment
	var spawn; // declaration identifier
	spawn = 123; // identifier assignment
	spawn thing; // keyword identifier
	spawn thing(); // keyword callExpression
	spawn thing("test"); // keyword callExpression
	spawn obj.thing(); // keyword callExpression (memberExpression)
	spawn obj.thing("test"); // keyword callExpression (memberExpression)
	*/
	//spawn function() { }; // keyword functionExpression
	//spawn async (hello, world) => {}; // keyword keyword arrowFunctionExpression
	//spawn hello => {}; // keyword arrowFunctionExpression
	//spawn (hello, world) => {}; // keyword arrowFunctionExpression
};