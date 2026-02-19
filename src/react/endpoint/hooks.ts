import { ArtescaLibraryNotAvailable, useArtescaLibrary } from '../next-architecture/ui/ArtescaLibraryProvider';

/**
 * Hook that safely handles Artesca Plus Veeam mode when library is not available
 * @returns Object containing mode and status, with safe defaults when library unavailable
 */
export const useArtescaPlusVeeamMode = () => {
  const artescaLibrary = useArtescaLibrary();

  if (artescaLibrary instanceof ArtescaLibraryNotAvailable) {
    // Return safe defaults when Artesca library is not available
    return {
      artescaPlusVeeamDefaultOrOpenMode: null,
      artescaPlusVeeamDefaultOrOpenModeStatus: 'success',
      ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME: undefined,
    };
  }

  // Use the actual hook when library is available
  const { useArtescaPlusVeeamDefaultOrOpenMode, ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME } = artescaLibrary;
  const { artescaPlusVeeamDefaultOrOpenMode, artescaPlusVeeamDefaultOrOpenModeStatus } =
    // biome-ignore lint/correctness/useHookAtTopLevel: pre-existing pattern
    useArtescaPlusVeeamDefaultOrOpenMode();

  return {
    artescaPlusVeeamDefaultOrOpenMode,
    artescaPlusVeeamDefaultOrOpenModeStatus,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
  };
};
