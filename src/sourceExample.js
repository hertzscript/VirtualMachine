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
	//spawn function() { }; // keyword functionExpression
	//spawn async (hello, world) => {}; // keyword keyword arrowFunctionExpression
	//spawn hello => {}; // keyword arrowFunctionExpression
	//spawn (hello, world) => {}; // keyword arrowFunctionExpression
};