export default function margin(m) {
  return function (sel) {
    const g = sel.selectAll(".margin").data([m]);
    
    g.enter()
      .append("g")
        .attr("class", "margin")
      .merge(g)
        .attr("transform", `translate(${m.left || 0}, ${m.top || 0})`);
  }
}