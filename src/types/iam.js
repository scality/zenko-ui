// @flow

import type { Credentials } from './zenko';

export type IAMResp = {};

export interface IAMClient {
  login(creds: Credentials): void;
  logout(): void;
  createAccessKey(userName: string): Promise<IAMResp>;
  createUser(userName: string): Promise<IAMResp>;
  deleteAccessKey(accessKey: string, userName: string): Promise<IAMResp>;
  deleteUser(userName: string): Promise<IAMResp>;
  getUser(userName: string): Promise<IAMResp>;
  listAccessKeys(userName: string): Promise<IAMResp>;
  listOwnAccessKeys(): Promise<IAMResp>;
  listAttachedUserPolicies(userName: string): Promise<IAMResp>;
  listGroupsForUser(userName: string): Promise<IAMResp>;
  listUsers(): Promise<IAMResp>;
}
