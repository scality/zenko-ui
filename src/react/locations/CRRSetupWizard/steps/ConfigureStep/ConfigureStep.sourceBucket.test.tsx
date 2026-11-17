import { useBuckets, useGetBucketObjectLockConfiguration, useIsBucketEmpty } from '@scality/data-browser-library';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { useListAccounts } from '../../../../next-architecture/domain/business/accounts';
import { NewWrapper, Wrapper } from '../../../../utils/testUtil';
import { ConfigureStep } from './ConfigureStep';

const mockNext = jest.fn();
jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => ({
  useStepper: () => ({ next: mockNext, prev: jest.fn() }),
}));

jest.mock('../../../../next-architecture/domain/business/accounts', () => ({
  useListAccounts: jest.fn(),
}));

// Each test plays a whole Configure flow: slower CI runners exceed the 5 s default.
jest.setTimeout(30_000);

const server = setupServer(
  rest.post('/crr-configurator/api/v1/verify', (_req, res, ctx) =>
    res(ctx.json({ ok: true, endpoints: [{ hostname: 's3.crr-dest.artesca.local', locationName: 'us-east-1' }] })),
  ),
  rest.post('/crr-configurator/api/v1/resolve', (_req, res, ctx) => res(ctx.json({ resolvable: true }))),
);
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  server.listen({ onUnhandledRequest: 'bypass' });
});
beforeEach(() => {
  (useListAccounts as jest.Mock).mockReturnValue({
    accounts: {
      status: 'success',
      value: [{ id: '1', name: 'finance', preferredAssumableRoleArn: 'arn:aws:iam::111:role/finance' }],
    },
  });
  (useBuckets as jest.Mock).mockReturnValue({
    data: { Buckets: [{ Name: 'finance-src' }] },
    isLoading: false,
    isError: false,
  });
});
afterEach(() => {
  server.resetHandlers();
  mockNext.mockReset();
});
afterAll(() => server.close());

const PEM = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
const set = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } });

const pickExistingSourceAccount = async () => {
  await userEvent.click(screen.getAllByRole('radio', { name: /Use an existing Account/i })[0]);
  await userEvent.click(await screen.findByText('Select existing account'));
  await userEvent.click(await screen.findByText('finance'));
  await userEvent.click(screen.getByRole('checkbox', { name: /Create Replication Rule/i }));
};

const sourceReuseRadio = () => screen.getAllByRole('radio', { name: /Use an existing Bucket/i })[0];

describe('ConfigureStep — source bucket', () => {
  it("offers the reused source account's buckets, and hands the chosen one on", async () => {
    render(<ConfigureStep />, { wrapper: Wrapper });
    await pickExistingSourceAccount();

    set(screen.getByRole('textbox', { name: /Base domain/i }), 'crr-dest.artesca.local');
    set(screen.getByRole('textbox', { name: /^Username/i }), 'scality');
    set(screen.getByLabelText(/^Password/i), 'super-secret');
    set(screen.getByRole('textbox', { name: /^Certificate/i }), PEM);
    set(document.getElementById('destinationAccountName') as HTMLElement, 'dest-account');
    const connect = screen.getByRole('button', { name: /Connect/i });
    await waitFor(() => expect(connect).toBeEnabled());
    await userEvent.click(connect);
    await userEvent.click(await screen.findByText('Select an endpoint'));
    await userEvent.click(await screen.findByText('s3.crr-dest.artesca.local'));

    await userEvent.click(sourceReuseRadio());
    await userEvent.click(await screen.findByText('Select existing bucket'));
    await userEvent.click(await screen.findByText('finance-src'));
    set(screen.getByRole('textbox', { name: /Target Bucket name/i }), 'dest-bucket');

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await waitFor(() => expect(continueButton).toBeEnabled(), { timeout: 5000 });
    await userEvent.click(continueButton);

    await waitFor(() => expect(mockNext).toHaveBeenCalled());
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ sourceBucketNameType: 'existing', sourceBucketName: 'finance-src' }),
    );
  });

  it("refuses source bucket reuse when the account's buckets cannot be listed", async () => {
    (useBuckets as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ConfigureStep />, { wrapper: Wrapper });
    await pickExistingSourceAccount();

    await waitFor(() => expect(sourceReuseRadio()).toBeDisabled());
    await userEvent.hover(sourceReuseRadio().closest('label') ?? sourceReuseRadio());
    expect(await screen.findByText("Could not list the account's buckets")).toBeInTheDocument();
  });

  it('opened from a bucket, preselects that bucket and its account, keeps them editable, and cancels back to the bucket', async () => {
    const CurrentUrl = () => {
      const { pathname, search } = useLocation();
      return <output>{`${pathname}${search}`}</output>;
    };
    render(
      <>
        <ConfigureStep />
        <CurrentUrl />
      </>,
      { wrapper: NewWrapper('/create-crr-configuration?account=finance&bucket=finance-src') },
    );

    expect(screen.getAllByRole('radio', { name: /Use an existing Account/i })[0]).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Create Replication Rule/i })).toBeChecked();
    await waitFor(() => expect(sourceReuseRadio()).toBeChecked());
    expect(await screen.findByText('finance-src')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('radio', { name: /Create a new Bucket/i })[0]);
    expect(screen.getByRole('textbox', { name: /Source Bucket name/i })).toHaveValue('');

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.getByRole('status')).toHaveTextContent('/accounts/finance/buckets/finance-src?tab=replication');
  });
});

describe('ConfigureStep — objects already in the reused source bucket', () => {
  const WARNING = /Existing objects are not replicated/i;
  const answers = (isEmpty: boolean | null) =>
    (useIsBucketEmpty as jest.Mock).mockReturnValue({ isEmpty, isLoading: isEmpty === null, error: null });
  const openedOnFinanceSrc = () =>
    render(<ConfigureStep />, { wrapper: NewWrapper('/create-crr-configuration?account=finance&bucket=finance-src') });

  afterEach(() => answers(null));

  it('warns that what the bucket already holds will not be replicated', async () => {
    answers(false);
    openedOnFinanceSrc();

    expect(await screen.findByText(WARNING)).toBeInTheDocument();
    expect(
      screen.getByText(/Only objects written after the rule is created are copied to the destination/i),
    ).toBeInTheDocument();
  });

  it('says nothing when the bucket is empty', async () => {
    answers(true);
    openedOnFinanceSrc();

    expect(await screen.findByText('finance-src')).toBeInTheDocument();
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });

  it('says nothing until the bucket has answered', async () => {
    answers(null);
    openedOnFinanceSrc();

    expect(await screen.findByText('finance-src')).toBeInTheDocument();
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });
});

describe('ConfigureStep — source bucket with Object Lock', () => {
  const NOTICE = /The destination bucket will be created with Object Lock enabled/i;
  const lockAnswer = (answer: object) => (useGetBucketObjectLockConfiguration as jest.Mock).mockReturnValue(answer);
  const enabled = {
    data: { ObjectLockConfiguration: { ObjectLockEnabled: 'Enabled' } },
    error: null,
    isLoading: false,
    isError: false,
    status: 'success',
  };
  const failed = (name: string) => ({
    data: undefined,
    error: { name },
    isLoading: false,
    isError: true,
    status: 'error',
  });
  const defaultLockAnswer = (useGetBucketObjectLockConfiguration as jest.Mock).getMockImplementation();
  const openedOnFinanceSrc = () =>
    render(<ConfigureStep />, { wrapper: NewWrapper('/create-crr-configuration?account=finance&bucket=finance-src') });

  afterEach(() => (useGetBucketObjectLockConfiguration as jest.Mock).mockImplementation(defaultLockAnswer));

  it('announces that the destination bucket will be created with Object Lock when the reused source has it', async () => {
    lockAnswer(enabled);
    openedOnFinanceSrc();

    expect(await screen.findByText(NOTICE)).toBeInTheDocument();
  });

  it('says nothing when the reused source bucket has no Object Lock', async () => {
    lockAnswer(failed('ObjectLockConfigurationNotFoundError'));
    openedOnFinanceSrc();

    expect(await screen.findByText('finance-src')).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it('says nothing when Object Lock cannot be read', async () => {
    lockAnswer(failed('AccessDenied'));
    openedOnFinanceSrc();

    expect(await screen.findByText('finance-src')).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  describe('Continue', () => {
    const READ_ERROR = /Could not read the source bucket's Object Lock configuration/i;
    const loading = { data: undefined, error: null, isLoading: true, isError: false, status: 'loading' };
    const fillUntilContinuable = async () => {
      openedOnFinanceSrc();
      set(screen.getByRole('textbox', { name: /Base domain/i }), 'crr-dest.artesca.local');
      set(screen.getByRole('textbox', { name: /^Username/i }), 'scality');
      set(screen.getByLabelText(/^Password/i), 'super-secret');
      set(screen.getByRole('textbox', { name: /^Certificate/i }), PEM);
      set(document.getElementById('destinationAccountName') as HTMLElement, 'dest-account');
      const connect = screen.getByRole('button', { name: /Connect/i });
      await waitFor(() => expect(connect).toBeEnabled());
      await userEvent.click(connect);
      await userEvent.click(await screen.findByText('Select an endpoint'));
      await userEvent.click(await screen.findByText('s3.crr-dest.artesca.local'));
      set(screen.getByRole('textbox', { name: /Target Bucket name/i }), 'dest-bucket');
      expect(await screen.findByText('finance-src')).toBeInTheDocument();
    };

    it('is allowed when the reused source bucket has no Object Lock configuration', async () => {
      lockAnswer(failed('ObjectLockConfigurationNotFoundError'));
      await fillUntilContinuable();

      await waitFor(() => expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled(), { timeout: 5000 });
      expect(screen.queryByText(READ_ERROR)).not.toBeInTheDocument();
    });

    it('is blocked while the Object Lock configuration is loading', async () => {
      lockAnswer(loading);
      await fillUntilContinuable();

      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
      expect(screen.queryByText(READ_ERROR)).not.toBeInTheDocument();
    });

    it('is blocked, with a message, when the Object Lock configuration cannot be read', async () => {
      lockAnswer(failed('AccessDenied'));
      await fillUntilContinuable();

      expect(await screen.findByText(READ_ERROR)).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    });
  });

  it('forgets the Object Lock of the reused bucket once the source bucket is to be created', async () => {
    lockAnswer(enabled);
    openedOnFinanceSrc();
    expect(await screen.findByText(NOTICE)).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('radio', { name: /Create a new Bucket/i })[0]);

    await waitFor(() => expect(screen.queryByText(NOTICE)).not.toBeInTheDocument());
  });

  it('disables the destination buckets without Object Lock', async () => {
    lockAnswer(enabled);
    server.use(
      rest.post('/crr-configurator/api/v1/verify', (_req, res, ctx) =>
        res(
          ctx.json({
            ok: true,
            endpoints: [{ hostname: 's3.crr-dest.artesca.local', locationName: 'us-east-1' }],
            accounts: [{ name: 'x', id: '210987654321' }],
          }),
        ),
      ),
      rest.post('/crr-configurator/api/v1/destination/buckets', (_req, res, ctx) =>
        res(
          ctx.json({
            buckets: [{ name: 'a', objectLockEnabled: true }, { name: 'b', objectLockEnabled: false }, { name: 'c' }],
          }),
        ),
      ),
    );
    openedOnFinanceSrc();
    set(screen.getByRole('textbox', { name: /Base domain/i }), 'crr-dest.artesca.local');
    set(screen.getByRole('textbox', { name: /^Username/i }), 'scality');
    set(screen.getByLabelText(/^Password/i), 'super-secret');
    set(screen.getByRole('textbox', { name: /^Certificate/i }), PEM);
    const connect = screen.getByRole('button', { name: /Connect/i });
    await waitFor(() => expect(connect).toBeEnabled());
    await userEvent.click(connect);
    await userEvent.click(await screen.findByText('Select an endpoint'));
    await userEvent.click(await screen.findByText('s3.crr-dest.artesca.local'));
    const destinationExistingAccount = screen.getAllByRole('radio', { name: /Use an existing Account/i })[1];
    await waitFor(() => expect(destinationExistingAccount).toBeEnabled());
    await userEvent.click(destinationExistingAccount);
    await userEvent.click(await screen.findByText('Select existing account'));
    await userEvent.click(await screen.findByText('x'));

    const targetReuseRadio = screen.getAllByRole('radio', { name: /Use an existing Bucket/i })[1];
    await waitFor(() => expect(targetReuseRadio).toBeEnabled());
    await userEvent.click(targetReuseRadio);
    await userEvent.click(await screen.findByText('Select existing bucket'));

    expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'c' })).not.toHaveAttribute('aria-disabled', 'true');
  });
});
