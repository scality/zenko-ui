import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';

export type AccountLatestUsedCapacityPromiseResult = {
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};
export type AccountInfo = {
  id: string;
  name: string;
  canonicalId: string;
  creationDate: Date;
};

export type Account = AccountInfo & AccountLatestUsedCapacityPromiseResult;

export type AccountsPromiseResult = {
  accounts: PromiseResult<Account[]>;
};
