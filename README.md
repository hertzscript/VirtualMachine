# HertzScript
A source-to-source optimizing compiler which produces preemptable JavaScript.

:seedling: This project is in early alpha.

## Brief Description

Given valid JavaScript source code as input, HzScript produces semantically (sometimes directly) equivalent JavaScript source code with all user functions converted to Generators, and `yield` inserted between every operation. The source code HzScript produces is fully portable, and does not have any external dependency to HzScript.

HertzScript was created for use in the [Hertzfeld Kernel](https://github.com/Floofies/hertzfeld-kernel).

## FAQ

**Q:** *What does this do?*

**A:**  HertzScript automatically breaks up source code into smaller units of work, transparently yielding control back to the root caller between almost every operation.

**Q:** *What does that achieve?*

**A:** It allows JavaScript to multitask on a single thread, and gives you the ability to preempt/pause a function's execution at nearly any point in its control flow.

**Q:** *Why would I need that?*

**A:** All JavaScript is executed in a single synchronous thread, thus there are no guarantees that the deadlines you set will ever be met. At best, sometimes your callbacks will run later than you expect; at worst, your entire process will hang. Once JavaScript source code is compiled with HertzScript, you can run multiple functions at the same time in the same thread and process.

## Example Use Case

Due to the single-threaded nature of JavaScript, executing code blocks other code from executing. The following JavaScript code is a good example of this problem occurring. In the below example, we schedule two `setTimeout` callbacks. `block` is scheduled to run as soon as possible and simulates a long-running callback, which runs for 1000ms; the other callback is scheduled to run after 500ms.

```JavaScript
// Blocks for 1000ms
function block() {
	var start = performance.now();
	spin: while ((performance.now() - start) < 1000);
	console.log("Ran blocker for " + (performance.now() - start) + "ms.");
}

// Schedule blocker to run ASAP
setTimeout(block, 0);

// Schedule timer to run in 500ms
var start = performance.now();
setTimeout(function () {
	console.log("Took " + (performance.now() - start) + "ms to run timer.")
}, 500);
```

After running the above code, the console may then contain something like the below. You may also see a `[Violation]` log notifying you of the long-running callback:

```
Ran blocker for 1000ms.
Took 1000ms to run timer.
```

The second callback was forced to wait until the first had completed. Because the first callback ran for 1000ms, it prevented the second callback from running after 500ms. HzScript solves this problem by making it possible to interrupt functions and perform context switching, all from within JavaScript.

If we run `block` after it has been compiled with HzScript, we can then execute it in chunks and run other code in between every interruption of it. We can then advance the Generator in recursive `setTimeout` callbacks like in the below example:

```JavaScript
// Our blocker source code:
var block = '\
	var start = performance.now();\
	spin: while ((performance.now() - start) < 1000);\
	console.log("Ran blocker for " + (performance.now() - start) + "ms.");\
';
// Compile into a live Generator function with HzScript:
var blocker = HzScript.hotCompile(block)();

// Runs the blocker, and schedules itself to run in the async event queue ASAP:
function runBlocker () {
	if (!blocker.next().done) {
		setTimeout(runBlocker, 0);
	}
}
// Schedule the blocker to run in the async event queue ASAP:
setTimeout(runBlocker, 0);
// Schedule timer to run in 500ms
var start = performance.now();
setTimeout(function () {
	console.log("Took " + (performance.now() - start) + "ms to run timer.")
}, 500);
```

The above code would then log something lke this:
```
Took 500ms to run timer.
Ran blocker for 1000ms.
```
