function AspectWeaver(thisArg, aspects = null) {
	this.thisArg = thisArg;
	this.aspects = {};
	if (aspects !== null) Object.assign(this.aspects, aspects);
}
AspectWeaver.prototype.pushAspect = function (typeOrAspects, aspect = null) {
	if (typeof typeOrAspects === "string") {
		if (!(typeOrAspects in this.aspects)) this.aspects[typeOrAspects] = [];
		this.aspects[typeOrAspects].push(aspect);
	} else if (typeof typeOrAspects === "object") {
		for (const type in typeOrAspects) {
			if (!(type in this.aspects)) this.aspects[type] = [];
			for (const loc in typeOrAspects[type]) {
				this.aspects[type].push(typeOrAspects[type][loc]);
			}
		}
	}
};
AspectWeaver.prototype.unshiftAspect = function (typeOrAspects, aspect = null) {
	if (typeof typeOrAspects === "string") {
		if (!(typeOrAspects in this.aspects)) this.aspects[typeOrAspects] = [];
		this.aspects[typeOrAspects].unshift(aspect);
	} else if (typeof typeOrAspects === "object") {
		for (const type in typeOrAspects) {
			if (!(type in this.aspects)) this.aspects[type] = [];
			for (var loc = typeOrAspects.length - 1; loc !== -1; loc--) {
				this.aspects[type].unshift(typeOrAspects[type][loc]);
			}
		}
	}
};
AspectWeaver.prototype.removeAspect = function (type, aspect) {
	const loc = this.aspects[type].indexOf(aspect);
	if (loc === -1) return;
	this.aspects[type].splice(loc, 1);
};
AspectWeaver.prototype.execAspects = function (type, ...argsArray) {
	var breakLoop = false;
	const stop = () => breakLoop = true;
	var value;
	var rValue;
	argsArray = [rValue, stop].concat(argsArray);
	for (const aspect of this.aspects[type]) {
		var value = aspect.apply(this.thisArg, argsArray);
		if (typeof value !== "undefined") {
			argsArray[0] = value;
			rValue = value;
		}
		if (breakLoop) break;
	}
	return rValue;
};
module.exports = AspectWeaver;