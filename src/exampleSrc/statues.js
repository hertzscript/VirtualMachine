function Curator(channel) {
	channel.write("Wait...");
	this.redLight = () => channel.write("Red Light!");
	this.greenLight = () => channel.write("Green Light!");
	this.quit = () => channel.write("Quit!");
}

function player(name, channel) {
	const reader = new Channel.Reader(channel);
	var lastCommand = "";
	// Loop forever!
	while (true) {
		const command = reader.read();
		if (command && command !== lastCommand) {
			console.log(name + ": " + command);
			if (command === "Quit!") break;
			lastCommand = command;
		}
	}
}

const Channel = require("./Channel.js");
const channel = new Channel("string");
const curator = new Curator(channel);

spawn player("Player 1", channel);
spawn player("Player 2", channel);

curator.redLight();
curator.greenLight();
curator.redLight();
curator.greenLight();
curator.quit();