const YIELD_COND_CALLBACK = {
	type: "IfStatement",
	test: {
		type: "CallExpression",
		callee: {
			type: "Identifier",
			name: "__HZSRIPT_ENV_YIELD__"
		},
		arguments: null
	},
	consequent: {
		type: "ExpressionStatement",
		expression: {
			type: "YieldExpression",
			argument: null
		}
	}
};
const GeneratorFunction = (function* () { }).constructor;
const HzScript = function (parser = ES5Parser) {
	this.parser = parser;
}
// Include Peg JS Parser
HzScript.parser = module.exports;
HzScript.searchAst = function (ast, callback, bfs = true) {
	if (!("body" in ast) || !Array.isArray(ast.body)) {
		throw new TypeError("Argument 1 must be a valid ESTree Program");
	}
	if (ast.body.length === 0) {
		return;
	}
	const tuples = [];
	const addTuple = (child, parent = null) => tuples.push({ node: child, parentNode: parent });
	const getTuple = () => tuples[bfs ? "shift" : "pop"]();
	addTuple(ast, null);
	var node;
	var parentNode;
	var tuple;
	while (tuples.length > 0) {
		tuple = getTuple();
		node = tuple.node;
		parentNode = tuple.parent;
		callback(node, parentNode);
		if (("body" in node) && (typeof node.body) === "object") {
			if (Array.isArray(node.body)) {
				node.body.forEach(child => addTuple(child, node));
			} else {
				addTuple(node.body, node);
			}
		}
	}
};
HzScript.opts = {
	FunctionDeclaration = function (node) {
		this.type = FunctionDeclaration
	}
};
HzScript.optimizeNode = function (node) {
	//TODO: Fill these in with replacement nodes.
	if (node.type === "Expression") {

	} else if (node.type === "ThisExpression") {

	} else if (node.type === "CallExpression") {

	} else if (node.type === "FunctionExpression") {
		node.generator = true;
	} else if (node.type === "SequenceExpression") {

	} else if (node.type === "UnaryExpression") {

	} else if (node.type === "ConditionalExpression") {

	} else if (node.type === "AssignmentExpression") {


	} else if (node.type === "Declaration") {

	} else if (node.type === "VariableDeclaration") {

	} else if (node.type === "VariableDeclarator") {

	} else if (node.type === "FunctionDeclaration") {
		node.generator = true;
		const body = node.body;
		if (!Array.isArray(body) || body.length === 0) {
			return;
		}
		for (var loc = 0; loc < body.length; loc++ , loc++) {
			body.splice(loc, 0, YIELD_COND_CALLBACK);
		}
	} else if (body.type === "BlockStatement") {

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
HzScript.compile = function (source, args, wrap = true, callback = "null") {
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
HzScript.test = function () {
	this.searchAst(this.parser, function (node) {
		if (node.type === "ExpressionStatement" && node.expression.type === "Literal") {
			node
		}
	});
};