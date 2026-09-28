/**
 * The S3 code sits on `name`, but EnhancedS3Error may carry its own class name
 * there and keep the real code on the wrapped error — so consider both.
 */
const errorCodes = (error: unknown): string[] => {
  const candidate = error as { name?: string; originalError?: { name?: string } } | undefined;
  return [candidate?.name, candidate?.originalError?.name].filter((code): code is string => Boolean(code));
};

/**
 * The wizard reuses a source bucket that is already there, so S3 answering
 * "you already own it" means the step is done, not failed.
 */
export const isBucketAlreadyOwned = (error: unknown): boolean => errorCodes(error).includes('BucketAlreadyOwnedByYou');

const COPY: Record<string, (bucket?: string) => string> = {
  BucketAlreadyExists: (bucket) =>
    `The bucket name ${bucket ? `"${bucket}" ` : ''}is already taken by another account. Choose a different name.`,
  AccessDenied: () => 'You are not authorized to perform this operation. Check the account permissions.',
  NoSuchBucket: (bucket) => `The bucket ${bucket ? `"${bucket}" ` : ''}no longer exists.`,
};

/**
 * Raw SDK messages are written for the protocol, not the operator — map the ones
 * a user can act on and keep the original text as a last resort.
 */
export const s3ErrorMessage = (error: unknown, bucket?: string): string | undefined => {
  if (!error) {
    return undefined;
  }
  const code = errorCodes(error).find((candidate) => candidate in COPY);
  return code ? COPY[code](bucket) : (error as Error).message;
};
