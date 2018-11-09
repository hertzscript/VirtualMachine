const acorn = require("acorn");
const tt = acorn.tokTypes;
const isIdentifierStart = acorn.isIdentifierStart;

module.exports = function (Parser) {
	return class extends Parser {
		parseMaybeAssign(noIn, refDestructorErrors, afterLeftParse) {
			if (this.isContextual("spawn")) return this.parseSpawn();
			else return super.parseMaybeAssign(noIn, refDestructorErrors, afterLeftParse);
		}
		parseSpawn() {
			if (!this.yieldPos) this.yieldPos = this.start;
			let node = this.startNode();
			this.next();
			if (this.type === tt.semi || this.canInsertSemicolon() || (this.type !== tt.star && !this.type.startsExpr)) {
				return this.finishNode(node, "Identifier");
			} else {
				node.argument = this.parseMaybeAssign();
			}
			node.delegate = false;
			return this.finishNode(node, "SpawnExpression");
		}
	}
};