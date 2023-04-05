import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';

export type AccountLatestUsedCapacityPromiseResult = {
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};

type Account = {
  id: string;
  accountName: string;
  creationDate: Date;
} & AccountLatestUsedCapacityPromiseResult;

export type AccountsPromiseResult = {
  accounts: PromiseResult<Account[]>;
};
