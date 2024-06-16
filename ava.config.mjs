export default {
	extensions: {
		ts: "module",
	},
	nodeArguments: ["--import=tsimp"],
	serial: true,
	files: ["./tests/unit/**"],
};
