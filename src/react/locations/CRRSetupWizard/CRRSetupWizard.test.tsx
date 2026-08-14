import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Wrapper } from '../../utils/testUtil';
import { CRRSetupWizard } from './CRRSetupWizard';

const VERIFY_URL = '/crr-configurator/api/v1/verify';
const RESOLVE_URL = '/crr-configurator/api/v1/resolve';
const server = setupServer();

// 'bypass' (not 'error'): SourceSection's account listing goes through the
// DataBrowser S3/IAM client, whose calls are not part of this suite's boundary.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const PEM = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

const ENDPOINTS = [
  { hostname: 's3.crr-dest.artesca.local', locationName: 'us-east-1' },
  { hostname: 's3.repl-vlan.crr-dest.artesca.local', locationName: 'us-east-1' },
];

const mockVerifyEndpoints = () =>
  server.use(rest.post(VERIFY_URL, (_req, res, ctx) => res(ctx.json({ ok: true, endpoints: ENDPOINTS }))));

const mockResolve = (resolvable: boolean) =>
  server.use(rest.post(RESOLVE_URL, (_req, res, ctx) => res(ctx.json({ resolvable }))));

// Two "Account Name" fields (source + destination) share the label; disambiguate by order.
const fillConnectionForm = () => {
  const [sourceAccountName, destinationAccountName] = screen.getAllByRole('textbox', { name: /Account Name/i });
  const set = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } });
  set(sourceAccountName, 'source-account');
  set(screen.getByRole('textbox', { name: /Base domain/i }), 'crr-dest.artesca.local');
  set(screen.getByRole('textbox', { name: /^Username/i }), 'scality');
  set(screen.getByLabelText(/^Password/i), 'super-secret');
  set(screen.getByRole('textbox', { name: /^Certificate/i }), PEM);
  set(destinationAccountName, 'dest-account');
};

const clickWhenEnabled = async (name: RegExp) => {
  const button = screen.getByRole('button', { name });
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
};

// The picker only renders once the destination is connected, so its appearance
// is the unambiguous "connected" signal (the word "Connected" also appears in a
// transient toast).
const pickEndpoint = async (hostname: string) => {
  await userEvent.click(await screen.findByText('Select an endpoint'));
  await userEvent.click(await screen.findByText(hostname));
};

describe('CRRSetupWizard — Configure step', () => {
  it('discovers the destination S3 endpoints when the user clicks Connect', async () => {
    mockVerifyEndpoints();
    render(<CRRSetupWizard />, { wrapper: Wrapper });

    fillConnectionForm();
    await clickWhenEnabled(/Connect/i);

    // The discovered endpoints populate the picker.
    await userEvent.click(await screen.findByText('Select an endpoint'));
    expect(await screen.findByText('s3.crr-dest.artesca.local')).toBeInTheDocument();
    expect(screen.getByText('s3.repl-vlan.crr-dest.artesca.local')).toBeInTheDocument();
  });

  it('marks a picked endpoint resolvable and lets the user continue', async () => {
    mockVerifyEndpoints();
    mockResolve(true);
    render(<CRRSetupWizard />, { wrapper: Wrapper });

    fillConnectionForm();
    await clickWhenEnabled(/Connect/i);
    await pickEndpoint('s3.crr-dest.artesca.local');

    await waitFor(() => expect(screen.getByLabelText(/Reachable from this site/i)).toBeInTheDocument(), {
      timeout: 5000,
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled());
  });

  it('blocks Continue when the picked endpoint does not resolve from the source', async () => {
    mockVerifyEndpoints();
    mockResolve(false);
    render(<CRRSetupWizard />, { wrapper: Wrapper });

    fillConnectionForm();
    await clickWhenEnabled(/Connect/i);
    await pickEndpoint('s3.crr-dest.artesca.local');

    await waitFor(() => expect(screen.getByLabelText(/Not reachable from this site/i)).toBeInTheDocument(), {
      timeout: 5000,
    });
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('surfaces the ARTESCA problem code when Connect is rejected', async () => {
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

    fillConnectionForm();
    await clickWhenEnabled(/Connect/i);

    expect(await screen.findByText(/The destination certificate is invalid/i)).toBeInTheDocument();
  });
});
