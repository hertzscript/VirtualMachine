const fs = require('fs');
const babel = require('babel-core');
const hzPlugin = require('./Plugin.js');
module.exports = function hzCompile(source) {
	const output = babel.transform(source, {
		plugins: [hzPlugin],
		comments: false
	});
	const header = fs.readFileSync("./header.js").toString();
	output.code = header + output.code;
	return output;
};