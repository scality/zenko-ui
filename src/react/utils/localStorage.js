// @flow

const ROLE_ARN_KEY = 'role';

export function getRoleArnStored(): string {
    return localStorage.getItem(ROLE_ARN_KEY) || '';
}

export function setRoleArnStored(roleArn: string): void {
    localStorage.setItem(ROLE_ARN_KEY, roleArn);
}

export function removeRoleArnStored(): void {
    localStorage.removeItem(ROLE_ARN_KEY);
}
