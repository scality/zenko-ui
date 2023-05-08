import { AccountInfo, Role } from '../../domain/entities/account';
import { PromiseResult } from '../../domain/entities/promise';
import { IAccessibleAccounts } from './IAccessibleAccounts';
import {
  ACCOUNT,
  NEWLY_CREATED_ACCOUNT,
} from '../../../../js/mock/managementClientMSWHandlers';

export class MockedAccessibleAcounts implements IAccessibleAccounts {
  useListAccessibleAccounts = jest.fn().mockImplementation(
    (): {
      accountInfos: PromiseResult<(AccountInfo & { assumableRoles: Role[] })[]>;
    } => {
      return {
        accountInfos: {
          status: 'success',
          value: [
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
          ],
        },
      };
    },
  );
}
