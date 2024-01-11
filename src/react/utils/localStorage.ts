const ROLE_ARN = 'role-arn';
const SKIP_VEEAM_ASSISTANT = 'isVeeamAssistantSkipped';
export function getRoleArnStored(): string {
  return localStorage.getItem(ROLE_ARN) || '';
}
export function setRoleArnStored(roleArn: string): void {
  localStorage.setItem(ROLE_ARN, roleArn);
}
export function removeRoleArnStored(): void {
  localStorage.removeItem(ROLE_ARN);
}
export function setSkipVeeamAssistant(): void {
  localStorage.setItem(SKIP_VEEAM_ASSISTANT, 'true');
}
export function getSkipVeeamAssistant(): boolean {
  return localStorage.getItem(SKIP_VEEAM_ASSISTANT) === 'true';
}
