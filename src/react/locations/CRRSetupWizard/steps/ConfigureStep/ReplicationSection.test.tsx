import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { Wrapper } from '../../../../utils/testUtil';
import type { AccountBuckets } from './BucketChoiceFields';
import { ReplicationSection } from './ReplicationSection';
import { type ConfigureFormValues, defaultConfigureValues } from './schema';

jest.mock('./SourceBucketChoiceFields', () => ({ SourceBucketChoiceFields: () => null }));

const overrideWarning = /are kept; this one is added next to them/i;

// jsdom doesn't implement scrollIntoView, which the section calls when it opens.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const Harness = ({
  overrides,
  destinationBuckets = null,
}: {
  overrides?: Partial<ConfigureFormValues>;
  destinationBuckets?: AccountBuckets;
}) => {
  const methods = useForm<ConfigureFormValues>({
    defaultValues: { ...defaultConfigureValues, createReplicationRule: true, ...overrides },
  });
  return (
    <FormProvider {...methods}>
      <ReplicationSection destinationBuckets={destinationBuckets} />
      <button type="button" onClick={() => methods.setValue('sourceObjectLockEnabled', true)}>
        lock source
      </button>
      <output data-testid="target">{methods.watch('targetBucketName')}</output>
    </FormProvider>
  );
};

describe('CRR wizard — replication rule override caution', () => {
  it("warns, when reusing an existing account, that a rule replaces the source bucket's existing one", () => {
    render(<Harness overrides={{ accountNameType: 'existing' }} />, { wrapper: Wrapper });

    expect(screen.getByText(overrideWarning)).toBeInTheDocument();
  });

  it('shows no caution when a new source account is created (the bucket cannot pre-exist)', () => {
    render(<Harness overrides={{ accountNameType: 'create' }} />, { wrapper: Wrapper });

    expect(screen.queryByText(overrideWarning)).not.toBeInTheDocument();
  });

  it('shows no caution when the replication rule is not requested', () => {
    render(<Harness overrides={{ accountNameType: 'existing', createReplicationRule: false }} />, { wrapper: Wrapper });

    expect(screen.queryByText(overrideWarning)).not.toBeInTheDocument();
  });
});

describe('CRR wizard — destination buckets when the source has Object Lock', () => {
  const REASON = /Object Lock is not enabled on this bucket and can only be enabled when a bucket is created/i;
  const destination = (unlockedNames: string[]): AccountBuckets => ({
    names: ['a', 'b', 'c'],
    unlockedNames,
    isLoading: false,
    isError: false,
  });
  const reuseRadio = () => screen.getByRole('radio', { name: /Use an existing Bucket/i });
  const openList = async () => {
    await userEvent.click(await screen.findByText('Select existing bucket'));
  };
  const option = (name: string) => screen.getByRole('option', { name });

  it('disables only the buckets known to lack Object Lock, and gives the reason', async () => {
    render(
      <Harness
        overrides={{ sourceObjectLockEnabled: true, targetBucketNameType: 'existing' }}
        destinationBuckets={destination(['b'])}
      />,
      { wrapper: Wrapper },
    );
    await openList();

    expect(option('b')).toHaveAttribute('aria-disabled', 'true');
    expect(option('a')).not.toHaveAttribute('aria-disabled', 'true');
    expect(option('c')).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.hover(option('b'));
    expect(await screen.findByText(REASON)).toBeInTheDocument();
  });

  it('keeps every bucket selectable when the source has no Object Lock', async () => {
    render(
      <Harness
        overrides={{ sourceObjectLockEnabled: false, targetBucketNameType: 'existing' }}
        destinationBuckets={destination(['b'])}
      />,
      { wrapper: Wrapper },
    );
    await openList();

    for (const name of ['a', 'b', 'c']) {
      expect(option(name)).not.toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('clears a destination bucket picked before the source turned out to have Object Lock', async () => {
    render(
      <Harness
        overrides={{ sourceObjectLockEnabled: false, targetBucketNameType: 'existing', targetBucketName: 'b' }}
        destinationBuckets={destination(['b'])}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('target')).toHaveTextContent('b');

    await userEvent.click(screen.getByRole('button', { name: 'lock source' }));

    await waitFor(() => expect(screen.getByTestId('target')).toHaveTextContent(/^$/));
  });

  it('disables reusing a destination bucket when none of them has Object Lock', async () => {
    render(
      <Harness overrides={{ sourceObjectLockEnabled: true }} destinationBuckets={destination(['a', 'b', 'c'])} />,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(reuseRadio()).toBeDisabled());
    await userEvent.hover(reuseRadio().closest('label') ?? reuseRadio());
    expect(await screen.findByText(REASON)).toBeInTheDocument();
  });

  it('keeps reusing a destination bucket possible when the source has no Object Lock', () => {
    render(
      <Harness overrides={{ sourceObjectLockEnabled: false }} destinationBuckets={destination(['a', 'b', 'c'])} />,
      { wrapper: Wrapper },
    );

    expect(reuseRadio()).toBeEnabled();
  });

  it('announces that a destination bucket created will have Object Lock', () => {
    render(<Harness overrides={{ sourceObjectLockEnabled: true, targetBucketNameType: 'create' }} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText(/created with Object Lock enabled/i)).toBeInTheDocument();
  });
});
