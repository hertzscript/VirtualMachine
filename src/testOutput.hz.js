function* test() {
	yield hzDisp.yieldValue((yield hzDisp.call(test, [[1]])));
}