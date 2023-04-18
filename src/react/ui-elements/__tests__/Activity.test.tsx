import Activity, { DEFAULT_MESSAGE } from '../Activity';
import { List } from 'immutable';
import React from 'react';
import { reduxMount } from '../../utils/testUtil';
describe('Activity', () => {
  const TEST_MESSAGE = 'This is a test message';
  it('Activity should render with a custom message', () => {
    const { component } = reduxMount(<Activity />, {
      networkActivity: {
        counter: 1,
        messages: List([TEST_MESSAGE]),
      },
    });
    expect(component.find(Activity).isEmptyRender()).toBe(false);
    expect(component.find('#activity-message').children().at(2).text()).toBe(
      TEST_MESSAGE,
    );
  });
  it('Activity should render with a default message', () => {
    const { component } = reduxMount(<Activity />, {
      networkActivity: {
        counter: 2,
        messages: List(),
      },
    });
    expect(component.find(Activity).isEmptyRender()).toBe(false);
    expect(component.find('#activity-message').children().at(2).text()).toBe(
      DEFAULT_MESSAGE,
    );
  });
  it('Activity should not render', () => {
    const { component } = reduxMount(<Activity />, {
      networkActivity: {
        counter: 0,
        messages: List(),
      },
    });
    expect(component.find(Activity).isEmptyRender()).toBe(true);
  });
});
