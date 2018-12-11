var global = typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {};
const hzDispatcher = require("./Dispatcher.js");
const hzDisp = new hzDispatcher(("hzTknLib" in global) ? global.hzTknLib : null);
if (!("hzTknLib" in global)) global.hzTknLib = hzDisp.tokenLib;