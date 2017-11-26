import {extent, sum} from "d3-array";
import {nest} from "d3-collection";
import {format} from "d3-format";
import {scaleLinear} from "d3-scale";

import {areaChart} from "../charts";
import margin from "./margin";

const dollars = format("$.0f");

function captionText(d) {
  if (d.delta === 0) {
    return `The total value of the materials was the same in
      ${d.period[1]} as in ${d.period[0]}`;
  }
  
  const amount = Math.abs(d.delta),
    adjective = d.delta < 0 ? "lower" : "higher";
    
  return `The total value of the materials was ${dollars(amount)} ${adjective}
    in ${d.period[1]} than in ${d.period[0]}`;
}

export default function totalValue() {
  let _data = [];
  
  let _margin = {
    top: 18,
    left: 46,
    bottom: 18,
    right: 46
  };
  
  const _chart = areaChart();
  
  function component(selection) {
    const period = extent(_data, d => d.key);
    
    const delta = _data.filter(d => period.indexOf(d.key) > -1)
        .sort((a, b) => b.key - a.key)
        .map(d => d.value)
        .reduce((a, b) => a - b);
    
    const caption = selection.selectAll("figcaption")
        .data([{period, delta}]);
        
    caption.enter()
        .append("figcaption")
      .merge(caption)
        .text(captionText);
        
    let width = 0,
      height = 0;
      
    let svg = selection.selectAll("svg")
      .data([{series: "total", values: _data}]);
      
    svg = svg.enter().append("svg")
      .merge(svg)
        .attr("viewBox", function () {
          const bbox = this.getBoundingClientRect(),
            aspect = window.innerWidth / window.innerHeight;
          
          width = bbox.width;
          height = Math.min(width, width / aspect);
          
          return `0 0 ${width} ${height}`;
        })
        .call(margin(_margin));
        
    const x = scaleLinear()
        .domain(period)
        .range([0, width - _margin.left - _margin.right]);
        
    const y = scaleLinear()
      .domain(extent(_data, d => d.value))
      .range([height - _margin.top - _margin.bottom, 0]);
      
    _chart.x(d => x(d.key))
      .y0(y(_data[0].value))
      .y1(d => y(d.value));
        
    svg.selectAll(".margin")
        .style("stroke", "#EBAF6A")
        .style("fill", "#EBAF6A")
        .data(d => [d])
        .call(_chart);
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