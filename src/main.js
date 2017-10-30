import App from "./App.html";
import prices from "../data/metals.json";

new App({
  target: document.body.querySelector("main"),
  data: {
    startDate: 1980,
    duration: 10,
    prices
  }
});
