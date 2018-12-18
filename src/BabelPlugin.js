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
	function hzNew(callee) {
		const seqExp = hzCall(callee);
		seqExp.expressions[0].argument.callee.property.name = "new";
		return seqExp;
	}
	function hzNewArgs(name, argsArray) {
		const seqExp = hzNew(name);
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		seqExp.expressions[0].argument.callee.property.name = "newArgs";
		return seqExp;
	}
	function hzNewMethod(object, prop) {
		const seqExp = hzCallMethod(object, prop);
		seqExp.expressions[0].argument.callee.property.name = "newMethod";
		return seqExp;
	}
	function hzNewMethodArgs(object, prop, argsArray) {
		const seqExp = hzNewMethod(object, prop);
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		seqExp.expressions[0].argument.callee.property.name = "newMethodArgs";
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
	// Spawn without arguments
	function hzSpawn(spawnExp) {
		if (spawnExp.arguments[0].type === "CallExpression") {
			spawnExp.arguments = [spawnExp.arguments[0].callee];
		} else {
			spawnExp.arguments = [spawnExp.arguments[0]];
		}
		return t.yieldExpression(
			spawnExp
		);
	}
	// Spawn with arguments
	function hzSpawnArgs(spawnExp) {
		const args = spawnExp.arguments[0].arguments;
		spawnExp = hzSpawn(spawnExp);
		spawnExp.argument.arguments.push(t.arrayExpression(args));
		spawnExp.argument.callee.property.name = "spawnArgs";
		return spawnExp;
	}
	// Spawn method without arguments
	function hzSpawnMethod(spawnExp) {
		spawnExp.arguments = [
			spawnExp.arguments[0].callee.object,
			t.stringLiteral(spawnExp.arguments[0].callee.property.name)
		];
		spawnExp.callee.property.name = "spawnMethod";
		return t.yieldExpression(
			spawnExp
		);
	}
	// Spawn method with arguments
	function hzSpawnMethodArgs(spawnExp) {
		const args = spawnExp.arguments[0].arguments;
		spawnExp = hzSpawnMethod(spawnExp);
		spawnExp.argument.arguments.push(t.arrayExpression(args));
		spawnExp.argument.callee.property.name = "spawnMethodArgs";
		return spawnExp;
	}
	// Coroutine factory
	function hzCoroutine(funcExp) {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("hookCoroutine")
			),
			[funcExp]
		);
	}
	// ArrowFunction Coroutine factory
	function hzArrowCoroutine(funcExp) {
		funcExp.type = "FunctionExpression";
		if (funcExp.body.type !== "BlockStatement") {
			funcExp.body = t.blockStatement([
				t.expressionStatement(funcExp.body)
			]);
		}
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("hookArrowCoroutine")
			),
			[
				funcExp,
				t.identifier("this")
			]
		);
	}
	// Generator factory
	function hzGenerator(funcExp) {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("hookGenerator")
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
	function loopInterruptor(path) {
		if (path.node.body.type !== "BlockStatement") {
			if (path.node.body.type === "EmptyStatement") {
				path.node.body = t.blockStatement([]);
			} else {
				if (Array.isArray(path.node.body)) {
					path.node.body = t.blockStatement(path.node.body);
				} else {
					path.node.body = t.blockStatement([path.node.body]);
				}
			}
		}
		path.node.body.body.unshift(t.expressionStatement(
			t.yieldExpression(t.callExpression(
				t.memberExpression(
					t.identifier("hzUserLib"),
					t.identifier("loopYield")
				),
				[]
			))
		));
	}
	const visitor = {
		"WhileStatement": {
			exit: loopInterruptor
		},
		"DoWhileStatement": {
			exit: loopInterruptor
		},
		"ForStatement": {
			exit: loopInterruptor
		},
		"ForOfStatement": {
			exit: loopInterruptor
		},
		"ForInStatement": {
			exit: loopInterruptor
		},
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
				path.replaceWith(hzArrowCoroutine(path.node));
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
		"NewExpression": {
			exit: function (path) {
				if (path.node.callee.type === "MemberExpression") {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzNewMethod(
							path.node.callee.object,
							path.node.callee.property
						));
					} else {
						path.replaceWith(hzNewMethodArgs(
							path.node.callee.object,
							path.node.callee.property,
							path.node.arguments
						));
					}
				} else {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzNew(
							path.node.callee
						));
					} else {
						path.replaceWith(hzNewArgs(
							path.node.callee,
							path.node.arguments
						));
					}
				}
				path.skip();
			}
		},
		"CallExpression": {
			enter: function (path) {
				if (path.node.callee.type === "MemberExpression" &&
					path.node.callee.object.type === "Identifier" &&
					path.node.callee.object.name === "hzUserLib" &&
					path.node.callee.property.type === "Identifier" &&
					path.node.callee.property.name === "spawn"
				) {
					if (path.node.arguments[0].type === "CallExpression") {
						if (path.node.arguments[0].callee.type === "MemberExpression") {
							if (path.node.arguments[0].arguments.length > 0) {
								path.replaceWith(hzSpawnMethodArgs(path.node));
							} else {
								path.replaceWith(hzSpawnMethod(path.node));
							}
						} else {
							if (path.node.arguments[0].arguments.length > 0) {
								path.replaceWith(hzSpawnArgs(path.node));
							} else {
								path.replaceWith(hzSpawn(path.node));
							}
						}
					} else {
						path.replaceWith(hzSpawn(path.node));
					}
					const callee = path.node.argument.arguments[0];
					if (callee.type === "FunctionExpression"
						|| callee.type === "ArrowFunctionExpression") {
						if (callee.generator) {
							path.node.argument.arguments[0] = hzGenerator(callee);
						} else {
							path.node.argument.arguments[0] = hzCoroutine(callee);
							callee.generator = true;
						}
					}
					path.skip();
				}
			},
			exit: function (path) {
				//if (path.getFunctionParent().type === "Program") return;
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