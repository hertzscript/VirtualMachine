# HertzScript

:seedling: This project is in early alpha.

HertzScript (abbreviated "HzScript") is a Babel plugin which takes your regular existing JavaScript source code as input, and transforms it into an interruptable coroutine system with voluntary preemption. This project is part of a larger effort to implement preemptively multitasked Green threads in (and only in) JavaScript, and was initially created as the core executor of the [Hertzfeld Kernel](https://github.com/Floofies/hertzfeld-kernel).

## High-Level Synopsis

HzScript consists of a Babel plugin utilizing the visitor pattern, and a coroutine dispatcher with which to run the resulting source code. Given valid JavaScript source code as input, HzScript produces semantically (sometimes directly) equivalent JavaScript source code with all functions converted to coroutine-like GeneratorFunctions; calls to the coroutines are converted to cooperative yields with deferred invocation. The source code HzScript produces can be a fully portable, platform-agnostic JavaScript module, which transparently integrates with existing software.

Normally, coroutines are reserved for cooperative multitasking, but HzScript implements a special type named voluntary preemptive multitasking. In regular cooperative-style programmers must declare points at which programs will yield, and HzScript extends this concept by automating it, transforming every function call into a voluntary preemption point. Function calls are re-interpreted as yielded kernelized instructions. In plain english, HzScript transforms JavaScript functions into "function dispensers" which simply yield the next function to be run tather than running it themselves. To facilitate such a transformation while preserving normal JavaScript execution, a coroutine dispatcher which implements the instruction specification must be used to run the compiled source code.

The theory of operation behind this system is such that the coroutine dispatcher need not be complex. A simple stack machine is sufficient to interpret the instruction set, which consists of function invocation, returns, yields, and throws. The instruction set corresponds with stack operations which push and pop the coroutines from a simple Array-based virtual stack, taking most of the responsibilities of stack management away from userland source code. Supplied with a time-slice quantum in nanoseconds, the coroutine dispatcher will attempt to return at the end of that specified duration.

While the dispatcher does not re-implement the the invocation operator, it does change how the "real" stack is stored in a JavaScript runtime, limiting the stack to a set size. The stack will generally consist of the coroutine dispatcher or some other caller from user code, with the currently executing coroutine at the end of the stack; the stack does not grow past this point except during function calls which were initiated by many of JavaScript's standard operators which are not the invocation operator. Efforts are also underway to implement forced preemption by targeting such operators, in which each atomic operation in an expression is transformed into an individual coroutine.

## FAQ

**Q:** *What does this do again?*

**A:**  HertzScript automatically turns regular JavaScript subroutines into interruptible JavaScript coroutines. Preparation of the input source code is not neccesary, so you can continue to write JavaScript without changing anything.

**Q:** *What does that achieve?*

**A:** It allows JavaScript to multitask on a single thread, gives you the ability to preempt/pause a function's execution at nearly any point in its control flow.

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
