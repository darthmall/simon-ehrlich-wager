import {nest} from "d3-collection";

import App from "./App.html";
import prices from "../data/metals.json";

new App({
  target: document.body.querySelector("main"),
  data: {
    startDate: 1980,
    duration: 10,
    prices: nest()
      .key(d => d.type)
      .sortValues((a, b) => a.year - b.year)
      .entries(prices)
  }
});
