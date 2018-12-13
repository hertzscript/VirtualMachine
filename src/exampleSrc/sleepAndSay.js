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
spawn sleepAndSay("Hello World 5000ms", 5000);
spawn sleepAndSay("Hello World 500ms", 500);