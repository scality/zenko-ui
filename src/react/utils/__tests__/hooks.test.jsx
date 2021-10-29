import * as hooks from '../hooks';
import React, { useRef } from 'react';
import { useHeight, useOutsideClick } from '../hooks';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';

const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetHeight',
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetWidth',
);

const Component = () => {
  const ref = useRef(null);
  const height = useHeight(ref);

  useOutsideClick(ref, () => {});

  return (
    <div ref={ref} style={{ height: '100%' }}>
      {height}
    </div>
  );
};

const fireResizeEvent = (x, y) => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: y,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: x,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('hooks', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 500,
    });
  });

  afterAll(() => {
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetHeight',
      originalOffsetHeight,
    );
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetWidth',
      originalOffsetWidth,
    );
  });

  it('should return an height if a window resize event is catch', async () => {
    const useHeightMock = jest.spyOn(hooks, 'useHeight');

    const component = mount(<Component />);

    expect(component.find('div').text()).toBe('500');

    await act(async () => {
      fireResizeEvent(300, 300);
      component.update();
    });

    expect(useHeightMock).toHaveBeenCalled();
    expect(component.find('div').text()).toBe('300');
  });

  it('should trigger if a click occurs outside the component', async () => {
    const useOutsideClickMock = jest
      .spyOn(hooks, 'useOutsideClick')
      .mockImplementation(() => {});

    const component = mount(
      <div>
        <Component />
        <button onClick={() => {}}>Click</button>
      </div>,
    );

    component.find('button').simulate('click');

    expect(useOutsideClickMock).toHaveBeenCalled();
  });
});
