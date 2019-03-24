#!/usr/bin/env node
// Concurrent Hertzscript Velocity REPL
const Dispatcher = require("../src/Dispatcher.js");
const hzCompile = require("hertzscript-compiler");
const term = require("terminal-kit");
const CaptureConsole = require("../src/lib/CaptureConsole.js");
const vm = require("vm");
const fs = require("fs");
const os = require("os");
const context = vm.createContext();
context.console = console;
context.global = global;
const ansiRegexp = /[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))/;
// Input history file size limit
if ("HZREPL_HISTORY_SIZE" in process.env) var historyLimit = Number(process.env.HZREPL_HISTORY_SIZE);
else var historyLimit = 1000;
// Input history file path
if ("HZREPL_HISTORY" in process.env) var historyPath = String(process.env.HZREPL_HISTORY);
else var historyPath = os.homedir() + "/.hertzscript_repl_history";
// Enables input history reading and writing
const writeHistory = historyPath !== "";
var prevHistory = [];
if (writeHistory) {
	if (!fs.existsSync(historyPath)) fs.closeSync(fs.openSync(historyPath, 'w'));
	const history = fs.readFileSync(historyPath).toString();
	if (history.length > 0) prevHistory = history.split("\n");
}
var inputHistory = [].concat(prevHistory);
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
// Draws a box using pipes
function drawBox(height, width, x = 0, y = 0) {
	term.terminal.moveTo(x, y);
	const leftSpaces = new Array(y).fill(" ").join("");
	const horizLine = new Array(width - 2).fill(pipes.horizLine).join("");
	const top = pipes.topLeft + horizLine + pipes.topRight;
	const bot = pipes.botLeft + horizLine + pipes.botRight;
	const middleSpaces = new Array(top.length - 2).fill(" ").join("");
	const middleRow = leftSpaces + pipes.vertLine + middleSpaces + pipes.vertLine + "\n";
	const middle = new Array(height - 1).fill(middleRow).join("");
	return "\n" + leftSpaces + top + "\n" + middle + leftSpaces + bot + "\n";
}
// Screen buffer for the status bar
const statScreenBuffer = new term.ScreenBuffer({
	dst: term.terminal,
	width: process.stdout.columns,
	height: 1,
	x: 1,
	y: 1
});
// Text buffer for the status bar
const statTextBuffer = new term.TextBuffer({
	dst: statScreenBuffer,
	width: process.stdout.columns,
	height: 1,
	x: 0,
	y: 0
});
// Contains all text within the REPL output window
var textLines = [];
// The index to start drawing "textLines" from
var startIndex = 0;
// Draws the status bar across the top of the terminal window
function drawStats() {
	term.terminal.saveCursor();
	if (startIndex === 0) var scrollText = "Scroll: 0% ";
	else var scrollText = "Scroll: " + ((startIndex / textLines.length) * 100).toFixed() + "% ";
	var linesText = " Lines: " + textLines.length;
	var titleText = "HzVelocity REPL | " + hzDisp.queue.blocks.length + " Coroutines " + (paused ? "Paused" : "Running");
	var spacesLen = Number(((process.stdout.columns - (scrollText.length + linesText.length + titleText.length)) / 2).toFixed());
	var spaces = (new Array(spacesLen)).fill(" ").join("");
	var text = linesText + spaces + titleText + spaces + scrollText;
	statTextBuffer.setText(text);
	statTextBuffer.setAttrRegion({
		bgColor: "white",
		color: "black"
	}, {
		xmin: 0,
		xmax: process.stdout.columns,
		ymin: 0,
		ymax: 1
	});
	statTextBuffer.draw();
	statScreenBuffer.draw();
	term.terminal.restoreCursor();
}
// Draw the REPL output window
process.stdout.write(drawBox(process.stdout.rows - 2, process.stdout.columns));
// Inserts newlines to wrap text at a specific width
function wordWrap(str, width) {
	if (str.length <= width) return str;
	var count = 0;
	var newStr = [];
	for (const char of str) {
		count++;
		if (char === "\n") {
			newStr.push(char);
			count = 0;
		} else if (count >= width) {
			newStr.push(char + "\n");
			count = 0;
		} else {
			newStr.push(char);
		}
	}
	return newStr.join("");
}
// Screen buffer for the REPL output window
const logScreenBuffer = new term.ScreenBuffer({
	dst: term.terminal,
	width: process.stdout.columns - 6,
	height: process.stdout.rows - 3,
	x: 3,
	y: 2,
	//delta: true
});
// Text buffer for the REPL output window
const logTextBuffer = new term.TextBuffer({
	dst: logScreenBuffer,
	width: process.stdout.columns - 6,
	height: process.stdout.rows - 3,
	x: 0,
	y: 0,
	wrap: true
});
// Draws text in the REPL output window
function logDraw() {
	term.terminal.saveCursor();
	logTextBuffer.draw();
	logScreenBuffer.draw();
	term.terminal.restoreCursor();
}
// Adds text to the REPL output window
function logText(str) {
	if (str.length === 0) return;
	const strings = wordWrap(str, process.stdout.columns - 6).split("\n");
	for (const string of strings) if (string !== "") textLines.push(string);
	startIndex = textLines.length - (process.stdout.rows - 4);
	if (startIndex < 0) startIndex = 0;
	logTextBuffer.setText(textLines.slice(startIndex).join("\n"));
	logDraw();
}
// Scrolls the REPL output window up or down
function logScroll(offset) {
	const index = startIndex + offset;
	if (index > textLines.length || index < 0) return;
	startIndex = index;
	logTextBuffer.setText(textLines.slice(startIndex).join("\n"));
	logDraw();
}
// Clears all text from the REPL output window
function clearLogText() {
	textLines = [];
	startIndex = 0;
	logTextBuffer.setText("");
	logTextBuffer.moveTo(0, 0);
	logDraw();
}
// Writes input history and terminates the application
function exit() {
	if (writeHistory && inputHistory.length > 0 && inputHistory.length !== prevHistory.length) {
		if (inputHistory.length > historyLimit && historyLimit > 0) inputHistory = inputHistory.slice((inputHistory.length - 1) - (historyLimit - 1));
		if (inputHistory.length > prevHistory.length && prevHistory.length > 0) inputHistory = inputHistory.slice(prevHistory.length);
		if (!fs.existsSync(historyPath)) fs.closeSync(fs.openSync(historyPath, 'w'));
		fs.appendFileSync(historyPath, (prevHistory.length > 0 ? "\n" : "") + inputHistory.join("\n"));
	}
	process.exit(0);
}
// User sent an exit signal as their last action,
// Two successive exit signals trigger "exit()"
var exiting = false;
term.terminal.on("key", (name, data) => {
	if (name === "CTRL_C") {
		// Exit signal
		if (exiting) exit();
		exiting = true;
		logText("(To exit, press ^C again or type .exit)\n");
	} else if (name === "CTRL_P") {
		// Pause all dispatcher execution
		paused ? startExec() : pauseExec();
	} else if (name === "PAGE_DOWN") {
		// Scrolls the REPL output window down by 1 line
		logScroll(1);
		drawStats();
	} else if (name === "PAGE_UP") {
		// Scrolls the REPL output window up by 1 line
		logScroll(-1);
		drawStats();
	}
});
// Captures all console output from code inside the dispatcher
const cConsole = new CaptureConsole();
// Draws captured console output to the REPL output window
function drawCapture() {
	const cBuffer = cConsole.getCapturedText();
	if (cBuffer.length === 0) return;
	for (var str of cBuffer) {
		if (str === "\x1b[0J") clearLogText();
		else logText(str.replace(ansiRegexp, ""));
		drawStats();
	}
	cConsole.clearCapturedText();
}
// Write the input line indicator
term.terminal.nextLine(2);
process.stdout.write("> ");
term.terminal.saveCursor();
var hzDisp = new Dispatcher();
logText("Welcome to the concurrent HertzScript Velocity REPL!\nPress PageUp/PageDown to scroll.\n");
var paused = false;
// Pauses dispatcher execution
function pauseExec() {
	paused = true;
	drawStats();
}
// Starts dispatcher execution
function startExec() {
	paused = false;
	hzDisp.running = true;
	setTimeout(execRunner, 5);
	setTimeout(logRunner, 5);
	drawStats();
}
// Draws captured console output to the REPL output window every 5ms
const logRunner = () => {
	drawCapture();
	if (!paused) setTimeout(logRunner, 5);
};
// Executes the dispatcher for 1ms every 5ms
const execRunner = () => {
	cConsole.startCapture();
	hzDisp.cycle(1);
	cConsole.stopCapture();
	if (hzDisp.running && !paused) setTimeout(execRunner, 5);
};
// Handles user input source code from the main input line
const inputHandler = (error, input) => {
	if (error) throw error;
	logText("> " + input);
	// Ignore whitespace
	if (!(/\S/.test(input))) {
		inputField();
		term.terminal.restoreCursor();
		return;
	}
	term.terminal.eraseLine();
	if (input === ".exit") exit();
	if (inputHistory[inputHistory.length - 1] !== input) inputHistory.push(input);
	// Interrupt a prior exit signal
	exiting = false;
	process.stdout.write("⌛");
	try {
		// Compile the source code into a HertzScript Module
		const hzModule = new vm.Script("(hzUserLib => { return " + hzCompile("(function (){" + input + "})", false, false, true) + "});");
		// Import the HzModule into the dispatcher
		hzDisp.import(hzModule.runInContext(context));
		// Start execution of the dispatcher if it's not paused or running
		if (!hzDisp.running && !paused) startExec();
	} catch (error) {
		cConsole.startCapture();
		console.error(error);
		cConsole.stopCapture();
		drawCapture();
	}
	term.terminal.eraseLine();
	term.terminal.left(input.length + 4);
	process.stdout.write("> ");
	drawStats();
	inputField();
};
const fieldOptions = {
	cancelable: true,
	history: inputHistory,
	cursorPosition: -1
};
// Readies the user input line for input
const inputField = () => {
	term.terminal.inputField(fieldOptions, inputHandler);
};
drawStats();
inputField();