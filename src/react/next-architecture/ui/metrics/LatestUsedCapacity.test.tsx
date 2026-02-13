import { UsedCapacity, UsedCapacityInlinePromiseResult } from './LatestUsedCapacity';
import { render, screen, waitFor } from '@testing-library/react';
import { simpleRender } from '../../../utils/testUtil';
import userEvent from '@testing-library/user-event';

const genCapacity = (current = 1024) => {
  return {
    type: 'hasMetrics' as const,
    usedCapacity: {
      current: current,
      nonCurrent: 0,
    },
    measuredOn: new Date('2023-05-22T15:00:05.788Z'),
  };
};

const getTextOnHover = async (element: HTMLElement, text: string | RegExp) => {
  expect(element).toBeInTheDocument();

  await userEvent.hover(element);
  expect(screen.getByText(text)).toBeInTheDocument();
};

describe('UsedCapacityInlinePromiseResult', () => {
  const selectors = {
    iconHelp: () => screen.getByRole('button', { name: /more information/i }),
    minusIcon: () => screen.getByLabelText(/Unknown/i),
  }
  it('display loading on loading state', async () => {
    // S
    render(<UsedCapacityInlinePromiseResult result={{ status: 'loading' }} />);
    // V
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('display loading on unknown state', async () => {
    // S
    render(<UsedCapacityInlinePromiseResult result={{ status: 'unknown' }} />);
    // V
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('display error on error state', async () => {
    // S
    render(
      <UsedCapacityInlinePromiseResult result={{ status: 'error', title: 'errorTitle', reason: 'errorReason' }} />,
    );
    // V
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('display the value and the retrieved date on hover', async () => {
    // S
    simpleRender(
      <UsedCapacityInlinePromiseResult
        result={{
          status: 'success',
          value: genCapacity(132864),
        }}
      />,
    );

    // V
    expect(screen.getByText('129.75 KiB')).toBeInTheDocument();

    // E + V
    
    await getTextOnHover(selectors.iconHelp(), /Retrieved on 2023-05-22 15:00:05/i);
  });
});

describe('UsedCapacity', () => {
  const selectors = {
    iconHelp: () => screen.getByRole('button', { name: /more information/i }),
    minusIcon: () => screen.getByLabelText(/Unknown/i),
  }
  it('display error', async () => {
    // S
    render(
      <UsedCapacity
        value={{
          type: 'error',
        }}
      />,
    );

    // V
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('display "unknown" on hover', async () => {
    // S
    simpleRender(
      <UsedCapacity
        value={{
          type: 'noMetrics',
        }}
      />,
    );

    // E + V
    await getTextOnHover(selectors.minusIcon(), 'unknown');
  });

  it('display the correct values', async () => {
    // S
    const value = genCapacity(132864);
    simpleRender(<UsedCapacity value={value} />);
    // V
    expect(screen.getByText('129.75 KiB')).toBeInTheDocument();

    // E + V
    await getTextOnHover(selectors.iconHelp(), /Retrieved on 2023-05-22 15:00:05/i);
  });

  it('display the correct values 2', async () => {
    // S
    const value = genCapacity(1024);
    simpleRender(<UsedCapacity value={value} />);

    // V
    expect(screen.getByText('1.00 KiB')).toBeInTheDocument();

    // E + V
    await getTextOnHover(selectors.iconHelp(), /Retrieved on 2023-05-22 15:00:05/i);
  });
});
