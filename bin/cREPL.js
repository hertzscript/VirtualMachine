// Concurrent REPL
const Dispatcher = require("../src/Dispatcher.js");
const hzCompile = require("hertzscript-compiler");
const term = require("terminal-kit");
const CaptureConsole = require("@aoberoi/capture-console").CaptureConsole;

const pipes = {
	vertLine: "│",
	horizLine: "─",
	cross: "┼",
	topRight: "┐",
	topLeft: "┌",
	botRight: "┘",
	botLeft: "└",
	topT: "┬",
	botT: "┴",
	leftT: "├",
	rightT: "┤"
};

function drawBox(height, width) {
	const horizLine = new Array(width - 2).fill(pipes.horizLine).join("");
	const top = "  " + pipes.topLeft + horizLine + pipes.topRight;
	const bot = "  " + pipes.botLeft + horizLine + pipes.botRight;
	const spaces = new Array(top.length - 4).fill(" ").join("");
	const middleRow = "  " + pipes.vertLine + spaces + pipes.vertLine + "\n";
	const middle = new Array(height - 2).fill(middleRow).join("");
	process.stdout.write("\n" + top + "\n" + middle + bot + "\n");
}
drawBox(process.stdout.rows - 2, process.stdout.columns - 4);

/*
var timeoutID = null;
process.stdout.on("resize", () => {
	if (timeoutID !== null) {
		clearTimeout(timeoutID);
	}
	timeoutID = setTimeout(() => drawBox(process.stdout.rows, process.stdout.columns), 1000);
});
*/

const screenBuffer = new term.ScreenBuffer({
	dst: term.terminal,
	width: process.stdout.columns - 6,
	height: process.stdout.rows - 4,
	x: 4,
	y: 3,
	delta: true

});
const textBuffer = new term.TextBuffer({
	dst: screenBuffer,
	width: process.stdout.columns - 6,
	height: process.stdout.rows - 4,
	x: 0,
	y: 0,
	wrap: true
});
var hzDisp = new Dispatcher();
textBuffer.insert("Loaded hertzscript-dispatcher v0.0.1\n");
textBuffer.insert("Welcome to the concurrent HertzScript REPL!\n");
textBuffer.moveTo(4, 3);
textBuffer.draw({wrap: true});
screenBuffer.moveTo(4, 3);
screenBuffer.draw();

const cConsole = new CaptureConsole();
var hzDisp = new Dispatcher();
term.terminal.nextLine(2);
process.stdout.write("> ");
term.terminal.saveCursor();
const inputHistory = [];
const asyncRunner = () => {
	cConsole.startCapture();
	try {
		hzDisp.runSync(null);

	} catch (error) {
		console.error(error);
		hzDisp = new Dispatcher();
	}
	cConsole.stopCapture();
	if (!hzDisp.running) return;
	setTimeout(asyncRunner, 30);
};
const inputHandler = () => {
	const ngEvent = term.terminal.inputField({
		cancelable: true,
		history: inputHistory,
		cursorPosition: -1
	}, (error, input) => {
		if (error) throw error;
		term.terminal.eraseLine();
		term.terminal.restoreCursor();
		process.stdout.write("⌛");
		try {
			const hzModule = new Function(
				"hzUserLib",
				"return " + hzCompile("(function (){" + input + "})", false, false, true) + ";"
			);
			hzDisp.import(hzModule);
			if (!hzDisp.running) setTimeout(asyncRunner, 30);
		} catch (error) {
			cConsole.startCapture();
			console.error(error);
			cConsole.stopCapture();
		}
		term.terminal.eraseLine();
		term.terminal.restoreCursor();
		term.terminal.left(2);
		process.stdout.write("> ");
		inputHandler();
	});
};
inputHandler();

setInterval(() => {
	const cBuffer = cConsole.getCapturedText();
	if (cBuffer.length === 0) return;
	for (const str of cBuffer) textBuffer.insert(str + "\n");
	cConsole.clearCaptureText();
	textBuffer.draw({ wrap: true });
	screenBuffer.draw();
	term.terminal.restoreCursor();
}, 500);