import { renderHook } from '@testing-library/react-hooks';
import { getSessionState } from '../../utils/localStorage';
import { NewWrapper } from '../../utils/testUtil';
import { useNextLogin } from './useNextLogin';

jest.mock('../../utils/localStorage', () => ({
  getSessionState: jest.fn(),
}));

const mockGetSessionState = getSessionState as jest.Mock;

describe('useNextLogin', () => {
  it('should return true if actual session state is different from local storage session state', () => {
    const localStorageSessionState = 'session-state-2';

    mockGetSessionState.mockReturnValueOnce(localStorageSessionState);

    const { result } = renderHook(() => useNextLogin(), {
      wrapper: NewWrapper(),
    });

    expect(result.current.isNextLogin).toBe(true);
  });

  it('should return false if actual session state is same as local storage session state', () => {
    const sessionState = 'session-state-1';

    mockGetSessionState.mockReturnValueOnce(sessionState);

    const { result } = renderHook(() => useNextLogin(), {
      wrapper: NewWrapper(),
    });

    expect(result.current.isNextLogin).toBe(false);
  });

  it('should return true when where is no session state in local storage', () => {
    mockGetSessionState.mockReturnValue('');

    const { result } = renderHook(() => useNextLogin(), {
      wrapper: NewWrapper(),
    });

    expect(result.current.isNextLogin).toBe(true);
  });
});
