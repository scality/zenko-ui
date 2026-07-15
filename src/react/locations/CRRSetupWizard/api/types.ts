// Types for the crr-configurator REST API.
// Source of truth: `openapi.yaml` in scality/crr-configurator.
//
// This file contains types only — no runtime code. The fetch helper
// and react-query hooks that use these types live in follow-up
// modules.

export type HostAlias = { hostname: string; ip: string };

export type DestinationConnection =
  | {
      mode: 'management-network';
      baseUrl: string;
      adminUser: string;
      adminPassword: string;
    }
  | {
      mode: 'data-network';
      baseDomain: string;
      s3Endpoint: string;
      adminUser: string;
      adminPassword: string;
    };

export type VerifyRequestBody = {
  destinationConnection: DestinationConnection;
  destinationCertificate: string;
  hostAliases?: HostAlias[];
};

export type VerifyResponse =
  | {
      ok: true;
      mode: 'management-network';
      instanceName: string;
      artescaVersion?: string;
    }
  | { ok: true; mode: 'data-network' };

export type StartSetupBody = {
  destinationConnection: DestinationConnection;
  destinationCertificate: string;
  destinationAccount: { mode: 'create' | 'existing'; name: string };
  targetBucket?: string;
  hostAliases?: HostAlias[];
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
  | 'DestinationDnsResolutionFailed'
  | 'DestinationCertificateInvalid'
  | 'DestinationAuthFailed'
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
  unresolvedHosts?: string[];
};
