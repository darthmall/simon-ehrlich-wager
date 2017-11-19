export default function size(svg) {
  svg.attr("viewBox", function () {
    const bbox = this.getBoundingClientRect();
    return `0 0 ${bbox.width} ${bbox.height}`;
  });
}