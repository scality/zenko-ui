import 'regenerator-runtime/runtime';
import { TextEncoder, TextDecoder, ReadableStream } from 'util';

Object.assign(global, { TextDecoder, TextEncoder, ReadableStream });

HTMLCanvasElement.prototype.getContext = () => {
  // return whatever getContext has to return
};

// Deliberately no ResizeObserver mock: jsdom does no layout, so a mock could only report a 0px
// box, which core-ui's container-width hook would read as a real narrow container and collapse
// every dropAt/iconOnly. Absent, the hook treats the width as unknown and renders wide.

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
