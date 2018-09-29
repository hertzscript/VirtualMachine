module.exports = function (babel) {
	const t = babel.types;
	const replacedNodes = new WeakSet();
	function hzCall(callee) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzDisp"),
						t.identifier("call")
					),
					[
						callee
					]
				)
			)
		]);
	}
	function hzCallArgs(name, argsArray) {
		const seqExp = hzCall(name);
		seqExp.expressions[0].argument.callee.property.name = "callArgs";
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		return seqExp;
	}
	function hzCallMethod(object, prop) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzDisp"),
						t.identifier("callMethod")
					),
					[
						object,
						t.stringLiteral(prop.name)
					]
				)
			)
		]);
	}
	function hzCallMethodArgs(object, prop, argsArray) {
		const seqExp = hzCallMethod(object, prop);
		seqExp.expressions[0].argument.callee.property.name = "callMethodArgs";
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		return seqExp;
	}
	function hzReturn() {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzDisp"),
				t.identifier("returnValue")
			),
			[]
		);
	}
	function hzReturnArg(argExp) {
		const callExp = hzReturn();
		callExp.arguments.push(argExp);
		return callExp;
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
		callExp.arguments.push(argExp);
		return callExp;
	}

	const visitor = {
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
		"ArrowFunctionExpression": {
			enter: function (path) {
				path.node.generator = true;
			}
		},
		"CallExpression": {
			exit: function (path) {
				if (replacedNodes.has(path.node)) return;
				if (path.node.callee.type === "MemberExpression") {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzCallMethod(
							path.node.callee.object,
							path.node.callee.property
						));
					} else {
						path.replaceWith(hzCallMethodArgs(
							path.node.callee.object,
							path.node.callee.property,
							path.node.arguments
						));
					}
				} else {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzCall(
							path.node.callee
						));
					} else {
						path.replaceWith(hzCallArgs(
							path.node.callee,
							path.node.arguments
						));
					}
				}
				replacedNodes.add(path.node);
				replacedNodes.add(path.node.expressions[0]);
				path.skip();
			}
		},
		"ReturnStatement": {
			enter: function (path) {
				if (replacedNodes.has(path.node)) return;
				if (path.node.argument === null) {
					path.node.argument = hzReturn();
				} else {
					path.node.argument = hzReturnArg(path.node.argument);
				}
				replacedNodes.add(path.node);
				replacedNodes.add(path.node.argument);
			}
		},
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