import {
  UsedCapacity,
  UsedCapacityInlinePromiseResult,
} from './LatestUsedCapacity';
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

describe('UsedCapacityInlinePromiseResult', () => {
  it('display loading on loading state', async () => {
    render(<UsedCapacityInlinePromiseResult result={{ status: 'loading' }} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('display loading on unknown state', async () => {
    render(<UsedCapacityInlinePromiseResult result={{ status: 'unknown' }} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('display error on error state', async () => {
    render(
      <UsedCapacityInlinePromiseResult
        result={{ status: 'error', title: 'errorTitle', reason: 'errorReason' }}
      />,
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('display the value and the retrieved date ', async () => {
    simpleRender(
      <UsedCapacityInlinePromiseResult
        result={{
          status: 'success',
          value: genCapacity(132864),
        }}
      />,
    );

    expect(screen.getByText('129.75 KiB')).toBeInTheDocument();
  });
});

describe('UsedCapacity', () => {
  it('display error', async () => {
    render(
      <UsedCapacity
        value={{
          type: 'error',
        }}
      />,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('display "unknown" on hover', async () => {
    simpleRender(
      <UsedCapacity
        value={{
          type: 'noMetrics',
        }}
      />,
    );

    await waitFor(() => {
      return screen.getByLabelText(/minus/i).tagName === 'svg'
        ? Promise.resolve()
        : Promise.reject();
    });

    userEvent.hover(screen.getByLabelText(/minus/i));

    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('display the correct values', async () => {
    const value = genCapacity(132864);

    simpleRender(<UsedCapacity value={value} />);
    expect(screen.getByText('129.75 KiB')).toBeInTheDocument();
  });

  it('display the correct values 2', async () => {
    const value = genCapacity(1024);

    simpleRender(<UsedCapacity value={value} />);
    expect(screen.getByText('1.00 KiB')).toBeInTheDocument();
  });
});
