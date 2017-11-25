import {select} from "d3-selection";

import {priceTable, totalValue} from "./components";
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
  priceTableFigure = main.append("figure");
  
const total = totalValue();

function update() {
  draw(simonEhrlichWager(prices,
    state.startYear,
    state.endYear,
    state.initialValue));
}

function draw(data) {
  totalValueFigure.call(total.data(data));
  priceTableFigure.call(priceTable, data);
}

update();

// FIXME: This is a little wasteful, since we only need to redraw, but
// we're triggering a recalculation of all the data here.
window.onresize = update;