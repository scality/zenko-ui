import { ErrorPage500 } from '@scality/core-ui';
import { useDeployedXcoreInstances, useXcoreConfig } from './ConfigProvider';
import { ComponentWithFederatedImports } from '@scality/module-federation';
import { ErrorBoundary } from 'react-error-boundary';

export class XCoreLibraryNotAvailable extends Error {
  constructor() {
    super('XCore library is not available');
  }
}
const xcoreLibraryGlobal = {};
export function useXCoreLibrary() {
  //@ts-expect-error fix this when you are working on it
  if (xcoreLibraryGlobal.hooks) {
    //@ts-expect-error fix this when you are working on it
    return xcoreLibraryGlobal.hooks;
  }

  throw new XCoreLibraryNotAvailable();
}

const InternalXcoreLibraryProvider = ({
  moduleExports,
  children,
}: {
  moduleExports: Record<string, never>;
  children: React.ReactNode;
}): React.ReactNode => {
  //@ts-expect-error fix this when you are working on it
  xcoreLibraryGlobal.hooks = moduleExports['./xcoreLibrary'];
  return <>{children}</>;
};

function ErrorFallback() {
  return <ErrorPage500 data-cy="sc-error-page500" locale={'en'} />;
}

export function XCoreLibraryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const xcoreWebfinger = useXcoreConfig();
  const instances = useDeployedXcoreInstances();
  const federatedImports = instances.map((instance) => {
    return {
      scope: xcoreWebfinger.spec.hooks.xcore_library.scope,
      module: xcoreWebfinger.spec.hooks.xcore_library.module,
      remoteEntryUrl: `${instance.url}${xcoreWebfinger.spec.remoteEntryPath}?version=${instance.version}`,
    };
  });

  if (!instances.length) {
    return <>{children}</>;
  } else {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ComponentWithFederatedImports
          componentWithInjectedImports={InternalXcoreLibraryProvider}
          renderOnError={<ErrorPage500 />}
          componentProps={{
            children,
          }}
          federatedImports={federatedImports}
        />
      </ErrorBoundary>
    );
  }
}
