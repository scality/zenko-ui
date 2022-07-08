import '@testing-library/jest-dom';
import fetch from 'node-fetch';
import { history } from './src/react/utils/test.tsx';

window.fetch = (url, ...rest) =>
  fetch(/^https?:/.test(url) ? url : new URL(url, 'http://localhost'), ...rest);

afterEach(() => {
  history.push('/');
});
