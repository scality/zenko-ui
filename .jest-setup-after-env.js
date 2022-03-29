import '@testing-library/jest-dom';
import fetch from 'node-fetch';

window.fetch = (url, ...rest) =>
  fetch(/^https?:/.test(url) ? url : new URL(url, 'http://localhost'), ...rest);
