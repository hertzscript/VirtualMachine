const acorn = require("acorn");
const tt = acorn.tokTypes;
const isIdentifierChar = acorn.isIdentifierChar;
const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
const lineBreak = /\r\n?|\n|\u2028|\u2029/;

module.exports = function (Parser) {
	return class extends Parser {
		parseMaybeAssign(noIn, refDestructorErrors, afterLeftParse) {
			if (this.isSpawnExpression()) {
				console.log("Saw SpawnExpression");
				return this.parseSpawn();
			}
			else {
				console.log("Didn't see SpawnExpression");
				return super.parseMaybeAssign(noIn, refDestructorErrors, afterLeftParse);
			}
		}
		isSpawnExpression() {
			// check 'spawn [no LineTerminator here] expression'
			// - 'spawn /*foo*/ expression' is OK.
			// - 'spawn /*\n*/ expression' is invalid.
			if (!this.isContextual("spawn")) return false;
			skipWhiteSpace.lastIndex = this.pos;
			var skip = skipWhiteSpace.exec(this.input);
			var next = this.pos + skip[0].length;
			if (lineBreak.test(this.input.slice(this.pos, next))) return false;
			console.log("No line break");
			if (this.input.slice(next, next + 1) === "=") return false;
			console.log("Not an assignment");
			if (isIdentifierChar(this.input.charCodeAt(next))) return true;
			console.log("Next char isn't an Identifier");
			if (this.input[next] === "(") return true;
			console.log("Arrow not seen");
			if (this.canInsertSemicolon()) return false;
			console.log("Couldn't run ASI");
		}
		parseSpawn() {
			if (!this.yieldPos) this.yieldPos = this.start;
			let node = this.startNode();
			this.next();
			if (this.type === tt.semi || this.canInsertSemicolon() || (this.type !== tt.star && !this.type.startsExpr)) {
				return this.finishNode(node, "Identifier");
			} else {
				console.log("Parsing spawn arg");
				node.argument = this.parseMaybeAssign();
			}
			node.delegate = false;
			return this.finishNode(node, "SpawnExpression");
		}
	}
};