import type { PutBucketReplicationCommandInput } from '@aws-sdk/client-s3';
import { useSetBucketReplication } from '@scality/data-browser-library';
import { useEffect, useRef } from 'react';
import { useMutation } from 'react-query';

const RETRY_WINDOW_MS = 3 * 60_000;
const RETRY_INTERVAL_MS = 5_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A StorageClass the service has not loaded yet comes back as MalformedXML — the
// same code a genuinely malformed rule gets, and nothing in the response tells them
// apart. Retrying is the right trade: the chain always ensures this location just
// before, so "not applied yet" is the overwhelmingly likely cause; the cost is that
// a rule we really did build wrong is reported one window late instead of at once.
const isLocationNotYetActive = (error: unknown): boolean => {
  const candidate = error as { name?: string; originalError?: { name?: string } } | undefined;
  return [candidate?.name, candidate?.originalError?.name].includes('MalformedXML');
};

type RetryPolicy = { intervalMs?: number; windowMs?: number };

export const useCreateReplicationRuleMutation = ({
  intervalMs = RETRY_INTERVAL_MS,
  windowMs = RETRY_WINDOW_MS,
}: RetryPolicy = {}) => {
  const setBucketReplication = useSetBucketReplication();

  // So the retry loop cannot outlive the step when the user exits or cancels.
  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return useMutation({
    mutationFn: async (rule: PutBucketReplicationCommandInput) => {
      const deadline = Date.now() + windowMs;
      for (;;) {
        try {
          return await setBucketReplication.mutateAsync(rule);
        } catch (error) {
          if (cancelledRef.current || !isLocationNotYetActive(error) || Date.now() >= deadline) {
            throw error;
          }
          await delay(intervalMs);
          // Re-check: the step can be torn down while this delay is pending.
          if (cancelledRef.current) throw error;
        }
      }
    },
  });
};
