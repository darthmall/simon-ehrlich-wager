import {range as d3_range} from "d3-array";
import {axisBottom} from "d3-axis";
import {dispatch} from "d3-dispatch";
import {scalePoint} from "d3-scale";
import {mouse} from "d3-selection";
import {voronoi} from "d3-voronoi";

const THUMB_SIZE = 11;

export default function dateSlider() {
  let range = [0, 1],
    step = 1;
  
  const x = scalePoint();
  
  const listeners = dispatch("change");
  
  function component(sel) {
    sel.attr("viewBox", function () {
      const {width} = this.getBoundingClientRect();
      
      x.domain(d3_range(range[0], range[1] + step, step))
          .range([0, width]);
      
      return `0 0 ${width} 60`;
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
          const [lower, upper] = x.range();
          return upper - lower;
        });
        
    slider.select(".track--selection")
        .attr("x", function (d) {
          return x(d[0]);
        })
        .attr("width", function (d) {
          return x(d[1]) - x(d[0]);
        });
        
    const thumb = slider.selectAll("[role=slider]")
        .data(d => d);
        
    thumb.enter().append("circle")
        .attr("role", "slider")
        .attr("r", THUMB_SIZE / 2)
        .attr("cy", THUMB_SIZE / 2)
      .merge(thumb)
        .attr("cx", function (d) {
          return x(d);
        });
      
    let axis = sel.selectAll(".axis--x").data(d => [d]);
    
    // Initialize the axis
    axis = axis.enter()
      .append("g")
        .attr("class", "axis--x")
        .attr("transform", "translate(0, 15)")
      .merge(axis)
        .call(axisBottom(x)
            .tickSize(28)
            .tickPadding(4)
            .tickFormat(String))
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
    
    const cells = voronoi()
        .size([x.range()[1], 60])
        .x(d => x(d))
        .y(30);
        
    const interaction = sel.selectAll(".interaction")
        .data([cells.polygons(x.domain())]);
    
    const path = interaction.enter()
      .append("g")
        .attr("class", "interaction")
      .merge(interaction)
      .selectAll(".cell")
        .data(d => d);
        
    path.enter()
      .append("path")
        .attr("class", "cell")
        .on("mousedown", function (d) { onMouseDown(sel); })
      .merge(path)
        .attr("d", d => d ? `M${d.join("L")}Z` : null);
  }
  
  component.on = function () {
    const value = listeners.on.apply(listeners, arguments);
    return value === listeners ? component : value;
  };
  
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
  
  function onMouseDown(sel) {
    function cleanup() {
      sel.selectAll(".cell").on("mouseover", null);
    }
    
    function onMouseOver(d) {
      const value = lower ? [d.data, sel.datum()[1]] : [sel.datum()[0], d.data];
      listeners.call("change", sel.node(), value);
    }
    
    let grabbing;
    
    const [cx, cy] = mouse(sel.node());
      
    if (cy > THUMB_SIZE) return;
    
    const [lx, ux] = sel.datum().map(x),
      r = THUMB_SIZE / 2,
      lv = [cx - lx, cy - r],
      uv = [cx - ux, cy - r];

    if ((lv[0] * lv[0]) + (lv[1] * lv[1]) <= r * r) {
      grabbing = "lower";
    } else if ((uv[0] * uv[0]) + (uv[1] * uv[1]) <= r * r) {
      grabbing = "upper";
    }
    
    if (!grabbing) return;
    
    const lower = grabbing === "lower";
    
    sel.selectAll(".cell").on("mouseover", onMouseOver);
    window.addEventListener("mouseup", cleanup, {once: true, passive: true});
  }
  
  return component;
}