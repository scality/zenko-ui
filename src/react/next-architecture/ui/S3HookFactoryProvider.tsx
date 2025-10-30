import { createContext, useContext, ReactNode } from 'react';
import {
  IS3HookFactory,
  IS3Hooks,
  S3OperationConfig,
} from '../domain/interfaces/IS3Operations';
import { useDataBrowserHooks } from '../adapters/s3/DataBrowserHookFactory';

const S3HookFactoryContext = createContext<IS3HookFactory | null>(null);

/**
 * Hook to access S3 hook factory
 *
 * @returns IS3HookFactory instance
 * @throws Error if used outside S3HookFactoryProvider
 *
 * @example
 * ```typescript
 * const factory = useS3HookFactory();
 * const s3Hooks = useS3Hooks({ objectLockEnabled: true });
 * ```
 */
export const useS3HookFactory = (): IS3HookFactory => {
  const factory = useContext(S3HookFactoryContext);

  if (!factory) {
    throw new Error(
      'useS3HookFactory must be used within S3HookFactoryProvider',
    );
  }

  return factory;
};

/**
 * Shorthand: directly get S3 hooks with optional config
 *
 * This is the main hook that components should use.
 * It properly follows Rules of Hooks and provides full config hierarchy support.
 *
 * @param config - Factory-level config (Priority 2)
 * @returns Bundle of S3 hooks
 *
 * @example
 * ```typescript
 * const s3Hooks = useS3Hooks({ region: 'eu-west-1' });
 * const createBucket = s3Hooks.useCreateBucket();
 * ```
 */
export const useS3Hooks = (config?: S3OperationConfig): IS3Hooks => {
  const factory = useS3HookFactory();
  return useDataBrowserHooks(factory, config);
};

/**
 * Provider component for S3 Hook Factory
 *
 * @param factory - The hook factory instance to provide
 * @param children - Child components
 */
export const S3HookFactoryProvider = ({
  factory,
  children,
}: {
  factory: IS3HookFactory;
  children: ReactNode;
}) => (
  <S3HookFactoryContext.Provider value={factory}>
    {children}
  </S3HookFactoryContext.Provider>
);
