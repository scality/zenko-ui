import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Wrapper } from '../../../../utils/testUtil';
import { ConfigureStep } from './ConfigureStep';

const mockNext = jest.fn();
jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => ({
  useStepper: () => ({ next: mockNext, prev: jest.fn() }),
}));

// Each test plays a whole Configure flow: slower CI runners exceed the 5 s default.
jest.setTimeout(30_000);

const server = setupServer(
  rest.post('/crr-configurator/api/v1/verify', (_req, res, ctx) =>
    res(
      ctx.json({
        ok: true,
        endpoints: [{ hostname: 's3.crr-dest.artesca.local', locationName: 'us-east-1' }],
        accounts: [
          { name: 'finance', id: '123456789012' },
          // Too short for the creation rules, as an account made elsewhere can be.
          { name: 'x', id: '210987654321' },
        ],
      }),
    ),
  ),
  rest.post('/crr-configurator/api/v1/resolve', (_req, res, ctx) => res(ctx.json({ resolvable: true }))),
);
// jsdom doesn't implement scrollIntoView, which the replication section calls when it opens.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  server.listen({ onUnhandledRequest: 'bypass' });
});
afterEach(() => {
  server.resetHandlers();
  mockNext.mockReset();
});
afterAll(() => server.close());

const PEM = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

const set = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } });

const fillConnection = () => {
  set(screen.getAllByRole('textbox', { name: /Account Name/i })[0], 'source-account');
  set(screen.getByRole('textbox', { name: /Base domain/i }), 'crr-dest.artesca.local');
  set(screen.getByRole('textbox', { name: /^Username/i }), 'scality');
  set(screen.getByLabelText(/^Password/i), 'super-secret');
  set(screen.getByRole('textbox', { name: /^Certificate/i }), PEM);
};

const connect = async () => {
  const button = screen.getByRole('button', { name: /Connect/i });
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
  await userEvent.click(await screen.findByText('Select an endpoint'));
  await userEvent.click(await screen.findByText('s3.crr-dest.artesca.local'));
};

const clickContinue = async () => {
  const button = screen.getByRole('button', { name: /Continue/i });
  await waitFor(() => expect(button).toBeEnabled(), { timeout: 5000 });
  await userEvent.click(button);
};

// Source and destination each offer the choice; the source section comes first.
const destinationExistingAccountRadio = () => screen.getAllByRole('radio', { name: /Use an existing Account/i })[1];

describe('ConfigureStep', () => {
  it('offers the destination accounts once connected, and hands the chosen one on as a reuse', async () => {
    render(<ConfigureStep />, { wrapper: Wrapper });
    fillConnection();
    expect(destinationExistingAccountRadio()).toBeDisabled();

    await connect();
    await waitFor(() => expect(destinationExistingAccountRadio()).toBeEnabled());
    await userEvent.click(destinationExistingAccountRadio());
    await userEvent.click(await screen.findByText('Select existing account'));
    await userEvent.click(await screen.findByText('x'));
    await clickContinue();

    await waitFor(() => expect(mockNext).toHaveBeenCalled());
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ destinationAccountNameType: 'existing', destinationAccountName: 'x' }),
    );
  });

  it('drops the chosen destination account when connecting to another destination', async () => {
    render(<ConfigureStep />, { wrapper: Wrapper });
    fillConnection();
    await connect();
    await waitFor(() => expect(destinationExistingAccountRadio()).toBeEnabled());
    await userEvent.click(destinationExistingAccountRadio());
    await userEvent.click(await screen.findByText('Select existing account'));
    await userEvent.click(await screen.findByText('finance'));

    set(screen.getByRole('textbox', { name: /Base domain/i }), 'other-dest.artesca.local');
    await connect();

    expect(screen.getAllByRole('radio', { name: /Create a new Account/i })[1]).toBeChecked();
    expect(document.getElementById('destinationAccountName')).toHaveValue('');
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it("refuses target bucket reuse when the destination account's buckets cannot be listed", async () => {
    server.use(rest.post('/crr-configurator/api/v1/destination/buckets', (_req, res, ctx) => res(ctx.status(500))));
    render(<ConfigureStep />, { wrapper: Wrapper });
    fillConnection();
    await connect();
    await waitFor(() => expect(destinationExistingAccountRadio()).toBeEnabled());
    await userEvent.click(destinationExistingAccountRadio());
    await userEvent.click(await screen.findByText('Select existing account'));
    await userEvent.click(await screen.findByText('x'));
    await userEvent.click(screen.getByRole('checkbox', { name: /Create Replication Rule/i }));

    const reuseBucket = screen.getByRole('radio', { name: /Use an existing Bucket/i });
    await waitFor(() => expect(reuseBucket).toBeDisabled());
    await userEvent.hover(reuseBucket.closest('label') ?? reuseBucket);
    expect(await screen.findByText("Could not list the account's buckets")).toBeInTheDocument();
  });

  it("lists the reused account's buckets on the destination, and hands the chosen one on as the target", async () => {
    let listed: unknown;
    server.use(
      rest.post('/crr-configurator/api/v1/destination/buckets', (req, res, ctx) => {
        listed = req.body;
        return res(ctx.json({ buckets: [{ name: 'x-archive' }] }));
      }),
    );
    render(<ConfigureStep />, { wrapper: Wrapper });
    fillConnection();
    await connect();
    await waitFor(() => expect(destinationExistingAccountRadio()).toBeEnabled());
    await userEvent.click(destinationExistingAccountRadio());
    await userEvent.click(await screen.findByText('Select existing account'));
    await userEvent.click(await screen.findByText('x'));

    await userEvent.click(screen.getByRole('checkbox', { name: /Create Replication Rule/i }));
    set(screen.getByRole('textbox', { name: /Source Bucket name/i }), 'source-bucket');
    const reuseBucket = screen.getByRole('radio', { name: /Use an existing Bucket/i });
    await waitFor(() => expect(reuseBucket).toBeEnabled());
    await userEvent.click(reuseBucket);
    await userEvent.click(await screen.findByText('Select existing bucket'));
    await userEvent.click(await screen.findByText('x-archive'));
    await clickContinue();

    expect(listed).toEqual({
      destinationConnection: {
        baseDomain: 'crr-dest.artesca.local',
        adminUser: 'scality',
        adminPassword: 'super-secret',
      },
      accountName: 'x',
    });
    await waitFor(() => expect(mockNext).toHaveBeenCalled());
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ targetBucketNameType: 'existing', targetBucketName: 'x-archive' }),
    );
  });
});
