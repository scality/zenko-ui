import { createContext, useContext, useMemo } from 'react';
import { type UseMutationResult, useQueryClient } from 'react-query';
import {
  type ArtescaLibraryHooks,
  ArtescaLibraryNotAvailable,
  type NewCredentialsStatus,
  useArtescaLibrary,
} from '../../next-architecture/ui/ArtescaLibraryProvider';

type VeeamCredentialContextValue = {
  isCredentialsValid: boolean;
  isCheckingCredentials: boolean;
  isCredentialCheckError: boolean;
  changeCredentialsMutation: UseMutationResult<unknown, unknown, { username: string; password: string }> | null;
  newCredentialsStatus: NewCredentialsStatus;
};

const VeeamCredentialContext = createContext<VeeamCredentialContextValue | null>(null);

const VeeamCredentialProviderInternal = ({
  children,
  artescaLibrary,
}: {
  children: React.ReactNode;
  artescaLibrary: ArtescaLibraryHooks;
}) => {
  const queryClient = useQueryClient();
  const validationResult = artescaLibrary.useIsVeeamCredentialsValid();

  const updateResult = artescaLibrary.useChangeVeeamCredentials({
    onNewCredentialsValid: () => {
      queryClient.invalidateQueries(['veeam_credential_valid']);
    },
  });

  const value = useMemo(
    () => ({
      isCredentialsValid: validationResult.data?.isVeeamCredentialsValid ?? true,
      isCheckingCredentials: validationResult.isLoading,
      isCredentialCheckError: validationResult.isError,
      changeCredentialsMutation: updateResult.changeCredentialsMutation,
      newCredentialsStatus: updateResult.newCredentialsStatus,
    }),
    [validationResult, updateResult],
  );

  return <VeeamCredentialContext.Provider value={value}>{children}</VeeamCredentialContext.Provider>;
};

const defaultContextValue: VeeamCredentialContextValue = {
  // When ArtescaLibrary is unavailable, credential validation doesn't apply.
  isCredentialsValid: true,
  isCheckingCredentials: false,
  isCredentialCheckError: false,
  changeCredentialsMutation: null,
  newCredentialsStatus: 'IDLE',
};

export const VeeamCredentialProvider = ({ children }: { children: React.ReactNode }) => {
  const artescaLibrary = useArtescaLibrary();

  if (artescaLibrary instanceof ArtescaLibraryNotAvailable) {
    return <VeeamCredentialContext.Provider value={defaultContextValue}>{children}</VeeamCredentialContext.Provider>;
  }

  return <VeeamCredentialProviderInternal artescaLibrary={artescaLibrary}>{children}</VeeamCredentialProviderInternal>;
};

export const useVeeamCredentialManagement = () => {
  const context = useContext(VeeamCredentialContext);
  if (!context) {
    throw new Error('useVeeamCredentialManagement must be used within VeeamCredentialProvider');
  }
  return context;
};
