const helpers = require("./helpers.js");
module.exports = function (babel) {
	const visitor = {
		"Expression": {
			enter: function (path) {


			}
		},
		"ThisExpression": {
			enter: function (path) {


			}
		},
		"CallExpression": {
			enter: function (path) {


			}
		},
		"FunctionExpression": {
			enter: function (path) {
				path.node.generator = true;
				
			}
		},
		"SequenceExpression": {
			enter: function (path) {


			}
		},
		"UnaryExpression": {
			enter: function (path) {


			}
		},
		"ConditionalExpression": {
			enter: function (path) {


			}
		},
		"AssignmentExpression": {
			enter: function (path) {


			}
		},
		"Declaration": {
			enter: function (path) {


			}
		},
		"VariableDeclaration": {
			enter: function (path) {


			}
		},
		"VariableDeclarator": {
			enter: function (path) {


			}
		},
		"FunctionDeclaration": {
			enter: function (path) {


			}
		},
		"BlockStatement": {
			enter: function (path) {


			}
		},
		"ExpressionStatement": {
			enter: function (path) {


			}
		},
		"IfStatement": {
			enter: function (path) {


			}
		},
		"LabeledStatement": {
			enter: function (path) {


			}
		},
		"SwitchStatement": {
			enter: function (path) {


			}
		},
		"ReturnStatement": {
			enter: function (path) {


			}
		},
		"ForStatement": {
			enter: function (path) {


			}
		},
		"ForOfStatement": {
			enter: function (path) {


			}
		},
		"ForInStatement": {
			enter: function (path) {


			}
		},
		"WhileStatement": {
			enter: function (path) {


			}
		},
		"DoWhileStatement": {
			enter: function (path) {


			}
		}
	};
	return { visitor: visitor };
};

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