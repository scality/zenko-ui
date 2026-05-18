import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { getConfigOverlay, LOCATIONS } from '../../../../js/mock/managementClientMSWHandlers';
import type { WebIdentityRoles } from '../../../../types/iam';
import { VaultAccountsLocationsAdapter } from './VaultAccountsLocationsAdapter';

const iamEndpoint = 'http://localhost:8600';
const managementBaseUrl = 'http://localhost:8080';
const instanceId = 'test-instance-id';
const mockGetToken = () => Promise.resolve('test-token');

const VAULT_ACCOUNT_1 = {
  Name: 'account-1',
  CreationDate: new Date('2023-01-01T00:00:00.000Z'),
  Roles: [{ Name: 'storage-manager-role', Arn: 'arn:aws:iam::111111111111:role/storage-manager-role' }],
  id: 'account-id-1',
  canonicalId: 'canonical-id-1',
};

const VAULT_ACCOUNT_2 = {
  Name: 'account-2',
  CreationDate: new Date('2023-02-01T00:00:00.000Z'),
  Roles: [{ Name: 'storage-account-owner-role', Arn: 'arn:aws:iam::222222222222:role/storage-account-owner-role' }],
  id: 'account-id-2',
  canonicalId: 'canonical-id-2',
};

const SCALITY_INTERNAL_ACCOUNT = {
  Name: 'scality-internal-services',
  CreationDate: new Date('2023-01-01T00:00:00.000Z'),
  Roles: [],
  id: 'internal-id',
  canonicalId: 'internal-canonical-id',
};

const vaultSinglePageResponse: WebIdentityRoles = {
  IsTruncated: false,
  Accounts: [VAULT_ACCOUNT_1, VAULT_ACCOUNT_2, SCALITY_INTERNAL_ACCOUNT],
};

const vaultPage1Response: WebIdentityRoles = {
  IsTruncated: true,
  Marker: 'marker-page-2',
  Accounts: [VAULT_ACCOUNT_1],
};

const vaultPage2Response: WebIdentityRoles = {
  IsTruncated: false,
  Accounts: [VAULT_ACCOUNT_2],
};

const getVaultRolesHandler = (response: WebIdentityRoles) =>
  rest.get(`${iamEndpoint}/`, (req, res, ctx) => {
    return res(ctx.json(response));
  });

const server = setupServer(getConfigOverlay(managementBaseUrl, instanceId));

describe('VaultAccountsLocationsAdapter - listAccounts', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should return accounts from vault and filter scality-internal-services', async () => {
    //S
    server.use(getVaultRolesHandler(vaultSinglePageResponse));
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E
    const result = await SUT.listAccounts();

    //V
    expect(result).toHaveLength(2);
    expect(result).toStrictEqual([
      {
        id: VAULT_ACCOUNT_1.id,
        name: VAULT_ACCOUNT_1.Name,
        canonicalId: VAULT_ACCOUNT_1.canonicalId,
        creationDate: new Date(VAULT_ACCOUNT_1.CreationDate),
      },
      {
        id: VAULT_ACCOUNT_2.id,
        name: VAULT_ACCOUNT_2.Name,
        canonicalId: VAULT_ACCOUNT_2.canonicalId,
        creationDate: new Date(VAULT_ACCOUNT_2.CreationDate),
      },
    ]);
    expect(result.find((a) => a.name === 'scality-internal-services')).toBeUndefined();
  });

  it('should include canonicalId in the returned accounts', async () => {
    //S
    server.use(getVaultRolesHandler(vaultSinglePageResponse));
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E
    const result = await SUT.listAccounts();

    //V
    expect(result[0].canonicalId).toBe('canonical-id-1');
    expect(result[1].canonicalId).toBe('canonical-id-2');
  });

  it('should paginate across multiple Marker pages and deduplicate accounts', async () => {
    //S
    server.use(
      rest.get(`${iamEndpoint}/`, (req, res, ctx) => {
        const marker = req.url.searchParams.get('Marker');
        if (marker === 'marker-page-2') {
          return res(ctx.json(vaultPage2Response));
        }
        return res(ctx.json(vaultPage1Response));
      }),
    );
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E
    const result = await SUT.listAccounts();

    //V
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toContain('account-id-1');
    expect(result.map((a) => a.id)).toContain('account-id-2');
  });

  it('should reject when vault api returns a non-2xx response', async () => {
    //S
    server.use(
      rest.get(`${iamEndpoint}/`, (req, res, ctx) => res(ctx.status(500))),
    );
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E+V
    await expect(SUT.listAccounts()).rejects.toBeDefined();
  });
});

describe('VaultAccountsLocationsAdapter - listLocations', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);
    server.use(
      rest.get(`${managementBaseUrl}/api/v1/config/overlay/view/${instanceId}`, (req, res, ctx) =>
        res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listLocations()).rejects.toBeDefined();
  });

  it('should return expected locations from pensieve', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E
    const result = await SUT.listLocations();

    //V
    const EXPECTED_LOCATIONS = Object.values(LOCATIONS).map((location) => ({
      //@ts-expect-error fix this when you are working on it
      id: location.objectId || '',
      //@ts-expect-error - isCold does not exist on builtin locations
      isCold: location.isCold,
      //@ts-expect-error - isTransient does not exist on builtin locations
      isTransient: location.isTransient,
      name: location.name,
      type: location.locationType,
      details: location.details || {},
    }));
    expect(result).toStrictEqual(EXPECTED_LOCATIONS);
  });
});

describe('VaultAccountsLocationsAdapter - listAccountsLocationsAndEndpoints', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should return accounts, locations and endpoints from pensieve overlay', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E
    const result = await SUT.listAccountsLocationsAndEndpoints();

    //V
    expect(result).toHaveProperty('accounts');
    expect(result).toHaveProperty('locations');
    expect(result).toHaveProperty('endpoints');
    expect(Array.isArray(result.accounts)).toBe(true);
    expect(Array.isArray(result.locations)).toBe(true);
    expect(Array.isArray(result.endpoints)).toBe(true);
  });

  it('should reject when pensieve api returns an error', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);
    server.use(
      rest.get(`${managementBaseUrl}/api/v1/config/overlay/view/${instanceId}`, (req, res, ctx) =>
        res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listAccountsLocationsAndEndpoints()).rejects.toBeDefined();
  });
});
