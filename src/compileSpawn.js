const acorn = require("acorn");
const acornWalk = require("acorn-walk");
acornWalk.base.SpawnExpression = acornWalk.base.YieldExpression;
const escodegen = require("escodegen");
const hzAcornPlugin = require("./AcornPlugin.js");
const hzAcorn = acorn.Parser.extend(hzAcornPlugin);
module.exports = function (source) {
	const ast = hzAcorn.parse(source);
	acornWalk.simple(ast, {
		SpawnExpression: function (node) {
			node.type = "CallExpression";
			node.callee = {
				"type": "MemberExpression",
				"object": {
					"type": "Identifier",
					"name": "hzUserLib"
				},
				"property": {
					"type": "Identifier",
					"name": "spawn"
				},
				"computed": false
			};
			node.arguments = [node.argument];
		}
	});
	//console.log(JSON.stringify(ast, null, "\t"));
	// Acorn AST is not compatible with Babel AST, so we need to give source code to Babel
	return escodegen.generate(ast);
};