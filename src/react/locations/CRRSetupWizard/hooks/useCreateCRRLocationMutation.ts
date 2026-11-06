import { useMutation } from 'react-query';
import type { LocationV1 } from '../../../../js/managementClient/api';
import { useCreateLocationMutation } from '../../hooks/useCreateLocationMutation';

// A taken name comes back as a bodiless 409 (the raw Response) or a 422 saying so.
const isAlreadyExists = (error: unknown): boolean => {
  if ((error as { status?: number } | null)?.status === 409) return true;
  const message = error instanceof Error ? error.message : JSON.stringify(error ?? '');
  return /already\s?exists/i.test(message);
};

/** The name derives from the chosen resources: a taken one is the location an earlier run created. */
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
