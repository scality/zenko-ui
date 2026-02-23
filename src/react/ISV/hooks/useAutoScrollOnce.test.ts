import { renderHook } from '@testing-library/react-hooks';
import { useAutoScrollOnce } from './useAutoScrollOnce';

function createMockContainer(scrollHeight: number, clientHeight: number) {
  const container = document.createElement('div');
  Object.defineProperty(container, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: clientHeight, configurable: true });
  return container;
}

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('useAutoScrollOnce', () => {
  it('scrolls to the bottom immediately when content already overflows', () => {
    const container = createMockContainer(1000, 400);
    const { result } = renderHook(() => useAutoScrollOnce());

    result.current(container);

    expect(container.scrollTop).toBe(1000);
  });

  it('does not scroll when content fits without overflow', () => {
    const container = createMockContainer(200, 400);
    const { result } = renderHook(() => useAutoScrollOnce());

    result.current(container);

    expect(container.scrollTop).toBe(0);
  });

  it('scrolls once when content starts overflowing after DOM mutation', async () => {
    const container = createMockContainer(200, 400);
    const { result } = renderHook(() => useAutoScrollOnce());

    result.current(container);
    expect(container.scrollTop).toBe(0);

    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    container.appendChild(document.createElement('div'));
    await flushMicrotasks();

    expect(container.scrollTop).toBe(1000);
  });

  it('does not scroll again after subsequent DOM mutations', async () => {
    const container = createMockContainer(200, 400);
    const { result } = renderHook(() => useAutoScrollOnce());

    result.current(container);

    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    container.appendChild(document.createElement('div'));
    await flushMicrotasks();
    expect(container.scrollTop).toBe(1000);

    container.scrollTop = 200;

    Object.defineProperty(container, 'scrollHeight', { value: 1200, configurable: true });
    container.appendChild(document.createElement('div'));
    await flushMicrotasks();

    expect(container.scrollTop).toBe(200);
  });

  it('cleans up observer when called with null', async () => {
    const container = createMockContainer(200, 400);
    const { result } = renderHook(() => useAutoScrollOnce());

    result.current(container);
    result.current(null);

    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    container.appendChild(document.createElement('div'));
    await flushMicrotasks();

    expect(container.scrollTop).toBe(0);
  });
});
