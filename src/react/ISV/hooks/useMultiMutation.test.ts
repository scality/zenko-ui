import { renderHook, act } from '@testing-library/react-hooks';
import { useMultiMutation, MutationWithKey } from './useMultiMutation';

describe('useMultiMutation', () => {
  const mockItems = ['item1', 'item2', 'item3'];

  const createMockMutation = (key: string): MutationWithKey =>
    ({
      key,
      mutate: jest.fn(),
      reset: jest.fn(),
      isLoading: false,
      isSuccess: true,
      isError: false,
      isIdle: false,
      status: 'success',
      data: { id: key },
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      isPending: false,
      variables: null,
      mutateAsync: jest.fn(),
      context: null,
    } as unknown as MutationWithKey);

  describe('initialization', () => {
    it('should initialize with empty mutations object', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems));

      expect(result.current.mutations).toEqual({});
      expect(result.current.isAllMutationsReady).toBe(false);
    });
  });

  describe('handleMutationReady', () => {
    it('should add mutation through handleMutationReady', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems));

      const mockMutation = createMockMutation('item1');

      act(() => {
        result.current.handleMutationReady('item1', mockMutation);
      });

      expect(result.current.mutations).toHaveProperty('item1');
      expect(result.current.mutations.item1).toBe(mockMutation);
      expect(result.current.isAllMutationsReady).toBe(false);
    });

    it('should update existing mutation with same key', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems));

      const firstMutation = createMockMutation('item1');
      const updatedMutation = createMockMutation('item1');

      act(() => {
        result.current.handleMutationReady('item1', firstMutation);
        result.current.handleMutationReady('item1', updatedMutation);
      });

      expect(result.current.mutations.item1).toBe(updatedMutation);
      expect(result.current.mutations.item1).not.toBe(firstMutation);
    });
  });

  describe('isAllMutationsReady', () => {
    it('should be true when all mutations are ready', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems));

      act(() => {
        result.current.handleMutationReady(
          'item1',
          createMockMutation('item1'),
        );
        result.current.handleMutationReady(
          'item2',
          createMockMutation('item2'),
        );
        result.current.handleMutationReady(
          'item3',
          createMockMutation('item3'),
        );
      });

      expect(Object.keys(result.current.mutations).length).toBe(3);
      expect(result.current.isAllMutationsReady).toBe(true);
    });

    it('should be false when only some mutations are ready', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems));

      act(() => {
        result.current.handleMutationReady(
          'item1',
          createMockMutation('item1'),
        );
        result.current.handleMutationReady(
          'item2',
          createMockMutation('item2'),
        );
      });

      expect(Object.keys(result.current.mutations).length).toBe(2);
      expect(result.current.isAllMutationsReady).toBe(false);
    });
  });

  describe('expectedTotal parameter', () => {
    it('should support custom expectedTotal parameter', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems, 2));

      act(() => {
        result.current.handleMutationReady(
          'item1',
          createMockMutation('item1'),
        );
        result.current.handleMutationReady(
          'item2',
          createMockMutation('item2'),
        );
      });

      expect(Object.keys(result.current.mutations).length).toBe(2);
      expect(result.current.isAllMutationsReady).toBe(true);
    });

    it('should remain ready when adding more mutations than expectedTotal', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems, 2));

      act(() => {
        result.current.handleMutationReady(
          'item1',
          createMockMutation('item1'),
        );
        result.current.handleMutationReady(
          'item2',
          createMockMutation('item2'),
        );
      });

      expect(result.current.isAllMutationsReady).toBe(true);

      act(() => {
        result.current.handleMutationReady(
          'item3',
          createMockMutation('item3'),
        );
      });

      expect(Object.keys(result.current.mutations).length).toBe(3);
      expect(result.current.isAllMutationsReady).toBe(true);
    });

    it('should handle expectedTotal greater than items length', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems, 5));

      act(() => {
        result.current.handleMutationReady(
          'item1',
          createMockMutation('item1'),
        );
        result.current.handleMutationReady(
          'item2',
          createMockMutation('item2'),
        );
        result.current.handleMutationReady(
          'item3',
          createMockMutation('item3'),
        );
      });

      expect(Object.keys(result.current.mutations).length).toBe(3);
      expect(result.current.isAllMutationsReady).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle keys not in original items array', () => {
      const { result } = renderHook(() => useMultiMutation(mockItems));

      act(() => {
        result.current.handleMutationReady(
          'newItem',
          createMockMutation('newItem'),
        );
      });

      expect(result.current.mutations).toHaveProperty('newItem');
      expect(result.current.isAllMutationsReady).toBe(false);
    });

    it('should work with empty items array', () => {
      const { result } = renderHook(() => useMultiMutation([]));

      expect(result.current.isAllMutationsReady).toBe(true);

      act(() => {
        result.current.handleMutationReady(
          'someKey',
          createMockMutation('someKey'),
        );
      });

      expect(Object.keys(result.current.mutations).length).toBe(1);
      expect(result.current.isAllMutationsReady).toBe(true);
    });
  });
});
