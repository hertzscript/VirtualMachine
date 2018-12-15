function Channel(typeString, limit = Number.MAX_SAFE_INTEGER) {
	this.typeString = typeString;
	this.readers = new Set();
	this.minReaderLoc = 0;
	this.queue = [];
	this.queueLimit = limit;
}
Channel.prototype.prune = function () {
	const locs = [];
	for (const reader of this.readers) {
		locs.push(reader.loc);
	}
	const lowestLoc = Math.min(...locs);
	this.queue.slice(0, lowestLoc);
};
Channel.prototype.write = function (message) {
	const type = typeof message;
	if (type !== this.typeString) throw new TypeError("Channel expected type of \"" + this.typeString + "\", but received type \"" + type + "\"");
	if (this.queue.length === this.queueLimit) this.limitReached();
	this.queue.push(message);
};
Channel.prototype.read = function (reader) {
	if (!this.readers.has(reader)) throw new Error("Channel got read by unregistered Reader");
	if (reader.loc >= this.queue.length || reader.loc < 0) return;
	const data = this.queue[reader.loc];
	const minLoc = Math.min(Array.from(this.readers).map(reader => reader.loc));
	if (this.minReaderLoc <= minLoc) {
		this.minReaderLoc = minLoc;
		const deleted = this.queue.splice(0, minLoc + 1);
		for (const reader of this.readers) reader.loc = reader.loc - (deleted.length - 1);
	} else {
		reader.loc++;
	}
	return data;
};
Channel.prototype.addReader = function (reader) {
	this.readers.add(reader);
};
Channel.prototype.removeReader = function (reader) {
	this.readers.delete(reader);
};
Channel.prototype.purgeReaders = function () {
	this.readers.clear();
};
Channel.prototype.limitReached = function () {
	throw new Error("Channel Queue size limit reached. Could not publish additional message.");
};
function Reader(bus) {
	this.loc = 0;
	this.gcCheck = true;
	bus.addReader(this);
	this.getBus = () => bus;
};
Reader.prototype.read = function () {
	return this.getBus().read(this);
};
Channel.Reader = Reader;
module.exports = Channel;