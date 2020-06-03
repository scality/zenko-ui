# Authentication flow

### Prerequisite

ZenkoUI application uses a client (RP) that supports OAuth 2.0 and relies on the OpenID provider to authenticate the end user and to request claims about that user.

### Steps

- User tries to access ZenkoUI private routes<sup>1</sup>.
- ZenkoUI loads configuration that contains OIDC, STS, S3 and Vault IAM client endpoints.
- ZenkoUI loads any existing user session data (from sessionstorage) into the redux store.
- ZenkoUI checks if a non-expired user is stored in the redux store.
- If the user is not stored or has expired, the user is authenticated. An authorization code grant type with PKCE<sup>2</sup> is used to obtain access token, ID token and refresh token.

- Once the user is authenticated, ZenkoUI instantiates the management API client (using the ID token) as well as the STS client.
- ZenkoUI calls `sts.assumeRoleWithWebIdentity()` (with the ID token and a role ARN based on user’s role) that returns temporary security credentials.
- ZenkoUI instantiates S3 and Vault IAM clients with these temporary credentials.
- ZenkoUI makes listing calls (e.g. list buckets, list accounts and list users) to validate that clients’ endpoints and credentials are correct  #failfast.

### Actions

Every time tokens are renewed<sup>3</sup>, ZenkoUI updates its clients using the new ID token.

If an authn/authz error occurs, the user can:
- Renew token and update clients
- Log out


### Notes

<sup>1</sup> private routes: routes only accessible to authenticated user

<sup>2</sup> For now, we only support Authorization Code Flow with Proof Key for Code Exchange (PKCE).

<sup>3</sup> ZenkoUI renews tokens prior to their expiration using the refresh token.
