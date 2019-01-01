/*
Copyright © 2018 Ankur Oberoi
Copyright © 2017 Blue Otter Software

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
function CaptureConsole() {
	this._capturedText = [];
	this._orig_stdout_write = null;
	this._orig_stderr_write = null;
}
/**
 * Starts capturing the writes to process.stdout
 */
CaptureConsole.prototype.startCapture = function () {
	this._orig_stdout_write = process.stdout.write;
	this._orig_stderr_write = process.stderr.write;
	process.stdout.write = this._writeCapture.bind(this);
	process.stderr.write = this._writeCapture.bind(this);
};
/**
 * Stops capturing the writes to process.stdout.
 */
CaptureConsole.prototype.stopCapture = function () {
	if (this._orig_stdout_write) {
		process.stdout.write = this._orig_stdout_write;
		this._orig_stdout_write = null;
	}
	if (this._orig_stderr_write) {
		process.stderr.write = this._orig_stderr_write;
		this._orig_stderr_write = null;
	}
};
/**
 * Private method that is used as the replacement write function for process.stdout
 * @param string
 * @private
 */
CaptureConsole.prototype._writeCapture = function (string) {
	this._capturedText.push(string);
};
/**
 * Retrieve the text that has been captured since creation or since the last clear call
 * @returns {Array} of Strings
 */
CaptureConsole.prototype.getCapturedText = function () {
	return this._capturedText;
};
/**
 * Clears all of the captured text
 */
CaptureConsole.prototype.clearCaptureText = function () {
	this._capturedText = [];
};
module.exports = CaptureConsole;
