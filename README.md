# HertzScript Coroutine Dispatcher

[![NPM](https://nodei.co/npm/hertzscript-dispatcher.png)](https://nodei.co/npm/hertzscript-dispatcher/)

The HertzScript coroutine dispatcher executes code that was compiled by the [HertzScript Compiler](https://github.com/Floofies/hertzscript-compiler).

See the [HertzScript Specification](https://github.com/Floofies/hertzscript-specification) repository for more information.

- [Command-Line Interfaces](#command-line-interfaces)
	- [`hzs` / `hzscript`](#hzs--hzscript)
	- [`hzv` / `hzvelocity`](#hzv--hzvelocty)
	- [`hzr` / `hzrepl`](#hzr--hzrepl)
- [Dispatcher Module](#dispatcher-module)
	- [`import`](#dispatcherprototypeimport)
	- [`exec`](#dispatcherprototypeexec)
	- [`spawn`](#dispatcherprototypespawn)
	- [`enqueue`](#dispatcherprototypeenqueue)
	- [`cycle`](#dispatcherprototypecycle)
	- [`runSync`](#dispatcherprototyperunsync)
	- [`runAsync`](#dispatcherprototyperunasync)
	- [`runComplete`](#dispatcherprototyperuncomplete)


There are multiple ways to use this dispatcher.

- Command-line executor
- Command-line simple REPL
- Command-line concurrent Velocity REPL
- Dispatcher module

The dispatcher module can be run in multiple different execution modes:

- Run-To-Completion
- Synchronous time-slicing
- Asynchronous event loop time-slicing

## Command-Line Interfaces

### `hzs` / `hzscript`

Execute source code with optional hot-compiling via `stdin`, argument, or file input.

#### Command-Line Options

`-i` *path* (`--input`)

- This option supplies the text from the given filepath as the input JavaScript source code you would like to execute. If this option is set to nothing, or is not set at all, then the source code is consumed via the standard input of the terminal.

`-s` *code* (`--source`)

- If set, this option specifies the tring which follows as the input JavaScript source code which you would like to execute. If this option is set to nothing, or is not set at all, then the source code is consumed via the standard input of the terminal.

`-c` (`--compile`)

- If set, then `hertzscript-compiler` will pre-process the input source code before it is executed. Useful for quick testing without having to manually compile to another file every time you want to execute the script.

`--spawn`

- If set in addition to the `--compile` option, then `hertzscript-compiler` will be used to detect and compile the `spawn` keyword. If the `--compile` option is not present, then this option will do nothing.

### `hzv` / `hzvelocity`

Opens the concurrent HertzScript Velocity REPL which is designed specifically for HertzScript coroutines. The REPL consists of a status bar at the top, a virtual console output window in the middle, and a source code input line at the bottom. Source code is compiled before it is executed, and supports the `spawn` keyword. All running code runs concurrently to the REPL, so you can continue typing/adding code while existing code is still running.

- To run code, simply type it at the bottom and press enter.

- To scroll the virtual console window up and down, press PageUp and PageDown.

- To quit, either press Control+C twice, or type `.exit` and press enter.

### `hzr` / `hzrepl`

Opens a non-Concurrent REPL which behaves more like a traditional NodeJS REPL. This REPL lacks a status bar and virtual console window and runs all code in run-to-completion mode which blocks the REPL until the all code has completed running.

- To run code, simply type it at the bottom and press enter.

- To quit press Control+C twice.

---

## Dispatcher Module

The dispatcher itself is the main module, so you can import it simply like this:

```JavaScript
const Dispatcher = require("hertzscript-dispatcher");
// Instantiate the Class
const dispatcher = new Dispatcher();
```

### `Dispatcher.prototype.import`

Imports a pre-compiled HertzScript Module into the dispatcher, spawning it as a new coroutine. The module is not immediately executed with this method and is only enqueued for later execution.

#### Function Parameters

```JavaScript
dispatcher.import( hzModule );
```

`hzModule` Function

- A `Function` which was previously compiled with `hertzscript-compiler` in `module` mode.

### `Dispatcher.prototype.exec`

This method immediately executes the given pre-compiled function or HzModule in run-to-completion mode.

#### Return Value

The returned value is the last value returned by the top-most function.

#### Function Parameters

```JavaScript
dispatcher.exec( functor [, thisArg = null [, args = null ]] );
```

`functor` Function

- A function or HzModule which was previously compiled with `hertzscript-compiler`.

`thisArg` (*Optional*) Any

- An optional value to set the `this` variable to when calling `functor`.

`args` (*Optional*) Array

- An optional array to supply as arguments when calling `functor`.

### `Dispatcher.prototype.spawn`

Enqueues a new coroutine. The coroutine is not immediately executed with this method and is only enqueued for later execution.

#### Function Parameters

```JavaScript
dispatcher.spawn( functor [, thisArg = null [, args = null ]] );
```

`functor` Function

- A function which was previously compiled with `hertzscript-compiler`.

`thisArg` (*Optional*) Any

- An optional value to set the `this` variable to when calling `functor`.

`args` (*Optional*) Array

- An optional array to supply as arguments when calling `functor`.

### `Dispatcher.prototype.enqueue`

Adds a pre-compiled function to the end of the active coroutine's call stack, or creates a new coroutine for it if there is no active coroutine. The coroutine is not immediately executed with this method and is only enqueued for later execution.

#### Function Parameters

```JavaScript
dispatcher.enqueue( functor [, thisArg = null [, args = null ]] );
```

`functor` Function

- A function which was previously compiled with `hertzscript-compiler`.

`thisArg` (*Optional*) Any

- An optional value to set the `this` variable to when calling `functor`.

`args` (*Optional*) Array

- An optional array to supply as arguments when calling `functor`.

### `Dispatcher.prototype.cycle`

If the dispatcher is running, then this method cycles the dispatcher for a given duration.

#### Return Value

The returned value is the last value returned in the most recent cycle.

#### Function Parameters

```JavaScript
dispatcher.cycle( [ quantum = null [, throwUp = false ]] );
```

`quantum` (*Optional*) Number

- A timeslice quantum, in milliseconds, which specifies the approximate maximum length of time the dispatcher should cycle.

`throwUp` (*Optional*) Boolean

- This argument affects how the dispatcher handles uncaught errors. If set to `true` then the dispatcher will stop cycling and re-throw any uncaught errors, otherwise it will terminate the active coroutine and continue cycling.

### `Dispatcher.prototype.runSync`

Sets the dispatcher to running state and cycles it for a given duration.

#### Return Value

The returned value is the last value returned in the most recent cycle.

#### Function Parameters

```JavaScript
dispatcher.runSync( [ quantum = null [, throwUp = false ]] );
```

`quantum` (*Optional*) Number or Boolean

- A timeslice quantum, in milliseconds, which specifies the approximate maximum length of time the dispatcher should cycle. If set to `false` then the dispatcher will continue cycling until all coroutines have finished executing.

`throwUp` (*Optional*) Boolean

- This argument affects how the dispatcher handles uncaught errors. If set to `true` then the dispatcher will stop cycling and re-throw any uncaught errors, otherwise it will terminate the active coroutine and continue cycling.

### `Dispatcher.prototype.runAsync`

Sets the dispatcher to running state and cycles it for a given duration in a given interval, scheduling cycles in the acynchronous event loop using `setTimeout`. Can be stopped via `Dispatcher.prototype.stop`.

#### Return Value

Either a `Promise` which resolves with the returned value is the last value returned by the top-most function, or `undefined` if this method is already running.

#### Function Parameters

```JavaScript
dispatcher.runAsync( [ interval = 30 [,quantum = null [, throwUp = false ]]] );
```

`interval` (*Optional*) Number

- A cycle delay, in milliseconds, which specifies the length of time to wait in between cycles. During this time, other functions in the asynchronous event loop may execute.

`quantum` (*Optional*) Number

- A timeslice quantum, in milliseconds, which specifies the approximate maximum length of time the dispatcher should cycle per-interval.

`throwUp` (*Optional*) Boolean

- This argument affects how the dispatcher handles uncaught errors. If set to `true` then the dispatcher will stop cycling and re-throw any uncaught errors, otherwise it will terminate the active coroutine and continue cycling.

### `Dispatcher.prototype.runComplete`

Sets the dispatcher to running state and cycles it in run-to-completion mode, only returning when all coroutines have finished executing.

#### Return Value

The returned value is the last value returned by the top-most function.

#### Function Parameters

```JavaScript
dispatcher.runComplete( [ throwUp = false ] );
```

`throwUp` (*Optional*) Boolean

- This argument affects how the dispatcher handles uncaught errors. If set to `true` then the dispatcher will stop cycling and re-throw any uncaught errors, otherwise it will terminate the active coroutine and continue cycling.

### `Dispatcher.prototype.stop`

Stops the dispatcher from cycling, then resets the runqueue's `blockIndex` and `activeBlock`. Can be used to stop `runAsync`.