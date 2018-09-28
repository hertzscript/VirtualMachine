const fs = require('fs');
const babel = require('babel-core');
const hzPlugin = require('./plugin.js');

// read the filename from the command line arguments
var fileName = process.argv[2];
console.log("Opening " + fileName + " for compilation.");

// read the code from this file
fs.readFile(fileName, function (err, data) {
	if (err) throw err;

	// convert from a buffer to a string
	var src = data.toString();

	// use our plugin to transform the source
	var out = babel.transform(src, {
		plugins: [hzPlugin]
	});

	// print the generated code to screen
	fs.writeFile("./testOutput.hz.js", out.code, function (error) {
		if (error) throw error;
		console.log("Compilation complete!");
	});
});

/*
// TODO: Remove/replace accordingly the below
HzScript.compile = function (source, args, wrap = true, callback = "null") {
	if ((typeof source) !== "string") {
		throw new TypeError("Argument 1 must be a String.");
	}
	if (source.length === 0) {
		throw new Error("Empty source string. Aborting compilation.");
	}
	//TODO: Do babel transform here
	//TODO: Render back to source code.
	if (wrap) {
		compiledSource = "function* main(" + args !== null ? args.join(",") : "" + callback !== null ? "__HZSCRIPT_ENV_YIELD__, " : "" + ") {" + compiledSource + "}";
	}
	return compiledSource;
};
HzScript.hotCompile = function (source, args, yieldCallback = null) {
	if (args !== null && (typeof args) === "object") {
		if (!Array.isArray(args)) {
			args = Object.keys(args);
		}
	} else if (args !== null) {
		throw new TypeError("Argument 1 must be an Object, Array, or String.");
	} else {
		args = [];
	}
	if (yieldCallback !== null) {
		if ((typeof yieldCallback) !== "function") {
			throw new TypeError("Argument 3 must be a Functon or null.");
		}
		args.push("__HZSCRIPT_ENV_YIELD__");
	}
	return new GeneratorFunction(args, HzScript.compile(source, null, false));
};
*/