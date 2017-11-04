import App from "./App.html";
import prices from "../data/metals.json";

new App({
  target: document.body.querySelector("main"),
  data: {
    startDate: 1980,
    endDate: 1990,
    prices
  }
});
