const ACCOUNT_ID_KEY = 'account-id';
export function getAccountIDStored(): string {
  return localStorage.getItem(ACCOUNT_ID_KEY) || '';
}
export function setAccountIDStored(accountID: string): void {
  localStorage.setItem(ACCOUNT_ID_KEY, accountID);
}
export function removeAccountIDStored(): void {
  localStorage.removeItem(ACCOUNT_ID_KEY);
}