import {extent} from "d3-array";
import {nest} from "d3-collection";
import {format} from "d3-format";

import {sparkline} from "../charts";

import table from "./table";

export default function priceTable(selection, data) {
  const period = extent(data, d => d.year);
  
  const caption = selection.selectAll("figcaption").data([undefined]);
  caption.enter()
    .append("figcaption")
    .text("Individual material prices");
    
  const rows = nest()
    .key(d => d.type)
    .sortValues((a, b) => a.year - b.year)
    .entries(data);
      
  const dollars = format("$.2f");
  
  const prices = table()
    .sortBy(4)
    .columns([
      {
        value: d => d.key.split(" ")[0]
      }, {
        classNames: "numeric",
        format: dollars,
        name: period[0],
        value: d => d.values[0].value
      }, {
        classNames: "sparkline",
        format: () => null,
        value: d => d.values.map(v => [v.year, v.value])
      }, {
        classNames: "numeric",
        format: dollars,
        name: period[1],
        value: d => d.values[d.values.length - 1].value
      }, {
        classNames: "numeric",
        format: dollars,
        name: "Change",
        value: d => d.values[d.values.length - 1].value - d.values[0].value
      }
    ]);
  
  const t = selection.selectAll("table").data([rows]);
  t.merge(t.enter().append("table"))
    .call(prices)
    .selectAll("td.sparkline")
    .call(sparkline);
}