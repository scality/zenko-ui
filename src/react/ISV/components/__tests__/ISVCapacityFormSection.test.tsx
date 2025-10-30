import '../../__tests__/testSetup.tsx';
import { screen, waitFor, render } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  CapacityFormSection,
  CapacityFormWithXcore,
} from '../ISVCapacityFormSection';
import { Wrapper } from '../../../utils/testUtil';
import * as React from 'react';
import { useCapacityUnit } from '../../hooks/useCapacityUnit';
import { unitChoices } from '../../constants';

jest.mock('@scality/module-federation', () => ({
  useShellHooks: jest.fn(() => ({
    useAuth: jest.fn(() => ({
      getToken: jest.fn(() => Promise.resolve('mock-token')),
    })),
  })),
}));

jest.mock('../../../next-architecture/ui/ConfigProvider', () => ({
  useXcoreRuntimeConfig: jest.fn().mockReturnValue({
    spec: {
      selfConfiguration: {
        url: 'http://test-url',
        url_alertmanager: 'http://test-alert',
        url_prometheus: 'http://test-prometheus',
        url_grafana: 'http://test-grafana',
      },
    },
  }),
}));

jest.mock('../../hooks/useCapacityUnit', () => ({
  useCapacityUnit: jest.fn(),
}));

jest.mock('@scality/core-ui', () => ({
  ...jest.requireActual('@scality/core-ui'),
  FormGroup: ({ id, label, content, error, children, labelHelpTooltip }) => (
    <div data-testid={`form-group-${id}`}>
      <label>{label}</label>
      {labelHelpTooltip && <div data-testid="tooltip">{labelHelpTooltip}</div>}
      {content || children}
      {error && <div data-testid="error">{error}</div>}
    </div>
  ),
}));

const FormWrapper = ({ children, defaultValues = {} }) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('CapacityFormSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form section with capacity input and unit selector', () => {
    render(
      <Wrapper>
        <FormWrapper
          defaultValues={{
            buckets: [{ capacity: 100, capacityUnit: String(unitChoices.GiB) }],
          }}
        >
          <CapacityFormSection index={0} />
        </FormWrapper>
      </Wrapper>,
    );

    expect(
      screen.getByText('Max Veeam Repository Capacity'),
    ).toBeInTheDocument();

    const capacityInput = screen.getByRole('spinbutton');
    expect(capacityInput).toBeInTheDocument();
    expect(capacityInput).toHaveValue(100);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders capacity unit options correctly', () => {
    render(
      <Wrapper>
        <FormWrapper
          defaultValues={{
            buckets: [{ capacity: 100, capacityUnit: String(unitChoices.GiB) }],
          }}
        >
          <CapacityFormSection index={0} />
        </FormWrapper>
      </Wrapper>,
    );

    expect(screen.getByText('GiB')).toBeInTheDocument();

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

describe('CapacityFormWithXcore', () => {
  const mockUseClusterCapacity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useCapacityUnit as jest.Mock).mockReturnValue({
      capacityValue: '80',
      capacityUnit: String(unitChoices.TiB),
    });

    mockUseClusterCapacity.mockReturnValue({
      clusterCapacity: 100 * 1024 * 1024 * 1024 * 1024, // 100 TiB in bytes
      clusterCapacityStatus: 'success',
    });
  });

  it('calculates and sets safe capacity values when cluster capacity is available', async () => {
    const setValueMock = jest.fn();

    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

    render(
      <Wrapper>
        <FormWrapper>
          {React.createElement(() => {
            const form = useForm();
            form.setValue = setValueMock;
            return (
              <FormProvider {...form}>
                <CapacityFormWithXcore
                  useClusterCapacity={mockUseClusterCapacity}
                  index={0}
                  bucketNumber={1}
                />
              </FormProvider>
            );
          })}
        </FormWrapper>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith('buckets.0.capacity', '80');
      expect(setValueMock).toHaveBeenCalledWith(
        'buckets.0.capacityUnit',
        String(unitChoices.TiB),
      );
    });

    expect(mockUseClusterCapacity).toHaveBeenCalledWith(
      expect.objectContaining({
        spec: expect.objectContaining({
          remoteEntryPath: expect.any(String),
        }),
      }),
      expect.any(Function),
    );
  });

  it('handles loading state correctly', () => {
    mockUseClusterCapacity.mockReturnValue({
      clusterCapacity: 0,
      clusterCapacityStatus: 'loading',
    });

    render(
      <Wrapper>
        <FormWrapper>
          <CapacityFormWithXcore
            useClusterCapacity={mockUseClusterCapacity}
            index={0}
            bucketNumber={1}
          />
        </FormWrapper>
      </Wrapper>,
    );

    expect(
      screen.getByText('Max Veeam Repository Capacity'),
    ).toBeInTheDocument();
  });

  it('handles error state correctly', () => {
    mockUseClusterCapacity.mockReturnValue({
      clusterCapacity: 0,
      clusterCapacityStatus: 'error',
    });

    render(
      <Wrapper>
        <FormWrapper>
          <CapacityFormWithXcore
            useClusterCapacity={mockUseClusterCapacity}
            index={0}
            bucketNumber={1}
          />
        </FormWrapper>
      </Wrapper>,
    );

    expect(
      screen.getByText('Max Veeam Repository Capacity'),
    ).toBeInTheDocument();
  });

  it('does not set form values when capacity status is not success', async () => {
    const setValueMock = jest.fn();

    mockUseClusterCapacity.mockReturnValue({
      clusterCapacity: 0,
      clusterCapacityStatus: 'loading',
    });

    render(
      <Wrapper>
        <FormWrapper>
          {React.createElement(() => {
            const form = useForm();
            form.setValue = setValueMock;
            return (
              <FormProvider {...form}>
                <CapacityFormWithXcore
                  useClusterCapacity={mockUseClusterCapacity}
                  index={0}
                  bucketNumber={1}
                />
              </FormProvider>
            );
          })}
        </FormWrapper>
      </Wrapper>,
    );

    expect(setValueMock).not.toHaveBeenCalled();
  });

  it('correctly calculates safe capacity with multiple buckets', async () => {
    const setValueMock = jest.fn();
    const bucketNumber = 4;

    mockUseClusterCapacity.mockReturnValue({
      clusterCapacity: 100 * 1024 * 1024 * 1024 * 1024, // 100 TiB in bytes
      clusterCapacityStatus: 'success',
    });

    (useCapacityUnit as jest.Mock).mockReturnValue({
      capacityValue: '20',
      capacityUnit: String(unitChoices.TiB),
    });

    render(
      <Wrapper>
        <FormWrapper>
          {React.createElement(() => {
            const form = useForm();
            form.setValue = setValueMock;
            return (
              <FormProvider {...form}>
                <CapacityFormWithXcore
                  useClusterCapacity={mockUseClusterCapacity}
                  index={0}
                  bucketNumber={bucketNumber}
                />
              </FormProvider>
            );
          })}
        </FormWrapper>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith('buckets.0.capacity', '20');
      expect(setValueMock).toHaveBeenCalledWith(
        'buckets.0.capacityUnit',
        String(unitChoices.TiB),
      );
    });
  });
});
