import type { ProblemCode } from './types';

export type ProblemCopyContext = { targetBucketName?: string };

const problemCopy: Partial<Record<ProblemCode, (ctx: ProblemCopyContext) => string>> = {
  DestinationUnreachable: () => 'Failed to reach the destination. Check the base domain and your network connection.',
  DestinationCertificateInvalid: () => 'The destination certificate is invalid.',
  DestinationAuthFailed: () => 'Failed to authenticate with the destination. Check your credentials.',
  AssumeRoleFailed: () => 'Failed to assume the replication role on the destination.',
  Unauthorized: () => 'Your session has expired. Sign in again.',
  Forbidden: () => 'You are not authorized to configure replication.',
  TargetBucketObjectLockRequired: ({ targetBucketName }) =>
    `The destination bucket${targetBucketName ? ` "${targetBucketName}"` : ''} does not have Object Lock enabled. Object Lock can only be enabled when a bucket is created. Go back and pick a destination bucket with Object Lock enabled, or create a new bucket.`,
};

export const problemMessage = (
  code: ProblemCode | undefined,
  fallback: string,
  ctx: ProblemCopyContext = {},
): string => {
  const copy = code ? problemCopy[code] : undefined;
  return copy ? copy(ctx) : fallback;
};
