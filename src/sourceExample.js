module.exports = function testProgram() {
	/*
	function* myGenerator() {
		yield 123;
		return 456;
	}
	const iter = myGenerator();
	console.log("\x1b[31m%s\x1b[0m", iter.next().value);
	
	console.log("Hello World");
	
	function genNumber() {
		return Math.random().toString().substring(2);
	}
	function* genNumberIterator() {
		while (true) yield genNumber();
	}
	function add(num1, num2) {
		return num1 + num2;
	}
	const numIterator = genNumberIterator();
	console.log("Generating 10 random numbers...");
	for (var loc = 0; loc < 10; loc++) console.log(add(numIterator.next().value, numIterator.next().value));
	function testSpawn() {
		console.log("Spawned!");
	}
	*/
	spawn("test"); // identifier
	var spawn = 123; // identifier
	var spawn; // identifier
	spawn = 123; //identifier
	spawn thing; // keyword
	spawn function() { }; // keyword
	spawn(hello, world) => { };// keyword
};