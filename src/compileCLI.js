#!/usr/bin/env node
const fs = require('fs');
const hzCompile = require('./compile.js');
const cliParser = require("command-line-args");
const cliOptions = [
	{ name: "standalone", alias: "s", type: Boolean },
	{ name: "module", alias: "m", type: Boolean },
	{ name: "output", alias: "o", type: String },
	{ name: "input", alias: "i", type: String },
	{ name: "spawn", type: Boolean}
];
const args = cliParser(cliOptions);
if (!("standalone" in args)) args.standalone = false;
if (!("module" in args)) args.module = false;
if (!("output" in args)) args.output = null;
if (!("input" in args)) args.input = null;
if (!("spawn" in args)) args.spawn = false;
function inputSource(input, callback) {
	fs.readFile(input, function (error, buffer) {
		if (error) throw error;
		callback(buffer.toString());
	});
}
function stdInSource(callback) {
	var source = "";
	process.stdin.on("data", chunk => {
		source += chunk;
	});
	process.stdin.on("end", function () {
		callback(source);
	});
}
function outputCode(output, code) {
	console.log("Writing compiled file to " + output);
	fs.writeFile(output, code, function (error) {
		if (error) throw error;
		console.log("Compilation complete!");
	});
}
function stdOutCode(code) {
	process.stdout.write(code + "\n");
}
function compile(source) {
	const code = hzCompile(source, args.module, args.standalone, args.spawn);
	if (args.output !== null) {
		outputCode(args.output, code);
	} else {
		stdOutCode(code);
	}
}
if (args.input !== null) {
	if (args.output !== null) console.log("Opening " + args.input + " for compilation.");
	inputSource(args.input, compile);
} else {
	stdInSource(compile);
}