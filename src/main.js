import {select} from "d3-selection";

import {totalValue} from "./components";
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
  
const totalValueFigure = main.append("figure");
const total = totalValue();

function update() {
  draw(simonEhrlichWager(prices,
    state.startYear,
    state.endYear,
    state.initialValue));
}

function draw(data) {
  totalValueFigure.call(total.data(data));
}

update();