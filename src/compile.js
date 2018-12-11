const fs = require('fs');
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
	if (standalone && !mod) {
		const header = fs.readFileSync("./header.js").toString();
		output.code = header + "hzDisp.import(function(hzDisp, hzUserLib, hzTknLib){return hzDisp.createCoroutine(function*(){" + output.code + "});});hzDisp.runComplete();";
	} else if (mod && !standalone) {
		output.code = "module.exports = function(hzDisp,hzUserLib,hzTknLib){return hzDisp.createCoroutine(function*(){" + output.code + "});};";
	}
	return output.code;
};