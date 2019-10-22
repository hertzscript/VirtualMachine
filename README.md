# HertzScript Virtual Machine

[![NPM](https://nodei.co/npm/hertzscript-vm.png)](https://nodei.co/npm/hertzscript-vm/)

The HertzScript virtual machine context executes code that was compiled by the [HertzScript Compiler](https://github.com/hertzscript/Compiler).

See the [HertzScript Specification](https://github.com/hertzscript/Specification) repository for more information.

Other Module Docs are in the works soon.

- [Context Module](#context-module)
	- [`import`](#contextprototypeimport)
	- [`exec`](#contextprototypeexec)
	- [`enqueue`](#contextprototypeenqueue)
	- [`cycle`](#contextprototypecycle)
	- [`dispatch`](#contextprototypedispatch)
	- [`dispatchAll`](#contextprototypedispatchall)

- Context module

The context module can be run in multiple different execution modes:

- Run-To-Completion
- Synchronous quantum/time-slicing
- Asynchronous quantum/time-slicing

---

## Context Module

The context itself is the main module, so you can import it simply like this:

```JavaScript
const Context = require("hertzscript-context");
// Instantiate the Class
const context = new Context();
```

### `Context.prototype.import`

Imports a pre-compiled HertzScript Module into the context, spawning it as a new coroutine. The module is not immediately executed with this method and is only enqueued for later execution.

#### Function Parameters

```JavaScript
context.import( hzModule );
```

`hzModule` Function

- A `Function` which was previously compiled with `hertzscript-compiler` in `module` mode.

### `Context.prototype.exec`

This method immediately executes the given pre-compiled function or HzModule in run-to-completion mode.

#### Return Value

The returned value is the last value returned by the top-most function.

#### Function Parameters

```JavaScript
context.exec( functor [, thisArg = null [, args = null ]] );
```

`functor` Function

- A function or HzModule which was previously compiled with `hertzscript-compiler`.

`thisArg` (*Optional*) Any

- An optional value to set the `this` variable to when calling `functor`.

`args` (*Optional*) Array

- An optional array to supply as arguments when calling `functor`.

### `Context.prototype.spawn`

Enqueues a new coroutine. The coroutine is not immediately executed with this method and is only enqueued for later execution.

#### Function Parameters

```JavaScript
context.spawn( functor [, thisArg = null [, args = null ]] );
```

`functor` Function

- A function which was previously compiled with `hertzscript-compiler`.

`thisArg` (*Optional*) Any

- An optional value to set the `this` variable to when calling `functor`.

`args` (*Optional*) Array

- An optional array to supply as arguments when calling `functor`.

### `Context.prototype.enqueue`

Adds a pre-compiled function to the end of the active coroutine's call stack, or creates a new coroutine for it if there is no active coroutine. The coroutine is not immediately executed with this method and is only enqueued for later execution.

#### Function Parameters

```JavaScript
context.enqueue( functor [, thisArg = null [, args = null ]] );
```

`functor` Function

- A function which was previously compiled with `hertzscript-compiler`.

`thisArg` (*Optional*) Any

- An optional value to set the `this` variable to when calling `functor`.

`args` (*Optional*) Array

- An optional array to supply as arguments when calling `functor`.

### `Context.prototype.cycle`

If the context is running, then this method cycles the context for a given duration.

#### Return Value

The returned value is the last value returned in the most recent cycle.

#### Function Parameters

```JavaScript
context.cycle( [ quantum = null [, throwUp = false ]] );
```

`quantum` (*Optional*) Number

- A timeslice quantum, in milliseconds, which specifies the approximate maximum length of time the context should cycle.

`throwUp` (*Optional*) Boolean

- This argument affects how the context handles uncaught errors. If set to `true` then the context will stop cycling and re-throw any uncaught errors, otherwise it will terminate the active coroutine and continue cycling.

### `Context.prototype.runSync`

Sets the context to running state and cycles it for a given duration.

#### Return Value

The returned value is the last value returned in the most recent cycle.

#### Function Parameters

```JavaScript
context.dispatch( [ quantum = null [, throwUp = false ]] );
```

`quantum` (*Optional*) Number or Boolean

- A timeslice quantum, in milliseconds, which specifies the approximate maximum length of time the context should cycle. If set to `false` then the context will continue cycling until all coroutines have finished executing.

`throwUp` (*Optional*) Boolean

- This argument affects how the context handles uncaught errors. If set to `true` then the context will stop cycling and re-throw any uncaught errors, otherwise it will terminate the active coroutine and continue cycling.

### `Context.prototype.dispatchAll`

Sets the context to running state and cycles it in run-to-completion mode, only returning when all coroutines have finished executing.

#### Return Value

The returned value is the last value returned by the top-most function.

#### Function Parameters

```JavaScript
context.dispatchAll( [ throwUp = false ] );
```

`throwUp` (*Optional*) Boolean

- This argument affects how the context handles uncaught errors. If set to `true` then the context will stop cycling and re-throw any uncaught errors, otherwise it will terminate the active coroutine and continue cycling.