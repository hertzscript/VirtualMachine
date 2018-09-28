module.exports = function (babel) {
	const t = babel.types;
	const replacedNodes = new WeakSet();
	function hzCall(name) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzDisp"),
						t.identifier("call")
					),
					[
						t.identifier(name)
					]
				)
			)
		]);
	}
	function hzCallArgs(name, argsArray) {
		const seqExp = hzCall(name);
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		return seqExp;
	}
	function hzCallMethod(objectName, propName) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzDisp"),
						t.identifier("callMethod")
					),
					[
						t.identifier(objectName),
						t.stringLiteral(propName)
					]
				)
			)
		]);
	}
	function hzCallMethodArgs(objectName, propName, argsArray) {
		const seqExp = hzCallMethod(objectName, propName);
		seqExp.expressions[0].argument.arguments.push(argsArray);
		return seqExp;
	}
	function hzYield() {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzDisp"),
				t.identifier("yieldValue")
			),
			[]
		);
	}
	function hzYieldArg(argExp) {
		const callExp = hzYield();
		console.log(argExp);
		callExp.arguments.push(argExp);
		return callExp;
	}

	const visitor = {
		"CallExpression": {
			exit: function (path) {
				if (replacedNodes.has(path.node)) return;
				if (path.node.callee.type === "MemberExpression") {
					if (path.node.arguments.length = 0) {
						path.replaceWith(hzCallMethod(
							path.node.callee.object.name,
							path.node.callee.property.name
						));
					} else {
						path.replaceWith(hzCallMethodArgs(
							path.node.callee.object.name,
							path.node.callee.property.name,
							path.node.arguments
						));
					}
				} else {
					if (path.node.arguments.length = 0) {
						path.replaceWith(hzCall(
							path.node.callee.name
						));
					} else {
						path.replaceWith(hzCallArgs(
							path.node.callee.name,
							path.node.arguments
						));
					}
				}
				replacedNodes.add(path.node);
				replacedNodes.add(path.node.expressions[0]);
				path.skip();
			}
		},
		/*
		"FunctionExpression": {
			enter: function (path) {
				path.node.generator = true;
			}
		},
		"FunctionDeclaration": {
			enter: function (path) {
				path.node.generator = true;

			}
		},
		"ReturnStatement": {
			enter: function (path) {

			}
		},
		*/
		"YieldExpression": {
			enter: function (path) {
				if (replacedNodes.has(path.node)) return;
				if (path.node.argument === null) {
					path.node.argument = hzYield();
				} else {
					path.node.argument = hzYieldArg(path.node.argument);
				}
				replacedNodes.add(path.node);
				replacedNodes.add(path.node.argument);
			}
		},
	};
	return { visitor: visitor };
};