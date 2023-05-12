import { AccountInfo, Role } from '../../domain/entities/account';
import { PromiseResult } from '../../domain/entities/promise';
import { IAccessibleAccounts } from './IAccessibleAccounts';
import {
  ACCOUNT,
  NEWLY_CREATED_ACCOUNT,
} from '../../../../js/mock/managementClientMSWHandlers';

export const DEFAULT_ASSUMABLE_ROLES = [
  {
    Arn: 'arn:aws:iam::123456789012:role/StorageAccountOwner',
    Name: 'StorageAccountOwner',
  },
];

export const DEFAULT_ASSUMABLE_ROLES_ARN = DEFAULT_ASSUMABLE_ROLES[0].Arn;
export const ACCESSIBLE_ACCOUNTS_EXAMPLE = [
  {
    ...ACCOUNT,
    assumableRoles: [
      {
        Arn: 'arn:aws:iam::123456789012:role/StorageAccountOwner',
        Name: 'StorageAccountOwner',
      },
    ],
  },
  {
    ...NEWLY_CREATED_ACCOUNT,
    assumableRoles: [
      {
        Arn: 'arn:aws:iam::123456789012:role/StorageAccountOwner',
        Name: 'StorageAccountOwner',
      },
    ],
  },
];
export class MockedAccessibleAccounts implements IAccessibleAccounts {
  useListAccessibleAccounts = jest.fn().mockImplementation(
    (): {
      accountInfos: PromiseResult<(AccountInfo & { assumableRoles: Role[] })[]>;
    } => {
      return {
        accountInfos: {
          status: 'success',
          value: ACCESSIBLE_ACCOUNTS_EXAMPLE,
        },
      };
    },
  );
}
