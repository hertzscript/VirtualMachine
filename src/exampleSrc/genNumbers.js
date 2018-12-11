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
	const id = ++counter;
	const numIterator = genNumberIterator();
	console.log("Generating 10 random numbers...");
	for (var loc = 0; loc < 10; loc++) {
		console.log("Coroutine " + id + " says: " + add(numIterator.next().value, numIterator.next().value));
	}
}
spawn logNumbers();
spawn logNumbers();
spawn logNumbers();