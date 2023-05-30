import { AccountInfo, Role } from '../../domain/entities/account';
import { PromiseResult } from '../../domain/entities/promise';
import { IAccessibleAccounts } from './IAccessibleAccounts';
import {
  ACCOUNT,
  NEWLY_CREATED_ACCOUNT,
} from '../../../../js/mock/managementClientMSWHandlers';
import { STORAGE_ACCOUNT_OWNER_ROLE } from '../../../utils/hooks';

export const DEFAULT_ASSUMABLE_ROLES = [
  {
    Arn: 'arn:aws:iam::123456789012:role/' + STORAGE_ACCOUNT_OWNER_ROLE,
    Name: STORAGE_ACCOUNT_OWNER_ROLE,
  },
];

export const DEFAULT_ASSUMABLE_ROLES_ARN = DEFAULT_ASSUMABLE_ROLES[0].Arn;
export const ACCESSIBLE_ACCOUNTS_EXAMPLE = [
  {
    ...ACCOUNT,
    assumableRoles: [
      {
        Arn: 'arn:aws:iam::123456789012:role/' + STORAGE_ACCOUNT_OWNER_ROLE,
        Name: STORAGE_ACCOUNT_OWNER_ROLE,
      },
    ],
  },
  {
    ...NEWLY_CREATED_ACCOUNT,
    assumableRoles: [
      {
        Arn: 'arn:aws:iam::123456789012:role/' + STORAGE_ACCOUNT_OWNER_ROLE,
        Name: STORAGE_ACCOUNT_OWNER_ROLE,
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
