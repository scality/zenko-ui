import { renderHook } from '@testing-library/react-hooks';
import { ReactNode } from 'react';
import type { UseMutationResult } from 'react-query';
import {
  ArtescaLibraryNotAvailable,
  useArtescaLibrary,
  type ArtescaLibraryHooks,
} from '../../next-architecture/ui/ArtescaLibraryProvider';
import {
  VeeamCredentialProvider,
  useVeeamCredentialManagement,
} from '../contexts/VeeamCredentialContext';

jest.mock('../../next-architecture/ui/ArtescaLibraryProvider');

const mockUseArtescaLibrary = useArtescaLibrary as jest.MockedFunction<
  typeof useArtescaLibrary
>;

describe('useVeeamCredentialManagement', () => {
  const mockChangeCredentialsMutation = {
    mutate: jest.fn(),
  } as unknown as UseMutationResult<
    unknown,
    unknown,
    { username: string; password: string }
  >;
  const mockRefetch = jest.fn();
  const mockUseIsVeeamCredentialsValid = jest.fn();
  const mockUseChangeVeeamCredentials = jest.fn();

  const mockArtescaLibrary: ArtescaLibraryHooks = {
    useIsVeeamCredentialsValid: mockUseIsVeeamCredentialsValid,
    useChangeVeeamCredentials: mockUseChangeVeeamCredentials,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <VeeamCredentialProvider>{children}</VeeamCredentialProvider>
  );

  describe('when Artesca library is available', () => {
    beforeEach(() => {
      mockUseArtescaLibrary.mockReturnValue(mockArtescaLibrary);
    });

    it('should return valid credentials status when credentials are valid', () => {
      mockUseIsVeeamCredentialsValid.mockReturnValue({
        data: { isVeeamCredentialsValid: true },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      mockUseChangeVeeamCredentials.mockReturnValue({
        changeCredentialsMutation: mockChangeCredentialsMutation,
        newCredentialsStatus: 'IDLE',
      });

      const { result } = renderHook(() => useVeeamCredentialManagement(), {
        wrapper,
      });

      expect(result.current.isCredentialsValid).toBe(true);
      expect(result.current.isCheckingCredentials).toBe(false);
      expect(result.current.isCredentialCheckError).toBe(false);
      expect(result.current.changeCredentialsMutation).toBe(
        mockChangeCredentialsMutation,
      );
    });

    it('should return invalid credentials status when credentials are invalid', () => {
      mockUseIsVeeamCredentialsValid.mockReturnValue({
        data: { isVeeamCredentialsValid: false },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      mockUseChangeVeeamCredentials.mockReturnValue({
        changeCredentialsMutation: mockChangeCredentialsMutation,
        newCredentialsStatus: 'IDLE',
      });

      const { result } = renderHook(() => useVeeamCredentialManagement(), {
        wrapper,
      });

      expect(result.current.isCredentialsValid).toBe(false);
      expect(result.current.changeCredentialsMutation).toBeDefined();
    });

    it('should indicate when checking credentials is in progress', () => {
      mockUseIsVeeamCredentialsValid.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
      });

      mockUseChangeVeeamCredentials.mockReturnValue({
        changeCredentialsMutation: mockChangeCredentialsMutation,
        newCredentialsStatus: 'IDLE',
      });

      const { result } = renderHook(() => useVeeamCredentialManagement(), {
        wrapper,
      });

      expect(result.current.isCheckingCredentials).toBe(true);
    });

    it('should refetch credentials validation when onNewCredentialsValid is called', () => {
      mockUseIsVeeamCredentialsValid.mockReturnValue({
        data: { isVeeamCredentialsValid: false },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      mockUseChangeVeeamCredentials.mockImplementation(({ onNewCredentialsValid }) => {
        onNewCredentialsValid();
        return {
          changeCredentialsMutation: mockChangeCredentialsMutation,
          newCredentialsStatus: 'VALID' as const,
        };
      });

      renderHook(() => useVeeamCredentialManagement(), { wrapper });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should provide credential update mutation with all status states', () => {
      mockUseIsVeeamCredentialsValid.mockReturnValue({
        data: { isVeeamCredentialsValid: false },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      const statuses = [
        'IDLE',
        'WAITING',
        'VALID',
        'INVALID',
        'ERROR',
      ] as const;

      statuses.forEach((status) => {
        mockUseChangeVeeamCredentials.mockReturnValue({
          changeCredentialsMutation: mockChangeCredentialsMutation,
          newCredentialsStatus: status,
        });

        const { result } = renderHook(() => useVeeamCredentialManagement(), {
          wrapper,
        });

        expect(result.current.newCredentialsStatus).toBe(status);
      });
    });

});

  describe('when Artesca library is not available', () => {
    beforeEach(() => {
      mockUseArtescaLibrary.mockReturnValue(new ArtescaLibraryNotAvailable());
    });

    it('should provide default context treating credentials as valid', () => {
      const { result } = renderHook(() => useVeeamCredentialManagement(), {
        wrapper,
      });

      expect(result.current.isCredentialsValid).toBe(true);
      expect(result.current.isCheckingCredentials).toBe(false);
      expect(result.current.isCredentialCheckError).toBe(false);
      expect(result.current.changeCredentialsMutation).toBeNull();
      expect(result.current.newCredentialsStatus).toBe('IDLE');
    });
  });
});
