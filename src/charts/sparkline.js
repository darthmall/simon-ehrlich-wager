import {extent} from "d3-array";
import {scaleLinear} from "d3-scale";
import {select} from "d3-selection";
import {line} from "d3-shape";

const THICKNESS = 2;

export default function sparkline(sel) {
  sel.each(function (data) {
    const el = select(this);
    
    let svg = el.selectAll("svg").data([data]);
    
    const svgEnter = svg.enter().append("svg");
    svgEnter.append("path");
      
    let width, height;
    
    svg = svg.merge(svgEnter)
      .attr("viewBox", function () {
        const bbox = this.getBoundingClientRect();
        
        width = bbox.width;
        height = bbox.height;
        
        return `0 0 ${width} ${height}`;
      });
    
    const x = scaleLinear()
        .domain(extent(data, d => d[0]))
        .range([THICKNESS, width - (2 * THICKNESS)]);
    
    const y = scaleLinear()
        .domain(extent(data, d => d[1]))
        .range([height - (2 * THICKNESS), THICKNESS]);
        
    const pathString = line()
        .x(d => x(d[0]))
        .y(d => y(d[1]));
        
    svg.select("path")
        .style("stroke-width", `${THICKNESS}px`)
        .attr("d", pathString);
        
    const bounds = [data[0], data[data.length - 1]];
    const circle = svg.selectAll("circle").data(bounds);
    
    circle.enter().append("circle")
        .attr("r", THICKNESS)
      .merge(circle)
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]));
  });
}