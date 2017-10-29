const listeners = [];

function onResize() {
  listeners.forEach(cb => cb());
}

export default function subscribe(cb) {
  const idx = listeners.push(cb) - 1;
  return () => listeners.splice(idx, 1);
}

window.addEventListener("resize", onResize);
