import { AccountInfo } from '../../domain/entities/account';
import { PromiseResult } from '../../domain/entities/promise';
import { IAccessibleAccounts } from './IAccessibleAccounts';
import {
  ACCOUNT,
  NEWLY_CREATED_ACCOUNT,
} from '../../../../js/mock/managementClientMSWHandlers';

export class MockedAccessibleAcounts implements IAccessibleAccounts {
  useListAccessibleAccounts = jest
    .fn()
    .mockImplementation((): PromiseResult<AccountInfo[]> => {
      return { status: 'success', value: [ACCOUNT, NEWLY_CREATED_ACCOUNT] };
    });
}
