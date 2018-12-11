const fs = require('fs');
const { join } = require('path');
const babel = require('babel-core');
const hzBabelPlugin = require('./BabelPlugin.js');
const compileSpawn = require("./compileSpawn.js");
module.exports = function hzCompile(source, mod = false, standalone = false, spawn = false) {
	if (spawn) {
		source = compileSpawn(source);
	}
	const output = babel.transform(source, {
		plugins: [hzBabelPlugin],
		comments: false
	});
	if (standalone) {
		const header = fs.readFileSync(join(__dirname, "header.js"), 'utf8');
		output.code = header + "hzDisp.import(function(hzDisp, hzUserLib, hzTknLib){return hzDisp.createCoroutine(function*(){" + output.code + "});});hzDisp.runComplete();";
	} else if (mod) {
		output.code = "module.exports = function(hzDisp,hzUserLib,hzTknLib){return hzDisp.createCoroutine(function*(){" + output.code + "});};";
	}
	return output.code;
};