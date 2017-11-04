import {line} from "d3-shape";

export default function pathString(x, y, values) {
  return (line()
    .x(d => x.scale(x.value(d)))
    .y(d => y.scale(y.value(d)))(values));
}
