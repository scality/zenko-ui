import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';

export type AccountLatestUsedCapacityPromiseResult = {
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};
export type Role = {
  Name: string;
  Arn: string;
};

export type AccountAssumableRole = {
  assumableRoles: Role[];
  preferredAssumableRole: string;
};

export type AccountInfo = {
  id: string;
  name: string;
  canonicalId: string;
  creationDate: Date;
};

export type Account = AccountInfo &
  AccountAssumableRole &
  AccountLatestUsedCapacityPromiseResult;

export type AccountsPromiseResult = {
  accounts: PromiseResult<Account[]>;
};
