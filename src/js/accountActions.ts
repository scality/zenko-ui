import makeMgtClient from './managementClient';

/**
 * Pure async function extracted from useCreateAccountMutation.
 * Can be called from both React Query mutation hooks and MCP tools.
 */
export async function createAccountCore(
  managementEndpoint: string,
  token: string,
  params: { userName: string; email: string; instanceId: string },
) {
  const client = makeMgtClient(managementEndpoint, token);
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
