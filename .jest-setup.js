import 'regenerator-runtime/runtime';
import { TextEncoder, TextDecoder, ReadableStream } from 'util';

Object.assign(global, { TextDecoder, TextEncoder, ReadableStream });

HTMLCanvasElement.prototype.getContext = () => {
  // return whatever getContext has to return
};

// Deliberately NO ResizeObserver here. jsdom performs no layout, so a mock can only
// ever report a 0px box, and core-ui's container-width hook treats a measured 0 as a
// real narrow container: every `dropAt` column would drop and every `iconOnly` button
// would collapse in tests. With ResizeObserver absent the hook leaves the width
// undefined, which it reads as "unknown" and renders the wide layout.


// CodeMirror requires DOM measurement APIs unavailable in jsdom
const emptyDOMRect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
document.createRange = () => {
  const range = new Range();
  range.getBoundingClientRect = () => emptyDOMRect;
  range.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} });
  return range;
};

if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () => emptyDOMRect;
}
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} });
}
