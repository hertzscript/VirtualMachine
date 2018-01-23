const GeneratorFunction = (function* () { }).constructor;
const HzCompiler = function (parser = ES5Parser) {
	this.parser = parser;
}
HzScript.searchAst = function (ast, callback, bfs = true) {
	var node;
	const nodes = [...ast.body];
	while (nodes.length > 0) {
		node = nodes[bfs ? "shift" : "pop"]();
		callback(node);
		if ("body" in node) {
			if (node.body.type === "BlockStatement" || node.body.type === "Expression") {
				//TODO: Finish search algorithm
			}

		}
	}
};
HzScript.optimizeNode = function (node) {
	//TODO: Fill these in with replacement nodes.
	if (node.type === "Expression") {

	} else if (node.type === "ThisExpression") {

	} else if (node.type === "CallExpression") {

	} else if (node.type === "FunctionExpression") {

	} else if (node.type === "SequenceExpression") {

	} else if (node.type === "UnaryExpression") {

	} else if (node.type === "ConditionalExpression") {

	} else if (node.type === "AssignmentExpression") {


	} else if (node.type === "Declaration") {

	} else if (node.type === "VariableDeclaration") {

	} else if (node.type === "VariableDeclarator") {

	} else if (node.type === "FunctionDeclaration") {


	} else if (node.type === "BlockStatement") {

	} else if (node.type === "ExpressionStatement") {

	} else if (node.type === "IfStatement") {

	} else if (node.type === "LabeledStatement") {

	} else if (node.type === "SwitchStatement") {

	} else if (node.type === "ReturnStatement") {

	} else if (node.type === "ForStatement") {

	} else if (node.type === "ForOfStatement") {

	} else if (node.type === "ForInStatement") {

	} else if (node.type === "WhileStatement") {

	} else if (node.type === "DoWhileStatement") {

	}
}
HzScript.compile = function (source, wrap = true) {
	if ((typeof source) !== "string") {
		throw new TypeError("Argument 1 must be a String.");
	}
	if (source.length === 0) {
		throw new Error("Empty source string. Aborting compilation.");
	}
	const ast = jsParser.parse(source);
	this.searchAst(ast, this.optimizeNode);
	//TODO: Render back to source code.
	const compiledSource = notRealRenderer(ast);
	if (wrap) {
		compiledSource = "function* window(...args) {" + compiledSource + "}";
	}
	return compiledSource;
};
HzScript.hotCompile = function (args, source = null) {
	if (source === null) {
		source = args;
		args = [];
	} else {
		if ((typeof args) === "object") {
			if (!Array.isArray(args)) {
				args = Object.keys(args);
			} else {
				throw new TypeError("Argument 1 must be an Object, Array, or String.");
			}
		}
	}
	return new GeneratorFunction(args, HzScript.compile(source, false));
};
if (module !== undefined) {
	module.exports = HzScript;
}