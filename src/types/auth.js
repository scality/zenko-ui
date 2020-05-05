// @flow

export type AuthUser = {
  +id_token: string,
  +session_state?: string,
  +access_token: string,
  +refresh_token?: string,
  +token_type: string,
  +scope: string,
  +profile: Profile,
  +expires_at: number,
  +state: any,
  +expires_in?: number,
  +expired?: boolean,
  +scopes?: string[],
};

export type Profile = IDTokenClaims & ProfileStandardClaims;

export type IDTokenClaims = {
  /** Issuer Identifier */
  iss?: string,
  /** Subject identifier */
  sub: string,
  /** Audience(s): client_id ... */
  aud?: string,
  /** Expiration time */
  exp?: number,
  /** Issued at */
  iat?: number,
  /** Time when the End-User authentication occurred */
  auth_time?: number,
  /** Time when the End-User authentication occurred */
  nonce?: number,
  /** Access Token hash value */
  at_hash?: string,
  /** Authentication Context Class Reference */
  acr?: string,
  /** Authentication Methods References */
  amr?: string[],
  /** Authorized Party - the party to which the ID Token was issued */
  azp?: string,
  /** Session ID - String identifier for a Session */
  sid?: string,
  /** Other custom claims */
  [claimKey: string]: any,
};

export type ProfileStandardClaims = {
  /** End-User's full name */
  name?: string,
  /** Given name(s) or first name(s) of the End-User */
  given_name?: string,
  /** Surname(s) or last name(s) of the End-User */
  family_name?: string,
  /** Middle name(s) of the End-User */
  middle_name?: string,
  /** Casual name of the End-User that may or may not be the same as the given_name. */
  nickname?: string,
  /** Shorthand name that the End-User wishes to be referred to at the RP, such as janedoe or j.doe. */
  preferred_username?: string,
  /** URL of the End-User's profile page */
  profile?: string,
  /** URL of the End-User's profile picture */
  picture?: string,
  /** URL of the End-User's Web page or blog */
  website?: string,
  /** End-User's preferred e-mail address */
  email?: string,
  /** True if the End-User's e-mail address has been verified; otherwise false. */
  email_verified?: boolean,
  /** End-User's gender. Values defined by this specification are female and male. */
  gender?: string,
  /** End-User's birthday, represented as an ISO 8601:2004 [ISO8601‑2004] YYYY-MM-DD format */
  birthdate?: string,
  /** String from zoneinfo [zoneinfo] time zone database representing the End-User's time zone. */
  zoneinfo?: string,
  /** End-User's locale, represented as a BCP47 [RFC5646] language tag. */
  locale?: string,
  /** End-User's preferred telephone number. */
  phone_number?: string,
  /** True if the End-User's phone number has been verified; otherwise false. */
  phone_number_verified?: boolean,
  /** Time the End-User's information was last updated. */
  updated_at?: number,
};

export interface UserManager {
  signinRedirect(args?: any): Promise<void>,

  signinRedirectCallback(url?: string): Promise<AuthUser>,

  removeUser(): Promise<void>;

  signoutPopup(args?: any): Promise<void>;

  signoutPopupCallback(url?: string, keepOpen?: boolean): Promise<void>;
}
