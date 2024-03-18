const ROLE_ARN = 'role-arn';
const SESSION_STATE = 'session_state';

export function getRoleArnStored(): string {
  return localStorage.getItem(ROLE_ARN) || '';
}
export function setRoleArnStored(roleArn: string): void {
  localStorage.setItem(ROLE_ARN, roleArn);
}
export function removeRoleArnStored(): void {
  localStorage.removeItem(ROLE_ARN);
}
export function setSessionState(sessionState: string): void {
  localStorage.setItem(SESSION_STATE, sessionState);
}
export function getSessionState(): string {
  return localStorage.getItem(SESSION_STATE) || '';
}
