import {range as d3_range} from "d3-array"
import {axisBottom} from "d3-axis";
import {scaleLinear} from "d3-scale";
import {local} from "d3-selection";

export default function dateSlider() {
  let range = [0, 1],
    step = 1;
  
  const x = local();
  
  function component(sel) {
    sel.each(function () {
      const bbox = this.getBoundingClientRect();
      
      x.set(this, scaleLinear()
        .domain(range)
        .range([0, bbox.width])
      );
      
      this.setAttribute("viewBox", `0 0 ${bbox.width} 60`);
    });
    
    let slider = sel.selectAll(".slider").data(d => [d]),
      sliderEnter = slider.enter().append("g")
          .attr("class", "slider");
          
    sliderEnter.append("rect")
        .attr("class", "track track--bg")
        .attr("y", 4)
        .attr("height", 4);
      
    sliderEnter.append("rect")
        .attr("class", "track track--selection")
        .attr("y", 4)
        .attr("height", 4);
      
    slider = slider.merge(sliderEnter);
    
    slider.select(".track--bg")
        .attr("width", function () {
          const [lower, upper] = x.get(this).range();
          return upper - lower;
        });
        
    slider.select(".track--selection")
        .attr("x", function (d) {
          return x.get(this)(d[0]);
        })
        .attr("width", function (d) {
          const scale = x.get(this);
          return scale(d[1]) - scale(d[0]);
        });
        
    const thumb = slider.selectAll("[role=slider]")
        .data(d => d);
        
    thumb.enter().append("circle")
        .attr("role", "slider")
        .attr("r", 5.5)
        .attr("cy", 5.5)
      .merge(thumb)
        .attr("cx", function (d) {
          return x.get(this)(d);
        });
      
    let axis = sel.selectAll(".axis--x").data(d => [d]);
    
    // Initialize the axis
    axis = axis.enter()
      .append("g")
        .attr("class", "axis--x")
        .attr("transform", "translate(0, 15)")
      .merge(axis)
        .call(function (ax) {
          const scale = x.get(ax.node()),
            [lower, upper] = scale.domain();
            
          ax.call(axisBottom(scale)
            .tickSize(28)
            .tickPadding(4)
            .tickFormat(String)
            .tickValues(d3_range(lower, upper + 1, step))
          );
        })
        .attr("font-size", null);
    
    // Modify the axis to suit our style
    axis.selectAll(".domain").remove();
    
    axis.selectAll(".axis--selection text").remove();
    
    const minorTicks = axis.selectAll(".tick")
      .filter(d => d % 10)
      .classed("tick--minor", true);
      
    minorTicks.select("text").remove();
    minorTicks.select("line").attr("y2", 18);
    
    sel.call(function (s) {
      const [lower, upper] = s.datum();
      s.selectAll(".tick")
          .classed("tick--selection", d => (d >= lower && d<= upper));
    });
  }
  
  component.range = function (_) {
    if (arguments.length < 1) return range;
    range = _;
    return component;
  };
  
  component.step = function (_) {
    if (arguments.length < 1) return step;
    step = _;
    return component;
  };
  
  return component;
}