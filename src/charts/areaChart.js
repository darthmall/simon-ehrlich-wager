import {area, line, curveCatmullRom} from "d3-shape";

export default function areaChart() {
  const _line = line().curve(curveCatmullRom),
    _area = area().curve(curveCatmullRom);
  
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
        
    const point = series.selectAll("circle").data(d => d.values);
    
    point.exit().remove();
    
    point.enter().append("circle")
        .attr("r", 4)
      .merge(point)
        .attr("cx", _line.x())
        .attr("cy", _line.y());
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