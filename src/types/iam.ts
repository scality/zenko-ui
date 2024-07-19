/* eslint-disable */
import { Credentials } from './zenko';
export type IAMResp = {};
export type WebIdentityRoles = {
  IsTruncated: boolean;
  Marker?: string;
  Accounts: Account[];
};

export type Account = {
  Name: string;
  CreationDate: Date;
  Roles: Role[];
  id: string;
};

export type Role = {
  Name: string;
  Arn: string;
};

export interface IAMClient {
  login(creds: Credentials): void;
  logout(): void;
  createAccessKey(userName: string): Promise<IAMResp>;
  createUser(userName: string): Promise<IAMResp>;
  deleteAccessKey(accessKey: string, userName: string): Promise<IAMResp>;
  updateAccessKey(
    accessKey: string,
    status: string,
    userName: string,
  ): Promise<IAMResp>;
  deleteUser(userName: string): Promise<IAMResp>;
  getUser(userName: string): Promise<IAMResp>;
  updateUser(newUserName: string, userName: string): Promise<IAMResp>;
  listAccessKeys(userName: string): Promise<IAMResp>;
  listOwnAccessKeys(): Promise<IAMResp>;
  listAttachedUserPolicies(userName: string): Promise<IAMResp>;
  listGroupsForUser(userName: string): Promise<IAMResp>;
  listUsers(): Promise<IAMResp>;
}
