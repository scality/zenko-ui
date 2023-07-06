import Activity, { DEFAULT_MESSAGE } from '../Activity';
import { List } from 'immutable';
import { reduxMount, renderWithRouterMatch } from '../../utils/testUtil';
import { screen } from '@testing-library/react';

describe('Activity', () => {
  const TEST_MESSAGE = 'This is a test message';
  it('Activity should render with a custom message', () => {
    renderWithRouterMatch(<Activity />, undefined, {
      networkActivity: {
        counter: 1,
        messages: List([TEST_MESSAGE]),
      },
    });

    expect(screen.getByText(TEST_MESSAGE)).toBeInTheDocument();
  });
  it('Activity should render with a default message', () => {
    renderWithRouterMatch(<Activity />, undefined, {
      networkActivity: {
        counter: 2,
        messages: List(),
      },
    });

    expect(screen.getByText(DEFAULT_MESSAGE)).toBeInTheDocument();
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
