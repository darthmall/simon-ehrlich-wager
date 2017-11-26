import {extent} from "d3-array";
import {select} from "d3-selection";

import {dateSlider, priceTable, totalValue} from "./components";
import {simonEhrlichWager} from "./model";
import prices from "../data/metals.json";

let state = {
  startYear: 1980,
  endYear: 1990,
  initialValue: 1000
};

const main = select("#root");

main.append("header")
  .append("h1")
  .text("Simon-Ehrlich Wager");
  
const totalValueFigure = main.append("figure"),
  priceTableFigure = main.append("figure"),
  yearSlider = main.append("svg");
  
const total = totalValue(),
  slider = dateSlider().range(extent(prices, d => d.year));

slider.on("change", function (data) {
  state.startYear = data[0];
  state.endYear = data[1];
  update();
});

function update() {
  draw(simonEhrlichWager(prices,
    state.startYear,
    state.endYear,
    state.initialValue));
}

function draw(data) {
  totalValueFigure.call(total.data(data));
  priceTableFigure.call(priceTable, data);
  yearSlider.datum([state.startYear, state.endYear]).call(slider);
}

update();

// FIXME: This is a little wasteful, since we only need to redraw, but
// we're triggering a recalculation of all the data here.
window.onresize = update;