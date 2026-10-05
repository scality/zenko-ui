import { useMutation } from 'react-query';
import type { LocationV1 } from '../../../../js/managementClient/api';
import { useCreateLocationMutation } from '../../hooks/useCreateLocationMutation';

const isAlreadyExists = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : JSON.stringify(error ?? '');
  return /already\s?exists/i.test(message);
};

export const useCreateCRRLocationMutation = () => {
  const createLocation = useCreateLocationMutation();

  return useMutation({
    mutationFn: async (location: LocationV1) => {
      try {
        await createLocation.mutateAsync(location);
      } catch (error) {
        if (!isAlreadyExists(error)) throw error;
      }
    },
  });
};
