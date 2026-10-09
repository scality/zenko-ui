import { useBuckets } from '@scality/data-browser-library';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useListAccounts } from '../../../../next-architecture/domain/business/accounts';
import { Wrapper } from '../../../../utils/testUtil';
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
});
