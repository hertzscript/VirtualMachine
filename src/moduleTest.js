const hzModule = require("./module.hz.js");
const Dispatcher = require("./Dispatcher.js");
const hzDisp = new Dispatcher();
hzDisp.import(hzModule);
hzDisp.runComplete();