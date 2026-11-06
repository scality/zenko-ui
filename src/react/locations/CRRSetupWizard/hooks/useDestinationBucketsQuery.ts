import { useShellHooks } from '@scality/module-federation';
import { useQuery } from 'react-query';
import { listDestinationBuckets } from '../api/crrConfiguratorClient';
import type { ListBucketsRequestBody } from '../api/types';

export const useDestinationBucketsQuery = (body: ListBucketsRequestBody | null) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  return useQuery({
    // The password stays out of the key: it would otherwise sit in the query cache.
    queryKey: [
      'crr-configurator',
      'destination-buckets',
      body?.destinationConnection.baseDomain,
      body?.destinationConnection.adminUser,
      body?.accountName,
    ],
    queryFn: async ({ signal }) => {
      if (!body) throw new Error('No destination account to list buckets for');
      const { buckets } = await listDestinationBuckets(body, { token: await getToken(), signal });
      return buckets.map((bucket) => bucket.name);
    },
    enabled: body !== null,
    staleTime: 30_000,
    retry: false,
  });
};
