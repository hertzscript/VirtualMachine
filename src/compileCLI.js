const fs = require('fs');
const hzCompile = require('./compile.js');
const fileName = process.argv[2];
console.log("Opening " + fileName + " for compilation.");
fs.readFile(fileName, function (err, buffer) {
	if (err) throw err;
	fs.writeFile("./testOutput.hz.js", hzCompile(buffer.toString()).code, function (error) {
		if (error) throw error;
		console.log("Compilation complete!");
	});
});