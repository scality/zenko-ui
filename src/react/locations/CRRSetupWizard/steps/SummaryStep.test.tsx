import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { Wrapper } from '../../../utils/testUtil';
import { SummaryStep } from './SummaryStep';

const CurrentPath = () => <div data-testid="path">{useLocation().pathname}</div>;

const renderSummary = (props: Parameters<typeof SummaryStep>[0]) =>
  render(
    <>
      <SummaryStep {...props} />
      <CurrentPath />
    </>,
    { wrapper: Wrapper },
  );

const baseProps = {
  accountName: 'source-account',
  destinationAccountName: 'crr-dest',
  url: 'https://10.0.0.42:8443',
  createReplicationRule: true,
  sourceBucketName: 'my-source',
  targetBucketName: 'my-target',
};

describe('SummaryStep', () => {
  it('recaps the replication rule and both buckets, then sends the user to the new source bucket on Finish', async () => {
    renderSummary(baseProps);

    expect(screen.getByText('Location Name')).toBeInTheDocument();
    expect(screen.getByText('Replication Rule')).toBeInTheDocument();
    expect(screen.getByText('my-source')).toBeInTheDocument();
    expect(screen.getByText('my-target')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Finish/i }));

    expect(screen.getByTestId('path')).toHaveTextContent('/accounts/source-account/buckets/my-source');
  });

  it('recaps only the location and sends the user to the buckets list on Finish when no rule was configured', async () => {
    renderSummary({ ...baseProps, createReplicationRule: false });

    expect(screen.getByText('Location Name')).toBeInTheDocument();
    expect(screen.queryByText('Replication Rule')).not.toBeInTheDocument();
    expect(screen.queryByText('my-source')).not.toBeInTheDocument();
    expect(screen.queryByText('my-target')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Finish/i }));

    expect(screen.getByTestId('path')).toHaveTextContent('/buckets');
  });
});
