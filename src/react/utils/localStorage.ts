const ROLE_ARN = 'role-arn';

export function getRoleArnStored(): string {
  return localStorage.getItem(ROLE_ARN) || '';
}
export function setRoleArnStored(roleArn: string): void {
  localStorage.setItem(ROLE_ARN, roleArn);
}
export function removeRoleArnStored(): void {
  localStorage.removeItem(ROLE_ARN);
}
