import type { UiFacingApiWrapper } from './managementClient';

/**
 * Pure async function shared by useCreateAccountMutation and the MCP
 * createAccount tool. Caller is responsible for building (and, where
 * relevant, re-tokenizing) the management client before invoking.
 */
export async function createAccountCore(
  client: UiFacingApiWrapper,
  params: { userName: string; email: string; instanceId: string },
) {
  const email = params.email.replace(/ /g, '-');

  return client
    .createConfigurationOverlayUser(
      { userName: params.userName, email },
      params.instanceId,
    )
    .then((res) => ({ ...res, key: 'createAccount' }))
    .catch(async (error: Response) => {
      if (error.status === 409) {
        throw { message: 'An account with the same name or email already exists' };
      }
      throw { message: 'An error occurred while creating the account' };
    });
}
