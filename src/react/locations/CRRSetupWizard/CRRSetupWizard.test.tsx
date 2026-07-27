import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Wrapper } from '../../utils/testUtil';
import { CRRSetupWizard } from './CRRSetupWizard';

const VERIFY_URL = '/crr-configurator/api/v1/verify';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const PEM = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

/**
 * Fills the whole Configure form with valid values from a user's point of view —
 * clicks the labelled inputs by their accessible name, disambiguating the two
 * "Account Name" fields by the surrounding section title.
 */
const fillValidForm = async () => {
  const accountNameInputs = screen.getAllByRole('textbox', { name: /Account Name/i });
  const [sourceAccountName, destinationAccountName] = accountNameInputs;
  await userEvent.type(sourceAccountName, 'source-account');
  await userEvent.type(screen.getByRole('textbox', { name: /^URL/i }), 'https://10.0.0.42:8443');
  await userEvent.type(screen.getByRole('textbox', { name: /^Username/i }), 'scality');
  await userEvent.type(screen.getByLabelText(/^Password/i), 'super-secret');
  await userEvent.type(screen.getByRole('textbox', { name: /^Certificate/i }), PEM);
  await userEvent.type(destinationAccountName, 'dest-account');
};

describe('CRRSetupWizard — Configure step', () => {
  it('confirms the destination is reachable when the user clicks Check Connection', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(ctx.json({ ok: true, mode: 'management-network', instanceName: 'ageless-valley' })),
      ),
    );
    render(<CRRSetupWizard />, { wrapper: Wrapper });

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: /Check Connection/i }));

    expect(await screen.findByText(/Destination reachable/i)).toBeInTheDocument();
  });

  it('surfaces the ARTESCA problem code when Check Connection is rejected', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(
            JSON.stringify({
              type: 'about:blank',
              title: 'Invalid destination certificate',
              status: 400,
              code: 'DestinationCertificateInvalid',
            }),
          ),
        ),
      ),
    );
    render(<CRRSetupWizard />, { wrapper: Wrapper });

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: /Check Connection/i }));

    expect(await screen.findByText(/pasted certificate is not a valid PEM/i)).toBeInTheDocument();
  });

  it('blocks the user on Configure with an error toast when the silent verify fails on Continue', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(502),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(
            JSON.stringify({
              type: 'about:blank',
              title: 'Destination unreachable',
              status: 502,
              code: 'DestinationUnreachable',
            }),
          ),
        ),
      ),
    );
    render(<CRRSetupWizard />, { wrapper: Wrapper });

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(await screen.findByText(/destination cluster did not respond/i)).toBeInTheDocument();
  });

  it('opens the DNS fallback modal on unresolved hosts and retries with one IP applied to all of them', async () => {
    let verifyCalls = 0;
    let retryBody: { hostAliases?: { hostname: string; ip: string }[] } | undefined;
    server.use(
      rest.post(VERIFY_URL, (req, res, ctx) => {
        verifyCalls += 1;
        if (verifyCalls === 1) {
          return res(
            ctx.status(502),
            ctx.set('Content-Type', 'application/problem+json'),
            ctx.body(
              JSON.stringify({
                type: 'about:blank',
                title: 'DNS resolution failed',
                status: 502,
                code: 'DestinationDnsResolutionFailed',
                unresolvedHosts: ['s3.dest.local', 'iam.dest.local'],
              }),
            ),
          );
        }
        retryBody = req.body as { hostAliases?: { hostname: string; ip: string }[] };
        return res(ctx.json({ ok: true, mode: 'management-network', instanceName: 'ageless-valley' }));
      }),
    );
    render(<CRRSetupWizard />, { wrapper: Wrapper });

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: /Check Connection/i }));

    // The DNS failure surfaces the fallback modal listing every host that could not be resolved.
    expect(await screen.findByText('• s3.dest.local')).toBeInTheDocument();
    expect(screen.getByText('• iam.dest.local')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: /Destination cluster IP/i }), '10.0.0.9');
    await userEvent.click(screen.getByRole('button', { name: /Retry Connection/i }));

    expect(await screen.findByText(/Destination reachable/i)).toBeInTheDocument();
    // The single IP fans out to an alias for each unresolved host.
    expect(retryBody?.hostAliases).toEqual([
      { hostname: 's3.dest.local', ip: '10.0.0.9' },
      { hostname: 'iam.dest.local', ip: '10.0.0.9' },
    ]);
  });
});
