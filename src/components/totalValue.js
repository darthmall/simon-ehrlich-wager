import {extent, sum} from "d3-array";
import {nest} from "d3-collection";

import {size} from "../utils";

import {areaChart} from "../charts";
import margin from "./margin";

export default function totalValue() {
  let _data = [];
  
  let _margin = {
    left: 46,
    right: 46
  };
  
  function component(selection) {
    const period = extent(_data, d => d.key);
    
    const caption = selection.selectAll("figcaption").data([period]);
    caption.enter()
        .append("figcaption")
        .html("Total Value of Materials from <span></span> to <span></span>")
      .merge(caption)
        .selectAll("span").data(d => d)
        .text(String);
    
    const svg = selection.selectAll("svg").data([_data]);
    svg.enter().append("svg")
      .merge(svg)
        .call(size)
        .call(margin(_margin))
      .selectAll(".margin").data(d => [d])
        .call(areaChart);
  }
  
  component.data = function (_) {
    if (arguments.length < 1) return _data;
    
    _data = nest()
      .key(d => d.year)
      .rollup(values => sum(values, d => d.value))
      .entries(_);
  
    return component;
  };
  
  return component;
}