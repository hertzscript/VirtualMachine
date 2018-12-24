// Generic Object Pool
function createPoolObj(obj, pool) {
	obj[Pool.freeSym] =  _=> pool.free(obj);
	obj[Pool.allocSym] = false;
	return obj;
}
function Pool(constructor, free, min, max, args = null) {
	this.pool = [];
	this.free = poolObj => {
		if (!poolObj[Pool.allocSym]) return;
		poolObj[Pool.allocSym] = false;
		free(poolObj);
		this.pool.push(poolObj);
	};
	this.objConstructor = constructor;
	this.args = args;
	this.min = min;
	this.max = max;
	this.scaleUp(min);
}
Pool.freeSym = Symbol("Object Pool Member Marker");
Pool.allocSym = Symbol("PoolObj Allocation Marker");
Pool.prototype.scaleUp = function(int) {
	while (this.pool.length < int && this.pool.length < this.max) {
		if (this.args === null) this.pool.push(createPoolObj(new this.objConstructor(), this));
		else this.pool.push(createPoolObj(new this.objConstructor(...this.args), this));
	}
};
Pool.prototype.scaleDown = function(int) {
	while (this.pool.length > int && this.pool.length > this.min) {
		this.pool.pop()[Pool.freeSym] = null;
	}
};
Pool.prototype.get = function() {
	const poolObj = this.pool.pop();
	if (this.pool.length < this.min) this.scaleUp(this.min);
	poolObj[Pool.allocSym] = true;
	return poolObj;
};
module.exports = Pool;