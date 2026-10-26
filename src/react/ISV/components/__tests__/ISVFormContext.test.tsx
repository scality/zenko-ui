import { act, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router';
import { useListAccounts } from '../../../next-architecture/domain/business/accounts';
import type { FormData, ISVPlatform } from '../../engine/types';
import { ISVFormProvider, useISVFormContext } from '../ISVFormContext';

jest.mock('../../../next-architecture/domain/business/accounts', () => ({
  useListAccounts: jest.fn(),
}));

jest.mock('../../../next-architecture/ui/AccessibleAccountsAdapterProvider', () => ({
  useAccessibleAccountsAdapter: jest.fn(),
}));

jest.mock('../../../ui-elements/SelectAccountIAMRole', () => ({
  NoOpMetricsAdapter: jest.fn(),
}));

jest.mock('../../hooks/useIAMUser', () => ({
  useIAMUser: jest.fn().mockReturnValue({
    isIAMUserExist: false,
    IAMUsers: [],
    getIAMUsersMutation: { status: 'idle', mutate: jest.fn() },
    accessKeys: [],
    accessKeysStatus: 'idle',
  }),
}));

const platform = { id: 'test' } as unknown as ISVPlatform;

let setFormValue: (name: 'accountName' | 'accountNameType', value: string) => void;

const Consumer = () => {
  const { isDuplicateAccountName } = useISVFormContext();
  return <div data-testid="duplicate">{String(isDuplicateAccountName)}</div>;
};

const Harness = ({ accountNameType }: { accountNameType: FormData['accountNameType'] }) => {
  const formMethods = useForm<FormData>({
    defaultValues: { accountName: '', accountNameType, enableImmutableBackup: false, buckets: [] },
  });
  setFormValue = (name, value) => formMethods.setValue(name, value as never, { shouldDirty: true });
  return (
    <ISVFormProvider platform={platform} formMethods={formMethods}>
      <Consumer />
    </ISVFormProvider>
  );
};

describe('ISVFormProvider isDuplicateAccountName', () => {
  beforeEach(() => {
    (useListAccounts as jest.Mock).mockReturnValue({
      accounts: { status: 'success', value: [{ name: 'foo', preferredAssumableRoleArn: 'arn' }] },
    });
  });

  const renderHarness = (accountNameType: FormData['accountNameType']) =>
    render(
      <MemoryRouter>
        <Harness accountNameType={accountNameType} />
      </MemoryRouter>,
    );

  it('should flag a padded name as duplicate in create mode', () => {
    renderHarness('create');

    act(() => setFormValue('accountName', ' foo '));

    expect(screen.getByTestId('duplicate')).toHaveTextContent('true');
  });

  it('should not flag a unique name in create mode', () => {
    renderHarness('create');

    act(() => setFormValue('accountName', ' bar '));

    expect(screen.getByTestId('duplicate')).toHaveTextContent('false');
  });

  it('should not flag duplicates in existing mode', () => {
    renderHarness('existing');

    act(() => setFormValue('accountName', 'foo'));

    expect(screen.getByTestId('duplicate')).toHaveTextContent('false');
  });
});
