const Channel = require("./Channel.js");
// Create a new Channel of type "number"
const ch = new Channel("number");

// Start a new Coroutine
function func() {
	// Send 42 to channel
	ch.write(42);
}
spawn func();

// Create a new Channel Reader
const reader = new Channel.Reader(ch);

// Read from channel
console.log(reader.read());