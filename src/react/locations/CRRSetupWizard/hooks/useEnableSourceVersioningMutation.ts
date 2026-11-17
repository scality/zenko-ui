import { useGetBucketVersioning, useSetBucketVersioning } from '@scality/data-browser-library';
import { useRef } from 'react';
import { useMutation } from 'react-query';

type Options = { bucketName: string; checkFirst: boolean };

type EnableVersioningInput = { Bucket: string; VersioningConfiguration: { Status: 'Enabled' } };

export const useEnableSourceVersioningMutation = ({ bucketName, checkFirst }: Options) => {
  // The failed row and its Retry button already report the error, so skip the global toast.
  const setBucketVersioning = useSetBucketVersioning({ meta: { suppressGlobalError: true } });
  // Read when the step runs, as the source account the chain has assumed by then.
  const currentVersioning = useGetBucketVersioning({ Bucket: bucketName }, { enabled: false, retry: false });
  const refetchRef = useRef(currentVersioning.refetch);
  refetchRef.current = currentVersioning.refetch;

  return useMutation({
    mutationFn: async (input: EnableVersioningInput) => {
      if (checkFirst) {
        // An Object Lock bucket is always Enabled and rejects the PUT.
        const { data } = await refetchRef.current({ throwOnError: true });
        if (data?.Status === 'Enabled') return undefined;
      }
      return setBucketVersioning.mutateAsync(input);
    },
  });
};
