import { ensureHttpsPrefix } from './ensureHttpsPrefix';

describe('ensureHttpsPrefix', () => {
  it('returns empty string for empty input', () => {
    expect(ensureHttpsPrefix('')).toBe('');
  });

  it('preserves existing https:// prefix', () => {
    expect(ensureHttpsPrefix('https://example.com')).toBe('https://example.com');
  });

  it('preserves existing http:// prefix', () => {
    expect(ensureHttpsPrefix('http://example.com')).toBe('http://example.com');
  });

  it('adds https:// prefix when missing', () => {
    expect(ensureHttpsPrefix('example.com')).toBe('https://example.com');
  });

  it('adds https:// prefix to IP addresses', () => {
    expect(ensureHttpsPrefix('192.168.1.1')).toBe('https://192.168.1.1');
  });

  it('adds https:// prefix to URLs with port', () => {
    expect(ensureHttpsPrefix('example.com:8443')).toBe('https://example.com:8443');
  });

  it('handles URLs with paths', () => {
    expect(ensureHttpsPrefix('example.com/path')).toBe('https://example.com/path');
    expect(ensureHttpsPrefix('https://example.com/path')).toBe('https://example.com/path');
  });
});
