import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";

import pkg from "./package.json" assert { type: "json" };

const production = process.env.NODE_ENV === "production";

export default [
	{
		input: "./src/index.ts",
		external: Object.keys(pkg.dependencies).map((item) => new RegExp(`^${item}`)),
		output: [
			{
				file: pkg.main,
				format: "cjs",
				sourcemap: !production,
			},
			{
				file: pkg.module,
				format: "esm",
				sourcemap: !production,
			},
		],
		plugins: [
			resolve(),
			typescript(),
			commonjs(),
			production &&
				terser({
					format: { comments: false },
					mangle: {
						keep_classnames: true,
					},
					compress: {
						keep_classnames: true,
					},
				}),
			production &&
				del({
					targets: "./dist/",
					hook: "buildStart",
				}),
		],
	},
	{
		input: "./dist/dts/src/index.d.ts",
		output: [{ file: pkg.types, format: "esm" }],
		plugins: [
			dts(),
			production &&
				del({
					targets: "./dist/dts",
					hook: "buildEnd",
				}),
		],
	},
];
