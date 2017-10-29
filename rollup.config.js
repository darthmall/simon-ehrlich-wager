import babel from "rollup-plugin-babel";
import eslint from "rollup-plugin-eslint";
import json from "rollup-plugin-json";
import resolve from "rollup-plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import uglify from "rollup-plugin-uglify";

export default {
  entry: "src/main.js",
  dest: "dist/main.js",
  format: "iife",
  plugins: [
    resolve(),
    json({preferConst: true}),
    eslint({include: ["./src/**/*.js"]}),
    svelte(),
    babel(),
    uglify()
  ]
};