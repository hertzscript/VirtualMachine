function Plugin(babel) {
	const t = babel.types;
	// Function call without arguments
	function hzCall(callee) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzUserLib"),
						t.identifier("call")
					),
					[
						callee
					]
				)
			)
		]);
	}
	// Function call with arguments
	function hzCallArgs(name, argsArray) {
		const seqExp = hzCall(name);
		seqExp.expressions[0].argument.callee.property.name = "callArgs";
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		return seqExp;
	}
	// Method call without arguments
	function hzCallMethod(object, prop) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzUserLib"),
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
	// Method call with arguments
	function hzCallMethodArgs(object, prop, argsArray) {
		const seqExp = hzCallMethod(object, prop);
		seqExp.expressions[0].argument.callee.property.name = "callMethodArgs";
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		return seqExp;
	}
	// Return without argument
	function hzReturn() {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("return")
			),
			[]
		);
	}
	// Return with argument
	function hzReturnArg(argExp) {
		const callExp = hzReturn();
		callExp.callee.property.name = "returnValue";
		callExp.arguments.push(argExp);
		return callExp;
	}
	// Yield without argument
	function hzYield() {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("yield")
			),
			[t.ObjectExpression([
				t.ObjectProperty(t.identifier("value"), t.identifier("undefined")),
				t.ObjectProperty(t.identifier("done"), t.BooleanLiteral(false))
			])]
		);
	}
	// Yield with argument
	function hzYieldArg(argExp) {
		const callExp = hzYield();
		callExp.callee.property.name = "yieldValue";
		callExp.arguments[0].properties[0].value = argExp;
		return callExp;
	}
	// Spawn with argument
	function hzSpawn(argExp) {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("spawn")
			),
			[argExp]
			/*
			[t.functionExpression(
				null,
				[],
				t.blockStatement([t.expressionStatement(argExp)]),
				true
			)]
			*/
		);
	}
	// Coroutine factory
	function hzCoroutine(funcExp) {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzDisp"),
				t.identifier("createCoroutine")
			),
			[funcExp]
		);
	}
	// Generator factory
	function hzGenerator(funcExp) {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzDisp"),
				t.identifier("createGenerator")
			),
			[funcExp]
		);
	}
	// Coroutine declaration
	function declareHzCoroutine(funcDec) {
		return t.variableDeclaration("var", [
			t.variableDeclarator(
				funcDec.id,
				hzCoroutine(t.functionExpression(
					funcDec.id,
					funcDec.params,
					funcDec.body,
					true
				))
			)
		]);
	}
	// Generator declaration
	function declareHzGenerator(funcDec) {
		return t.variableDeclaration("var", [
			t.variableDeclarator(
				funcDec.id,
				hzGenerator(t.functionExpression(
					funcDec.id,
					funcDec.params,
					funcDec.body,
					true
				))
			)
		]);
	}
	const visitor = {
		"FunctionExpression": {
			exit: function (path) {
				if (path.node.generator) path.replaceWith(hzGenerator(path.node));
				else path.replaceWith(hzCoroutine(path.node));
				path.node.arguments[0].generator = true;
				path.skip();
			}
		},
		"ArrowFunctionExpression": {
			exit: function (path) {
				if (path.node.generator) path.replaceWith(hzGenerator(path.node));
				else path.replaceWith(hzCoroutine(path.node));
				path.node.arguments[0].generator = true;
				path.skip();
			}
		},
		"FunctionDeclaration": {
			exit: function (path) {
				if (path.node.generator) var varDec = declareHzGenerator(path.node);
				else var varDec = declareHzCoroutine(path.node);
				path.node.generator = true;
				const parentPath = path.getFunctionParent();
				if (Array.isArray(parentPath.node.body)) parentPath.node.body.unshift(varDec);
				else parentPath.node.body.body.unshift(varDec);
				path.remove();
			}
		},
		"CallExpression": {
			exit: function (path) {
				//if (path.getFunctionParent().type === "Program") return;
				if (path.node.callee.type === "MemberExpression") {
					if (path.node.callee.object.type === "Identifier" &&
						path.node.callee.object.name === "hzUserLib" &&
						path.node.callee.property.type === "Identifier" &&
						path.node.callee.property.name === "spawn"
					) {
						path.replaceWith(t.yieldExpression(
							path.node
						));

					} else {
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
				path.skip();
			}
		},
		"ReturnStatement": {
			exit: function (path) {
				const parentPath = path.getFunctionParent();
				if (path.node.argument === null) path.node.argument = hzReturn();
				else path.node.argument = hzReturnArg(path.node.argument);
				if (parentPath.node.generator) path.node.argument.arguments = [t.ObjectExpression([
					t.ObjectProperty(
						t.identifier("value"),
						path.node.argument.arguments[0]
					),
					t.ObjectProperty(
						t.identifier("done"),
						t.BooleanLiteral(true)
					)
				])];
			}
		},
		"YieldExpression": {
			exit: function (path) {
				if (path.node.argument === null) path.node.argument = hzYield();
				else path.node.argument = hzYieldArg(path.node.argument);
			}
		},
		/*
		"SpawnExpression": {
			exit: function (path) {
				if (path.node.argument === null) return;
				path.node.type = "YieldExpression"
				path.node.argument = hzSpawn(path.node.argument);
			}
		}
		*/
	};
	return { visitor: visitor };
};
module.exports = Plugin;