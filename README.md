# HertzScript

:seedling: This project is in early alpha.

HertzScript (abbreviated "HzScript") is a [Babel](https://babeljs.io/) plugin which takes your regular existing JavaScript source code as input, and transforms it into an interruptable coroutine system with voluntary preemption. This project is part of a larger effort to implement preemptively multitasked Green threads in (and only in) JavaScript, and was initially created as the core executor of the [Hertzfeld Kernel](https://github.com/Floofies/hertzfeld-kernel).

## FAQ

**Q:** *What problem does HertzScript solve?*

**A:** In regular JavaScript, if another function is busy executing just as a `setTimeout` timer reaches it’s scheduled deadline, then that timer will miss the deadline. If you want to have reliable multitasking in a single process, this problem presents a significant roadblock, and reduces the overall multitasking capacity while adding significant jitter to the system.

**Q:** *How does it solve that problem?*

**A:**  By adding preemptive multitasking support to your existing JavaScript source code, automatically transforming all subroutines into interruptible coroutines, and eliminating run-time blocking by giving you the ability to interrupt/preempt/pause any JavaScript function's execution at nearly any point in the control flow. Preparation of the input source code is not neccesary, so you can continue to write regular JavaScript without changing anything.

**Q:** *Why would I need this?*

**A:** HzScript allows developers to reliably multitask on a single thread without manually implementing it, so you can easily write multiple JavaScript programs and execute them in the same multitasking environment. If you're already manually writing cooperatively multitasked source code, and/or need reliable single-process multitasking, HzScript could take over this responsibility for you. If you're implementing [Green threads](https://en.wikipedia.org/wiki/Green_threads), then the HzScript dispatcher could serve as an executor for each thread.

## High-Level Synopsis

HzScript consists of a [Babel](https://babeljs.io/) transformation plugin utilizing the visitor pattern, and a coroutine dispatcher with which to run the resulting source code. The source code HzScript produces can be a fully portable, platform-agnostic JavaScript module, which transparently integrates with existing software.

Normally, coroutines are reserved for cooperative multitasking, but HzScript implements a special type named voluntary preemptive multitasking. In regular cooperative-style programmers must declare points at which programs will yield, and HzScript extends this concept by automating it, transforming every function call into a voluntary preemption point. Function calls are re-interpreted as yielded kernelized instructions. In plain english, HzScript transforms JavaScript functions into instruction streams ("function dispensers") which yield functions instead of invoking them. To facilitate such a transformation while preserving normal JavaScript execution, a coroutine dispatcher which implements the instruction specification must be used to run the compiled source code.

The theory of operation behind this system is such that the coroutine dispatcher need not be complex. A simple stack machine is sufficient to interpret the instruction set, which consists of function invocation, returns, yields, and throws. The instruction set corresponds with stack operations which push and pop the coroutines from a simple Array-based virtual stack, taking most of the responsibilities of stack management away from userland source code. Supplied with a time-slice quantum in nanoseconds, the coroutine dispatcher will attempt to return at the end of that specified duration.

While the dispatcher does not re-implement the the invocation operator, it does change how the "real" stack is stored in a JavaScript runtime, limiting the stack to a set size. The stack will generally consist of the coroutine dispatcher and any other parent callers from user code, with the currently executing coroutine residing at the end of the stack; the stack does not grow past this point except during function calls which were initiated by many of JavaScript's standard operators which are not the invocation operator. Efforts are also underway to implement forced preemption by targeting such operators, in which each atomic operation in an expression is transformed into an individual coroutine.

## Example Use Case - Preventing Run-Time Blocking

Due to the single-threaded nature of JavaScript, only one function may be run at any time.

All JavaScript is executed in a single synchronous thread, so there are no guarantees that the deadlines you set will ever be met, making the reliability of event loop multitasking uncertain. This means that if a function is busy executing as a `setTimeout` timer reaches it’s scheduled deadline, that timer will miss the deadline. At best, sometimes your callbacks will run later than you expect; at worst, your entire process will hang. The following JavaScript source code is a good example of how this delay occurs.

In the below example, we schedule two `setTimeout` callbacks. `block` is scheduled to run as soon as possible and simulates a long-running callback that runs for 1000ms, while the other callback is scheduled to run after 500ms.

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

As an aside, setting the setTimeout delay to 0 does not cause the callback to execute right there and then; instead, the event loop must wait until the currently executing function returns, which is the exact same behavior that causes the aforementioned problem.
 
After running the above source code in either NodeJS or a web browser, the console may then contain something like the below:

```
Ran blocker for 1000ms.
Took 1000ms to run timer.
```

In web browsers, you may also see a `[Violation]` log notifying you of the long-running callback:

```
[Violation] 'setTimeout' handler took 1000ms
```

These numbers indicate that the second callback was delayed by 500ms because it was forced to wait until the first callback had completed. The second callback failed to run at the scheduled deadline of 500m and ran at 1000ms instead, right after the first callback returned.

### The Solution

HzScript solves this problem by making it possible to interrupt functions and perform context switching, all from within JavaScript.

If we run `block` after it has been compiled with HzScript, we can then execute it in chunks and run other code in between every interruption of it. We can then advance the Generator in recursive `setTimeout` callbacks like in the below example:

```JavaScript
// Our blocker source code:
const blockSource = `
	var start = performance.now();
	spin: while ((performance.now() - start) < 1000);
	console.log("Ran blocker for " + (performance.now() - start) + "ms.");
`;
// Compile into a live Generator function with HzScript:
const blocker = HzScript.hotCompile(block)();

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

In the above example, each time we call blocker.next() a single iteration of the `spin` loop is executed and control is yielded, at which point the event loop is free to execute other callbacks when they reach their deadlines.
 
The above code would then log something like this, most likely with a very small margin of error:

```
Took 500ms to run timer.
Ran blocker for 1000ms.
```
