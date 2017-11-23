import {area, line} from "d3-shape";

function bounds(arr) {
  return [arr[0], arr[arr.length - 1]];
}

export default function areaChart() {
  const _line = line(),
    _area = area();
  
  function chart(sel) {
    let series = sel.selectAll(".series").data(d => [d]);
    
    series.exit().remove();
    
    series = series.enter()
      .append("g")
        .attr("class", "series")
      .merge(series);
      
    const fill = series.selectAll(".area-fill").data(d => [d.values]);
    
    fill.enter().append("path")
        .attr("class", "area-fill")
      .merge(fill)
        .attr("d", _area);
        
    const stroke = series.selectAll(".area-stroke").data(d => [d.values]);
    
    stroke.enter().append("path")
        .attr("class", "area-stroke")
      .merge(stroke)
        .attr("d", _line);
        
    const point = series.selectAll(".point").data(d => bounds(d.values));
    const text = point.select("text");
      
    point.exit().remove();
    
    const pointEnter = point.enter().append("g")
        .attr("class", "point");
    
    pointEnter.append("circle").attr("r", 4);
    
    text.merge(pointEnter.append("text")
      .html("<tspan></tspan><tspan></tspan>"))
        .attr("text-anchor", (d, i) => i === 0 ? "end" : "start")
        .attr("transform", (d, i) => `translate(${i === 0 ? -8 : 8}, 0)`)
      .selectAll("tspan")
        .data(d => [d.key, d.value])
        .attr("x", 0)
        .attr("dy", (d, i) => `${i * 1.2}em`)
        .text(String);
        
    point.merge(pointEnter)
      .attr("transform", d => `translate(${_line.x()(d)}, ${_line.y()(d)})`);
  }
  
  chart.x = function (_) {
    if (arguments.length < 1) return _line.x();
    _line.x(_);
    _area.x(_);
    return chart;
  };
  
  chart.y0 = function (_) {
    if (arguments.length < 1) return _area.y0();
    _area.y0(_);
    return chart;
  };
  
  chart.y1 = function (_) {
    if (arguments.length < 1) return _area.y1();
    _line.y(_);
    _area.y1(_);
    return chart;
  };
  
  return chart;
}