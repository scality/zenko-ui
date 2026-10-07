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
        accounts: [],
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

describe('ConfigureStep', () => {
  it('hands the connection on, so the setup never needs the admin credentials again', async () => {
    render(<ConfigureStep />, { wrapper: Wrapper });

    const [sourceAccountName, destinationAccountName] = screen.getAllByRole('textbox', { name: /Account Name/i });
    const set = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } });
    set(sourceAccountName, 'source-account');
    set(screen.getByRole('textbox', { name: /Base domain/i }), 'crr-dest.artesca.local');
    set(screen.getByRole('textbox', { name: /^Username/i }), 'scality');
    set(screen.getByLabelText(/^Password/i), 'super-secret');
    set(screen.getByRole('textbox', { name: /^Certificate/i }), PEM);
    set(destinationAccountName, 'dest-account');

    const connect = screen.getByRole('button', { name: /Connect/i });
    await waitFor(() => expect(connect).toBeEnabled());
    await userEvent.click(connect);
    await userEvent.click(await screen.findByText('Select an endpoint'));
    await userEvent.click(await screen.findByText('s3.crr-dest.artesca.local'));

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await waitFor(() => expect(continueButton).toBeEnabled(), { timeout: 5000 });
    await userEvent.click(continueButton);

    await waitFor(() => expect(mockNext).toHaveBeenCalled());
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: 'sealed-handle', selectedEndpoint: 's3.crr-dest.artesca.local' }),
    );
  });
});
