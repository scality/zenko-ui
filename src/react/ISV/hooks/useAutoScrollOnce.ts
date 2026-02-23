import { useCallback, useRef } from 'react';

export function useAutoScrollOnce() {
  const observerRef = useRef<MutationObserver | null>(null);

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    if (node.scrollHeight > node.clientHeight) {
      node.scrollTop = node.scrollHeight;
      return;
    }

    observerRef.current = new MutationObserver(() => {
      if (node.scrollHeight > node.clientHeight) {
        node.scrollTop = node.scrollHeight;
        observerRef.current?.disconnect();
        observerRef.current = null;
      }
    });

    observerRef.current.observe(node, { childList: true, subtree: true });
  }, []);

  return callbackRef;
}
