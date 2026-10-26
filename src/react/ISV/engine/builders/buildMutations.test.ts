import type { FormData, FullContext, PlatformConfig, PreviousResults, SingleMutationDef } from '../types';
import { buildAccountMutations, buildIAMMutations } from './buildMutations';

const config = { name: 'Test', policy: jest.fn() } as unknown as PlatformConfig;

const form: FormData = {
  accountName: '  acme  ',
  accountNameType: 'create',
  enableImmutableBackup: false,
  buckets: [],
};

const ctx: FullContext = {
  _sosApiStatus: 'unauthorized',
  _existingAccount: null,
  _platformId: 'test',
  _bucketTag: 'test',
  _instanceId: 'instance-1',
  isNewAccount: true,
  needsIAMUser: true,
  needsAccessKey: false,
};

const prev: PreviousResults = {
  createAccount: { data: { id: 'acc-1', userName: 'acme' } },
};

const findMutation = (mutations: SingleMutationDef[], id: string) => {
  const mutation = mutations.find((m) => m.id === id);
  if (!mutation) {
    throw new Error(`mutation ${id} not found`);
  }
  return mutation;
};

describe('buildAccountMutations', () => {
  it('should trim the account name in the createAccount variables', () => {
    const createAccount = findMutation(buildAccountMutations(config), 'createAccount');

    const variables = createAccount.variables(form, prev, ctx) as {
      user: { userName: string; email: string };
    };

    expect(variables.user.userName).toBe('acme');
    expect(variables.user.email).toBe('acme@artesca.local');
  });
});

describe('buildIAMMutations', () => {
  const mutations = buildIAMMutations(config);

  it('should derive the createIAMUser name from the trimmed account name', () => {
    const variables = findMutation(mutations, 'createIAMUser').variables(form, prev, ctx) as { userName: string };

    expect(variables.userName).toBe('acme');
  });

  it('should derive the createPolicy name from the trimmed account name', () => {
    const variables = findMutation(mutations, 'createPolicy').variables(form, prev, ctx) as { policyName: string };

    expect(variables.policyName.startsWith('acme')).toBe(true);
    expect(variables.policyName).not.toMatch(/\s/);
  });

  it('should derive the attachPolicy names from the trimmed account name', () => {
    const variables = findMutation(mutations, 'attachPolicy').variables(form, prev, ctx) as {
      userName: string;
      policyArn: string;
    };

    expect(variables.userName.startsWith('acme')).toBe(true);
    expect(variables.userName).not.toMatch(/\s/);
    expect(variables.policyArn).not.toMatch(/\s/);
    expect(variables.policyArn).toContain(':policy/acme-');
  });

  describe('with existing account and IAM user names', () => {
    const existingForm: FormData = {
      ...form,
      accountName: 'acct ',
      accountNameType: 'existing',
      IAMUserName: 'svc ',
      IAMUserNameType: 'existing',
    };
    const existingCtx: FullContext = {
      ...ctx,
      _existingAccount: { id: 'acc-2', roleArn: 'arn:aws:iam::acc-2:role/test' } as FullContext['_existingAccount'],
      isNewAccount: false,
      needsIAMUser: false,
      needsAccessKey: true,
    };

    it('should pass the padded IAM user name unchanged to createAccessKey', () => {
      const variables = findMutation(mutations, 'createAccessKey').variables(existingForm, {}, existingCtx) as {
        userName: string;
      };

      expect(variables.userName).toBe('svc ');
    });

    it('should pass the padded IAM user name unchanged to attachPolicy', () => {
      const variables = findMutation(mutations, 'attachPolicy').variables(existingForm, {}, existingCtx) as {
        userName: string;
        policyArn: string;
      };

      expect(variables.userName).toBe('svc ');
      expect(variables.policyArn).toContain(':policy/svc -');
    });
  });
});
