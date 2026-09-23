import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { Wrapper } from '../../../../utils/testUtil';
import { ReplicationSection } from './ReplicationSection';
import { type ConfigureFormValues, defaultConfigureValues } from './schema';

const overrideWarning = /already has a replication rule/i;

// jsdom doesn't implement scrollIntoView, which the section calls when it opens.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const Harness = ({ overrides }: { overrides?: Partial<ConfigureFormValues> }) => {
  const methods = useForm<ConfigureFormValues>({
    defaultValues: { ...defaultConfigureValues, createReplicationRule: true, ...overrides },
  });
  return (
    <FormProvider {...methods}>
      <ReplicationSection />
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
