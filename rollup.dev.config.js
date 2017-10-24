import serve from "rollup-plugin-serve";
import rollup from "./rollup.config.js";

// Override the destination to keep our dev builds separate from our production
// builds to avoid dropping the sourcemap into the production buld.
rollup.dest = "./build/main.js";

// Turn on sourcemaps for development.
rollup.sourceMap = true;

// Add a webserver on port 8000.
rollup.plugins.push(
  serve({
    contentBase: ["build", "static"],
    port: 8000
  })
);

export default rollup;