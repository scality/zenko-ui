import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Wrapper } from '../../../../utils/testUtil';
import { ConfigureStep } from './ConfigureStep';

// The wizard stepper is the host framework around this step; stub it to observe
// what the step hands to the next one.
const mockNext = jest.fn();
jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => ({
  useStepper: () => ({ next: mockNext, prev: jest.fn() }),
}));

const server = setupServer(
  rest.post('/crr-configurator/api/v1/destination/connections', (_req, res, ctx) =>
    res(
      ctx.json({
        connectionId: 'sealed-handle',
        expiresAt: '2026-07-16T13:29:30Z',
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
// 'bypass': SourceSection's account listing is not part of this suite's boundary.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
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
  it('hands the connection on, so the setup never needs the admin credentials again', async () => {
    render(<ConfigureStep />, { wrapper: Wrapper });
    fillConnection();
    set(screen.getAllByRole('textbox', { name: /Account Name/i })[1], 'dest-account');

    await connect();
    await clickContinue();

    await waitFor(() => expect(mockNext).toHaveBeenCalled());
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: 'sealed-handle', selectedEndpoint: 's3.crr-dest.artesca.local' }),
    );
  });

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

    expect(await screen.findByText('Select existing account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });
});
