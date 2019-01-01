// Concurrent REPL
const Dispatcher = require("../src/Dispatcher.js");
const hzCompile = require("hertzscript-compiler");
const term = require("terminal-kit");
const CaptureConsole = require("../src/lib/CaptureConsole.js");
const fs = require("fs");
const os = require("os");
const ansiRegexp = /[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))/;
if ("HZREPL_HISTORY_SIZE" in process.env) var historyLimit = Number(process.env.HZREPL_HISTORY_SIZE);
else var historyLimit = 1000;
if ("HZREPL_HISTORY" in process.env) var historyPath = process.env.HZREPL_HISTORY;
else var historyPath = os.homedir() + "/.hertzscript_repl_history";
const writeHistory = historyPath !== "";
if (writeHistory && !fs.existsSync(historyPath)) fs.closeSync(fs.openSync(historyPath, 'w'));
if (writeHistory) var historyJSON = fs.readFileSync(historyPath);
if (writeHistory && historyJSON.length > 0) var prevInputHistory = JSON.parse(historyJSON);
else var prevInputHistory = null;
if (prevInputHistory !== null) var inputHistory = prevInputHistory;
else var inputHistory = [];
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
const statScreenBuffer = new term.ScreenBuffer({
	dst: term.terminal,
	width: process.stdout.columns,
	height: 1,
	x: 1,
	y: 1
});
const statTextBuffer = new term.TextBuffer({
	dst: statScreenBuffer,
	width: process.stdout.columns,
	height: 1,
	x: 0,
	y: 0
});
var textLines = [];
var startIndex = 0;
function drawStats() {
	if (startIndex === 0) var scrollText = "Scroll: 0% ";
	else var scrollText = "Scroll: " + ((startIndex / textLines.length) * 100).toFixed() + "% ";
	var linesText = " Lines: " + textLines.length;
	var titleText = "HzVelocity REPL | " + hzDisp.blocks.length + " Coroutines Running";
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
process.stdout.write(drawBox(process.stdout.rows - 2, process.stdout.columns));
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
const logScreenBuffer = new term.ScreenBuffer({
	dst: term.terminal,
	width: process.stdout.columns - 6,
	height: process.stdout.rows - 3,
	x: 3,
	y: 2,
	//delta: true
});
const logTextBuffer = new term.TextBuffer({
	dst: logScreenBuffer,
	width: process.stdout.columns - 6,
	height: process.stdout.rows - 3,
	x: 0,
	y: 0,
	wrap: true
});
function logDraw() {
	logTextBuffer.draw();
	logScreenBuffer.draw();
	term.terminal.restoreCursor();
}
function logText(str) {
	if (str.length === 0) return;
	const strings = wordWrap(str, process.stdout.columns - 6).split("\n");
	for (const string of strings) if (string !== "") textLines.push(string);
	startIndex = textLines.length - (process.stdout.rows - 4);
	if (startIndex < 0) startIndex = 0;
	logTextBuffer.setText(textLines.slice(startIndex).join("\n"));
	logDraw();
}
function logScroll(offset) {
	const index = startIndex + offset;
	if (index > textLines.length || index < 0) return;
	startIndex = index;
	logTextBuffer.setText(textLines.slice(startIndex).join("\n"));
	logDraw();
}
function clearLogText() {
	textLines = [];
	startIndex = 0;
	logTextBuffer.setText("");
	logTextBuffer.moveTo(0, 0);
	logDraw();
}
function exit() {
	if (writeHistory) {
		if (inputHistory.length > historyLimit && historyLimit > 0) inputHistory = inputHistory.splice((inputHistory.length - 1) - historyLimit);
		fs.writeFileSync(historyPath, JSON.stringify(inputHistory));
	}
	process.exit(0);
}
var exiting = false;
term.terminal.on("key", (name, data) => {
	if (name === "CTRL_C") {
		if (exiting) exit();
		exiting = true;
		logText("(To exit, press ^C again or type .exit)\n");
	} else if (name === "CTRL_S") {

	} else if (name === "PAGE_DOWN") {
		logScroll(1);
		drawStats();
	} else if (name === "PAGE_UP") {
		logScroll(-1);
		drawStats();
	}
});
const cConsole = new CaptureConsole();
function drawCapture() {
	const cBuffer = cConsole.getCapturedText();
	if (cBuffer.length === 0) return;
	for (var str of cBuffer) {
		if (str === "\x1b[0J") {
			clearLogText();
			drawStats();
		} else {
			logText(str.replace(ansiRegexp, ""));
			drawStats();
		}
	}
	cConsole.clearCaptureText();
}
term.terminal.nextLine(2);
process.stdout.write("> ");
term.terminal.saveCursor();
var hzDisp = new Dispatcher();
logText("Loaded hertzscript-dispatcher v0.0.1\n\
Welcome to the concurrent HertzScript-Velocity REPL!\n\
Press PageUp/PageDown to scroll.\n\
");
const asyncRunner = () => {
	cConsole.startCapture();
	try {
		hzDisp.runSync(30);
	} catch (error) {
		console.error(error);
		hzDisp = new Dispatcher();
	}
	cConsole.stopCapture();
	drawCapture();
	if (!hzDisp.running) return;
	setTimeout(asyncRunner, 100);
};
const inputHandler = () => {
	term.terminal.inputField({
		cancelable: true,
		history: inputHistory,
		cursorPosition: -1
	}, (error, input) => {
		if (error) throw error;
		if (!(/\S/.test(input))) {
			inputHandler();
			term.terminal.restoreCursor();
			return;
		}
		term.terminal.eraseLine();
		if (input === ".exit") exit();
		if (inputHistory[inputHistory.length - 1] !== input) inputHistory.push(input);
		// Interrupt a prior 1x ^C
		exiting = false;
		term.terminal.restoreCursor();
		process.stdout.write("⌛");
		try {
			const hzModule = new Function(
				'exports',
				'require',
				'module',
				'__filename',
				'__dirname',
				"return hzUserLib => { return " + hzCompile("(function (){" + input + "})", false, false, true) + "};"
			);
			hzDisp.import(hzModule(exports, require, module, __filename, __dirname));
			if (!hzDisp.running) setTimeout(asyncRunner, 30);
		} catch (error) {
			logText(error);
		}
		drawStats();
		term.terminal.eraseLine();
		term.terminal.restoreCursor();
		term.terminal.left(2);
		process.stdout.write("> ");
		inputHandler();
	});
};
drawStats();
inputHandler();