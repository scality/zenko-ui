import 'regenerator-runtime/runtime';
import { TextEncoder, TextDecoder, ReadableStream } from 'util';

Object.assign(global, { TextDecoder, TextEncoder, ReadableStream });

HTMLCanvasElement.prototype.getContext = () => {
  // return whatever getContext has to return
};
