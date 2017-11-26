import {extent, sum} from "d3-array";
import {nest} from "d3-collection";
import {scaleLinear} from "d3-scale";

import {areaChart} from "../charts";
import margin from "./margin";

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
    
    const caption = selection.selectAll("figcaption").data([period]);
    caption.enter()
        .append("figcaption")
        .html("Total Value of Materials from <span></span> to <span></span>")
      .merge(caption)
      .selectAll("span")
        .data(d => d)
        .text(String);
        
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