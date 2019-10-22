module.exports = {
	Context: require("./Context.js"),
	VirtualMachine: require("./VirtualMachine.js"),
	lib: {
		Kernelizer: require("./lib/Kernelizer.js"),
		TokenLib: require("./lib/TokenLib.js"),
		DetourLib: require("./lib/DetourLib.js"),
		UserLib: require("./lib/UserLib.js"),
		StackFrame: require("./lib/StackFrame.js"),
		ControlBlock: require("./lib/ControlBlock.js")
	}
};