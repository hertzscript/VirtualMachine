module.exports = function program() {
	function genNumber() {
		return Math.random().toFixed();
	}
	function* genNumberIterator() {
		while (true) yield genNumber();
	}
	function add(num1, num2) {
		return num1 + num2;
	}
	const numIterator = genNumberIterator();
	console.log(add(numIterator.next().value, numIterator.next().value));
};