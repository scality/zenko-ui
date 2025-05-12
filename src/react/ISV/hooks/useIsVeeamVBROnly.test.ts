import { renderHook } from '@testing-library/react-hooks';
import { useIsVeeamVBROnly } from './useIsVeeamVBROnly';
import { mockShellHooks } from '../../utils/testUtil';

// Mock the module-federation package
const mockUseDeployedApps = jest.fn();
const mockRetrieveConfiguration = jest.fn();
const mockUseConfigRetriever = jest.fn(() => ({
  retrieveConfiguration: mockRetrieveConfiguration,
}));

describe('useIsVeeamVBROnly', () => {
  beforeEach(() => {
    mockShellHooks.useDeployedApps = mockUseDeployedApps;
    mockShellHooks.useConfigRetriever = mockUseConfigRetriever;
    // Reset mock implementations before each test
    jest.clearAllMocks();
  });

  it('should return true when artesca UI exists with artesca_plus_veeam flag', () => {
    // Mock an Artesca UI app with the appropriate flag
    mockUseDeployedApps.mockReturnValue([
      { kind: 'artesca-base-ui', name: 'artesca-ui' },
    ]);

    mockRetrieveConfiguration.mockReturnValue({
      spec: {
        selfConfiguration: {
          flags: ['artesca_plus_veeam'],
        },
      },
    });

    const { result } = renderHook(() => useIsVeeamVBROnly());
    expect(result.current).toBe(true);
  });

  it('should return false when artesca UI exists without artesca_plus_veeam flag', () => {
    // Mock an Artesca UI app without the flag
    mockUseDeployedApps.mockReturnValue([
      { kind: 'artesca-base-ui', name: 'artesca-ui' },
    ]);

    mockRetrieveConfiguration.mockReturnValue({
      spec: {
        selfConfiguration: {
          flags: ['some_other_flag'],
        },
      },
    });

    const { result } = renderHook(() => useIsVeeamVBROnly());
    expect(result.current).toBe(false);
  });

  it('should return false when artesca UI exists but flags array is empty', () => {
    // Mock an Artesca UI app with an empty flags array
    mockUseDeployedApps.mockReturnValue([
      { kind: 'artesca-base-ui', name: 'artesca-ui' },
    ]);

    mockRetrieveConfiguration.mockReturnValue({
      spec: {
        selfConfiguration: {
          flags: [],
        },
      },
    });

    const { result } = renderHook(() => useIsVeeamVBROnly());
    expect(result.current).toBe(false);
  });

  it('should return false when artesca UI exists but flags is undefined', () => {
    // Mock an Artesca UI app with undefined flags
    mockUseDeployedApps.mockReturnValue([
      { kind: 'artesca-base-ui', name: 'artesca-ui' },
    ]);

    mockRetrieveConfiguration.mockReturnValue({
      spec: {
        selfConfiguration: {},
      },
    });

    const { result } = renderHook(() => useIsVeeamVBROnly());
    expect(result.current).toBe(false);
  });

  it('should return false when artesca UI does not exist', () => {
    // Mock an empty deployed apps array
    mockUseDeployedApps.mockReturnValue([
      { kind: 'some-other-ui', name: 'other-ui' },
    ]);

    const { result } = renderHook(() => useIsVeeamVBROnly());
    expect(result.current).toBe(false);
  });

  it('should return false when deployed apps is empty', () => {
    // Mock an empty deployed apps array
    mockUseDeployedApps.mockReturnValue([]);

    const { result } = renderHook(() => useIsVeeamVBROnly());
    expect(result.current).toBe(false);
  });
});
