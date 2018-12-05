const acorn = require("acorn");
const tt = acorn.tokTypes;
const isIdentifierChar = acorn.isIdentifierChar;
const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
const lineBreak = /\r\n?|\n|\u2028|\u2029/;
module.exports = function HzParserFactory(Parser) {
	return class HzSpawnParser extends Parser {
		parseMaybeAssign(noIn, refDestructuringErrors) {
			return this.parseMaybeSpawn(noIn, refDestructuringErrors);
		}
		parseMaybeSpawn(noIn, refDestructuringErrors) {
			skipWhiteSpace.lastIndex = this.pos;
			const next = this.pos + skipWhiteSpace.exec(this.input)[0].length;
			if (
				!this.isContextual("spawn")
				|| lineBreak.test(this.input.slice(this.pos, next))
				|| this.input.slice(next, next + 1) === "="
				|| !isIdentifierChar(this.input[next].charCodeAt(0))
			) {
				return super.parseMaybeAssign(noIn, refDestructuringErrors);
			}
			this.next();
			const spawnExpr = this.startNodeAt(this.start, this.startLoc);
			spawnExpr.delegate = false;
			const atom = this.parseExprAtom(refDestructuringErrors);
			const expr = this.parseSubscripts(atom, this.start, this.startLoc, false);
			spawnExpr.argument = expr;
			return this.finishNode(spawnExpr, "SpawnExpression");
		}
	}
};