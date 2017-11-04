import {line} from "d3-shape";

export default function pathString(x, y, values) {
  console.log("x", x.scale.domain(), x.scale.range());
  console.log("y", y.scale.domain(), y.scale.range());
  
  return (line()
    .x(d => x.scale(x.value(d)))
    .y(d => y.scale(y.value(d)))(values));
}
