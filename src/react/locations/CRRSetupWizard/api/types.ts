// Types for the crr-configurator REST API.
// Source of truth: `openapi.yaml` in scality/crr-configurator.
//
// This file contains types only — no runtime code. The fetch helper
// and react-query hooks that use these types live in follow-up
// modules.

export type DestinationConnection = {
  baseDomain: string;
  adminUser: string;
  adminPassword: string;
};

export type ConnectionRequestBody = {
  destinationConnection: DestinationConnection;
  destinationCertificate: string;
};

export type DestinationEndpoint = {
  hostname: string;
  locationName: string;
};

export type DestinationAccount = {
  name: string;
  id: string;
};

/** `connectionId` stands in for the admin credentials on every later call, until `expiresAt`. */
export type ConnectionResponse = {
  connectionId: string;
  expiresAt: string;
  endpoints: DestinationEndpoint[];
  accounts: DestinationAccount[];
};

export type ResolveRequestBody = {
  s3Endpoint: string;
  destinationCertificate: string;
};

export type ResolveResponse = {
  resolvable: boolean;
};

export type StartSetupBody = {
  s3Endpoint: string;
  destinationAccount: { mode: 'create' | 'existing'; name: string };
  targetBucket?: string;
};

export type StartSetupVariables = {
  connectionId: string;
  body: StartSetupBody;
};

export type SetupResult = {
  endpoint: string;
  stsEndpoint: string;
  accessKey: string;
  secretKey: string;
  roleArn: string;
  targetBucket?: string;
};

export type SetupErrorPayload = {
  code: ProblemCode;
  message: string;
  step?: string;
};

export type StepStarted = { event: 'step.started'; step: string; at: string };
export type StepCompleted = {
  event: 'step.completed';
  step: string;
  at: string;
  data?: Record<string, unknown>;
};
export type StepFailed = {
  event: 'step.failed';
  step: string;
  at: string;
  error: SetupErrorPayload;
};
export type SetupCompleted = {
  event: 'setup.completed';
  at: string;
  result: SetupResult;
};
export type SetupFailed = {
  event: 'setup.failed';
  at: string;
  error: SetupErrorPayload;
};

export type SetupEvent = StepStarted | StepCompleted | StepFailed | SetupCompleted | SetupFailed;

export type ProblemCode =
  | 'DestinationUnreachable'
  | 'DestinationCertificateInvalid'
  | 'DestinationAuthFailed'
  | 'DestinationRefreshUnavailable'
  | 'ConnectionInvalid'
  | 'AssumeRoleFailed'
  | 'OverlayTimeout'
  | 'ReplicationConfigRejected'
  | 'ZenkoCRReconcileTimeout'
  | 'BucketAlreadyExists'
  | 'InvalidRequest'
  | 'Unauthorized'
  | 'Forbidden'
  | 'InternalError';

export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code?: ProblemCode;
};
