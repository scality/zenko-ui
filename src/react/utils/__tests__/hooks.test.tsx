import { useRef } from 'react';
import { useOutsideClick, usePrefixWithSlash } from '../hooks';
import { renderHook } from '@testing-library/react-hooks';
import { NewWrapper } from '../testUtil';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('hooks', () => {
  it('should trigger if a click occurs outside the component', async () => {
    const expectedToBeCalled = jest.fn();
    const SUT = () => {
      const ref = useRef(null);
      useOutsideClick(ref, expectedToBeCalled);
      return (
        <div
          ref={ref}
          style={{
            height: '100%',
          }}
        >
          inside
        </div>
      );
    };
    render(
      <div>
        <SUT />
        <div>outside</div>
      </div>,
    );

    await userEvent.click(screen.getByText(/inside/));
    expect(expectedToBeCalled).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText(/outside/));
    expect(expectedToBeCalled).toHaveBeenCalled();
  });
});
describe('usePrefixWithSlash', () => {
  test('should return empty string in root path of the bucket', () => {
    const { result } = renderHook(() => usePrefixWithSlash(), {
      wrapper: NewWrapper('/buckets/test/objects'),
    });
    expect(result.current).toBe('');
  });
  test('should return empty string when an object is select in the root of bucket', () => {
    const { result } = renderHook(() => usePrefixWithSlash(), {
      wrapper: NewWrapper('/buckets/test/objects?prefix=object1'),
    });
    expect(result.current).toBe('');
  });
  test('should return foldername with trailing slash when inside a folder', () => {
    const { result } = renderHook(() => usePrefixWithSlash(), {
      wrapper: NewWrapper('/buckets/test/objects?prefix=folder/'),
    });
    expect(result.current).toBe('folder/');
  });
  test('should return foldername with trailing slash when inside a folder and select an object', () => {
    const { result } = renderHook(() => usePrefixWithSlash(), {
      wrapper: NewWrapper('/buckets/test/objects?prefix=folder/object'),
    });
    expect(result.current).toBe('folder/');
  });
});
