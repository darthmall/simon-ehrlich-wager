import {ascending, descending} from "d3-array";

const COLUMN_DEFAULTS = {
  classNames: "",
  format: String,
  name: "",
  value: d => d
};

export default function table() {
  let columns = [],
    reverse = false,
    sortBy;
  
  function chart(sel) {
    const thead = sel.selectAll("thead").data([columns]);
    const th = thead.select("tr").merge(thead.enter()
      .append("thead")
      .append("tr"))
      .selectAll("th")
      .data(d => d);
      
    th.enter()
      .append("th")
      .merge(th)
      .attr("class", d => d.classNames)
      .text(d => d.name);
      
    const tbody = sel.selectAll("tbody").data(rows => [rows]);
    const tr = tbody.merge(tbody.enter().append("tbody"))
      .selectAll("tr")
      .data(d => d);
      
    const td = tr.enter().append("tr")
      .merge(tr)
      .sort(compareRows)
      .selectAll("td")
      .data(d => columns.map(c => c.value(d)));
      
    td.merge(td.enter().append("td"))
      .attr("class", (d, i) => columns[i].classNames)
      .text((d, i) => columns[i].format(d));
  }
  
  chart.columns = function (_) {
    if (arguments.length < 1) return columns;
    columns = _.map(d => Object.assign({}, COLUMN_DEFAULTS, d));
    return chart;
  };
  
  chart.reverse = function (_) {
    if (arguments.length < 1) return reverse;
    reverse = _;
    return chart;
  };
  
  chart.sortBy = function (_) {
    if (arguments.length < 1) return sortBy;
    sortBy = _;
    return chart;
  };
  
  function compareRows(a, b) {
    if (!sortBy) return 0;
    
    const getter = columns[sortBy].value;
    
    return reverse ?
      descending(getter(a), getter(b)) :
      ascending(getter(a), getter(b));      
  }
  
  return chart;
}